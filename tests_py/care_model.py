from __future__ import annotations

from dataclasses import dataclass, field
import re


class PermissionDenied(Exception):
    pass


class Conflict(Exception):
    pass


@dataclass(frozen=True)
class Actor:
    id: str
    role: str
    clinic_id: str


@dataclass
class Note:
    id: str
    clinic_id: str
    author_role: str
    content: str
    patient_visible: bool = False
    patient_release_state: str = "not_applicable"
    version: int = 1
    versions: dict[int, str] = field(default_factory=dict)

    def __post_init__(self):
        self.versions.setdefault(self.version, self.content)


class CareModel:
    def __init__(self):
        self.notes: dict[str, Note] = {}
        self.audit: list[dict] = []
        self.highlights: dict[str, dict] = {}
        self.signal_weights: dict[str, int] = {}
        self.feedback_events: list[dict] = []
        self.conflicts: dict[str, dict] = {}

    def add_note(self, note: Note):
        self.notes[note.id] = note

    def can_view(self, actor: Actor, note: Note) -> bool:
        if actor.clinic_id != note.clinic_id:
            return False
        if actor.role == "patient":
            return note.patient_visible and note.patient_release_state in {"clinician_approved", "rule_verified"}
        if actor.role == "staff":
            return note.author_role != "clinician"
        return actor.role in {"clinician", "admin"}

    def can_edit(self, actor: Actor, note: Note) -> bool:
        return actor.clinic_id == note.clinic_id and (
            (actor.role == "staff" and note.author_role == "staff")
            or (actor.role == "clinician" and note.author_role == "clinician")
        )

    def read(self, actor: Actor, note_id: str) -> str:
        note = self.notes[note_id]
        allowed = self.can_view(actor, note)
        self.audit.append({"actor": actor.id, "action": "read", "resource": note_id, "outcome": "success" if allowed else "denied"})
        if not allowed:
            raise PermissionDenied
        return note.content

    def edit(self, actor: Actor, note_id: str, content: str, expected_version: int) -> int:
        note = self.notes[note_id]
        if not self.can_edit(actor, note):
            self.audit.append({"actor": actor.id, "action": "edit", "resource": note_id, "outcome": "denied"})
            raise PermissionDenied
        if expected_version != note.version:
            self.audit.append({"actor": actor.id, "action": "edit", "resource": note_id, "outcome": "conflict", "version": note.version})
            raise Conflict
        before = note.version
        note.version += 1
        note.content = content
        note.versions[note.version] = content
        self.audit.append({"actor": actor.id, "action": "edit", "resource": note_id, "outcome": "success", "before": before, "after": note.version})
        return note.version

    def revert(self, actor: Actor, note_id: str, target_version: int) -> int:
        note = self.notes[note_id]
        if not self.can_edit(actor, note):
            raise PermissionDenied
        content = note.versions[target_version]
        return self.edit(actor, note_id, content, note.version)

    def add_highlight(self, highlight_id: str, source_note_id: str, source_version: int, source_quote: str, signal_key: str, severity: str = "medium"):
        note = self.notes[source_note_id]
        if source_version not in note.versions or source_quote not in note.versions[source_version]:
            raise ValueError("unresolvable provenance")
        self.highlights[highlight_id] = {
            "source_note_id": source_note_id,
            "source_version": source_version,
            "source_quote": source_quote,
            "signal_key": signal_key,
            "severity": severity,
            "evidence_coverage": 1.0,
            "evidence_method": "exact_span",
            "score": 50 + self.signal_weights.get(signal_key, 0),
        }

    def resolve_highlight(self, highlight_id: str) -> str:
        item = self.highlights[highlight_id]
        return self.notes[item["source_note_id"]].versions[item["source_version"]]

    def review_highlight(self, actor: Actor, highlight_id: str, accepted: bool):
        if actor.role != "clinician":
            raise PermissionDenied
        item = self.highlights[highlight_id]
        signal = item["signal_key"]
        eligible = accepted and item["severity"] != "critical"
        delta = 4 if eligible else 0
        reason = "bounded_positive_confirmation" if eligible else (
            "critical_safety_floor_locked" if item["severity"] == "critical" else "rejection_requires_reason"
        )
        self.signal_weights[signal] = max(-20, min(20, self.signal_weights.get(signal, 0) + delta))
        self.feedback_events.append({"highlight": highlight_id, "eligible": eligible, "delta": delta, "reason": reason})

    def add_dose_conflict(self, conflict_id: str, left_note_id: str, left_quote: str, right_note_id: str, right_quote: str):
        if left_quote not in self.notes[left_note_id].content or right_quote not in self.notes[right_note_id].content:
            raise ValueError("unresolvable conflict source")
        self.conflicts[conflict_id] = {
            "domain": "dose",
            "status": "open",
            "left": (left_note_id, left_quote),
            "right": (right_note_id, right_quote),
            "failure_action": "abstain_patient_release",
        }

    def resolve_conflict(self, actor: Actor, conflict_id: str, resolution: str):
        if actor.role != "clinician":
            raise PermissionDenied
        self.conflicts[conflict_id].update({"status": "resolved", "resolution": resolution})
        self.audit.append({"actor": actor.id, "action": "conflict.resolve", "resource": conflict_id, "outcome": "success"})


def redact_before_llm(text: str) -> str:
    patterns = [
        (r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b", "[EMAIL]", re.I),
        (r"(?<!\d)(?:\+?65[ -]?)?[689]\d{3}[ -]?\d{4}(?!\d)", "[PHONE]", 0),
        (r"\b[STFGM]\d{7}[A-Z]\b", "[ID]", re.I),
        (r"\b(?:Ms|Mr|Mrs|Dr)\.?\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b", "[NAME]", 0),
    ]
    redacted = text
    for pattern, replacement, flags in patterns:
        redacted = re.sub(pattern, replacement, redacted, flags=flags)
    return redacted
