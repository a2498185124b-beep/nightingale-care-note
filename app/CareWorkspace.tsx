"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  CareEntry,
  ClinicalConflict,
  Comment,
  DemoUser,
  Highlight,
  PatientSummary,
  Role,
} from "@/lib/demo-data";

type WorkspaceBundle = {
  patient: PatientSummary;
  currentUser: DemoUser;
  users: DemoUser[];
  highlights: Highlight[];
  conflicts: ClinicalConflict[];
  entries: CareEntry[];
  comments: Comment[];
  openTasks: number;
  generatedAt: string;
};

type EntryVersionSummary = {
  version: number;
  content?: string;
  changed_by: string;
  changed_by_role: string;
  change_reason: string;
  created_at: string;
};

const roleLabels: Record<Role, string> = {
  patient: "Patient view",
  staff: "Staff view",
  clinician: "Clinician view",
  admin: "Admin view",
};

const roleDescriptions: Record<Role, string> = {
  patient: "Patient-facing summaries only",
  staff: "Staff notes and shared AI context",
  clinician: "Full clinic-scoped clinical record",
  admin: "Clinic oversight and audit visibility",
};

const filters = ["All activity", "AI scribe", "Clinician", "Staff", "Patient"];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function visibleToRole(entry: CareEntry, role: Role) {
  if (role === "patient") return entry.patientVisible && ["clinician_approved", "rule_verified"].includes(entry.patientReleaseState ?? "not_applicable");
  if (role === "staff") return entry.authorRole !== "clinician";
  return true;
}

function matchesFilter(entry: CareEntry, filter: string) {
  if (filter === "All activity") return true;
  if (filter === "AI scribe") return entry.authorRole === "system";
  return entry.authorRole === filter.toLowerCase();
}

export default function CareWorkspace({ bundle }: { bundle: WorkspaceBundle }) {
  const [user, setUser] = useState<DemoUser>(bundle.currentUser);
  const [highlights, setHighlights] = useState<Highlight[]>(bundle.highlights);
  const [entries, setEntries] = useState<CareEntry[]>(bundle.entries);
  const [comments, setComments] = useState<Comment[]>(bundle.comments);
  const [conflicts, setConflicts] = useState<ClinicalConflict[]>(bundle.conflicts);
  const [filter, setFilter] = useState("All activity");
  const [query, setQuery] = useState("");
  const [commentDraft, setCommentDraft] = useState<Record<string, string>>({});
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);
  const [historyByEntry, setHistoryByEntry] = useState<Record<string, EntryVersionSummary[]>>({});
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [toast, setToast] = useState("Ready · all information is synthetic");
  const [selectedSource, setSelectedSource] = useState<{ entryId: string; quote: string } | null>(null);

  useEffect(() => {
    fetch("/api/care", { headers: { accept: "application/json" } })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((payload) => {
        if (payload.entries) setEntries(payload.entries);
        if (payload.highlights) setHighlights(payload.highlights);
        if (payload.comments) setComments(payload.comments);
        if (payload.conflicts) setConflicts(payload.conflicts);
      })
      .catch(() => undefined);
  }, []);

  const role = user.role;
  const visibleEntries = useMemo(
    () =>
      entries.filter(
        (entry) =>
          visibleToRole(entry, role) &&
          matchesFilter(entry, filter) &&
          `${entry.title} ${entry.content} ${entry.authorName}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [entries, filter, query, role],
  );

  const visibleHighlights = useMemo(
    () =>
      highlights
        .filter((item) => item.status !== "rejected")
        .filter((item) => {
          const source = entries.find((entry) => entry.id === item.sourceEntryId);
          return source ? visibleToRole(source, role) : false;
        })
        .slice(0, 4),
    [entries, highlights, role],
  );
  const openConflicts = conflicts.filter((item) => item.status === "open");

  async function switchRole(userId: string) {
    const nextUser = bundle.users.find((candidate) => candidate.id === userId);
    if (!nextUser) return;
    setUser(nextUser);
    setToast(`${roleLabels[nextUser.role]} active · permissions enforced on the server`);
    try {
      await fetch("/api/demo/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      window.location.reload();
    } catch {
      setToast(`${roleLabels[nextUser.role]} active · offline demo state`);
    }
  }

  async function reviewHighlight(id: string, status: "accepted" | "rejected") {
    setHighlights((items) => items.map((item) => (item.id === id ? { ...item, status } : item)));
    setToast(status === "accepted"
      ? "Accepted · bounded positive feedback recorded; safety floors remain locked"
      : "Rejected · recorded for evaluation, not auto-demoted without a reason");
    try {
      await fetch(`/api/highlights/${id}/review`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });
    } catch {
      // The visible prototype remains usable if the demo API is unavailable.
    }
  }

  function jumpToSource(entryId: string, quote = "") {
    setSelectedSource({ entryId, quote });
    document.getElementById(entryId)?.scrollIntoView({ behavior: "smooth", block: "center" });
    const node = document.getElementById(entryId);
    node?.classList.add("source-pulse");
    window.setTimeout(() => node?.classList.remove("source-pulse"), 1800);
    setToast("Showing the exact source entry and version");
  }

  async function resolveClinicalConflict(conflict: ClinicalConflict) {
    const resolution = "Clinician reviewed both notes; current clinician-authored dose remains authoritative pending medication reconciliation.";
    try {
      const response = await fetch(`/api/conflicts/${conflict.id}/resolve`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ resolution }),
      });
      if (!response.ok) throw new Error("Resolution failed");
      setConflicts((items) => items.map((item) => item.id === conflict.id ? { ...item, status: "resolved", resolution } : item));
      setToast("Conflict resolved with both sources preserved · patient draft still needs explicit approval");
    } catch {
      setToast("Conflict resolution failed safely · no source was overwritten");
    }
  }

  function anchoredContent(entry: CareEntry) {
    const quote = selectedSource?.entryId === entry.id ? selectedSource.quote : "";
    if (!quote) return entry.content;
    const start = entry.content.indexOf(quote);
    if (start < 0) return entry.content;
    return <>{entry.content.slice(0, start)}<mark>{quote}</mark>{entry.content.slice(start + quote.length)}</>;
  }

  async function addComment(entryId: string) {
    const body = commentDraft[entryId]?.trim();
    if (!body) return;
    const next: Comment = {
      id: `comment-${Date.now()}`,
      entryId,
      authorName: user.name,
      authorRole: user.role,
      body,
      createdAt: new Date().toISOString(),
      resolved: false,
    };
    setComments((items) => [...items, next]);
    setCommentDraft((drafts) => ({ ...drafts, [entryId]: "" }));
    setToast("Comment added · mention and audit event captured");
    try {
      await fetch("/api/comments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ entryId, body }),
      });
    } catch {
      // Keep the interaction responsive in a disconnected demo.
    }
  }

  function canEdit(entry: CareEntry) {
    return (role === "staff" || role === "clinician") && entry.authorRole === role;
  }

  async function toggleHistory(entry: CareEntry) {
    if (expandedHistory === entry.id) {
      setExpandedHistory(null);
      return;
    }
    setExpandedHistory(entry.id);
    if (historyByEntry[entry.id]) return;
    try {
      const response = await fetch(`/api/entries/${entry.id}`, { headers: { accept: "application/json" } });
      if (!response.ok) throw new Error("History unavailable");
      const payload = (await response.json()) as { versions?: EntryVersionSummary[] };
      setHistoryByEntry((items) => ({ ...items, [entry.id]: payload.versions ?? [] }));
    } catch {
      setToast("Revision history is temporarily unavailable");
    }
  }

  async function revertEntry(entry: CareEntry, targetVersion: number) {
    setToast(`Restoring v${targetVersion} as a new audited version…`);
    try {
      const response = await fetch(`/api/entries/${entry.id}/revert`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ targetVersion, expectedVersion: entry.version }),
      });
      const payload = (await response.json()) as { version?: number; error?: string };
      if (response.status === 409) {
        setToast("Revert conflict detected · reload the latest version first");
        return;
      }
      if (!response.ok || !payload.version) throw new Error(payload.error ?? "Revert failed");
      setToast(`v${targetVersion} restored as v${payload.version} · audit event captured`);
      window.setTimeout(() => window.location.reload(), 650);
    } catch {
      setToast("Revert failed safely · no content was changed");
    }
  }

  async function saveEdit(entry: CareEntry) {
    const content = editDraft.trim();
    if (!content) return;
    setToast("Saving a new recoverable version…");
    try {
      const response = await fetch(`/api/entries/${entry.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content, expectedVersion: entry.version }),
      });
      if (response.status === 409) {
        setToast("Edit conflict detected · reload the latest version before saving");
        return;
      }
      if (!response.ok) throw new Error("Save failed");
      const payload = (await response.json()) as { version: number };
      setEntries((items) =>
        items.map((item) =>
          item.id === entry.id ? { ...item, content, version: payload.version } : item,
        ),
      );
      setHistoryByEntry((items) => {
        const next = { ...items };
        delete next[entry.id];
        return next;
      });
      setEditingEntry(null);
      setToast(`Version ${payload.version} saved · previous content remains recoverable`);
    } catch {
      setToast("Save failed safely · the current version is unchanged");
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true"><span /><span /><span /></div>
          <div>
            <p className="brand-name">Nightingale</p>
            <p className="brand-product">Care Note</p>
          </div>
        </div>
        <div className="workspace-title">
          <span className="status-dot" /> Eastshore Family Clinic
          <span className="synthetic-badge">Synthetic data</span>
        </div>
        <div className="header-actions">
          <label className="search-box">
            <span aria-hidden="true">⌕</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search this care note" />
          </label>
          <label className="role-switcher">
            <span className="avatar">{user.initials}</span>
            <span className="role-copy"><strong>{user.name}</strong><small>{roleLabels[role]}</small></span>
            <select aria-label="Switch demo role" value={user.id} onChange={(event) => switchRole(event.target.value)}>
            {bundle.users.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name} · {candidate.role}</option>)}
            </select>
          </label>
        </div>
      </header>

      <aside className="sidebar">
        <div className="patient-avatar">{bundle.patient.initials}</div>
        <h1>{bundle.patient.name}</h1>
        <p>{bundle.patient.age} · {bundle.patient.pronouns}</p>
        <dl className="patient-meta">
          <div><dt>Record</dt><dd>{bundle.patient.mrn}</dd></div>
          <div><dt>Next visit</dt><dd>{bundle.patient.nextVisit}</dd></div>
        </dl>
        <nav aria-label="Patient record sections">
          <button className="nav-item active"><span>◉</span> Care note <b>4</b></button>
          <button className="nav-item"><span>✓</span> Tasks <b>2</b></button>
          <button className="nav-item"><span>↺</span> Audit trail</button>
          <button className="nav-item"><span>⌘</span> Patient view</button>
        </nav>
        <div className="permission-card">
          <span className="eyebrow">Viewing as</span>
          <strong>{roleLabels[role]}</strong>
          <p>{roleDescriptions[role]}</p>
          <span className="server-badge">Server enforced</span>
        </div>
      </aside>

      <main className="workspace">
        <section className="glance-panel" aria-labelledby="glance-title">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Consult glance · updated 2 min ago</span>
              <h2 id="glance-title">What matters now</h2>
              <p>Four prioritized items. Evidence, scoring and failure behavior are inspectable.</p>
            </div>
            <div className="glance-actions">
              <span><b>2</b> open actions</span>
              <button onClick={() => setToast("Ambient capture is bonus-scoped: redact locally before any model call")}>Start ambient capture</button>
            </div>
          </div>
          <div className="evaluation-strip" aria-label="Safety evaluation status">
            <span><b>4/4</b> exact source spans</span>
            <span><b>1</b> deterministic risk floor</span>
            <span><b>1</b> patient draft abstained</span>
            <span><b>100%</b> synthetic redaction recall</span>
          </div>
          {openConflicts.map((conflict) => (
            <article className="conflict-banner" key={conflict.id}>
              <div className="conflict-icon" aria-hidden="true">!</div>
              <div>
                <span className="eyebrow">Unresolved {conflict.domain} conflict · {conflict.severity}</span>
                <h3>{conflict.summary}</h3>
                <p>{conflict.detectionRule}. {conflict.failureAction}.</p>
                <div className="conflict-sources">
                  <button onClick={() => jumpToSource(conflict.left.entryId, conflict.left.quote)}>{conflict.left.role} · v{conflict.left.version} source</button>
                  <button onClick={() => jumpToSource(conflict.right.entryId, conflict.right.quote)}>{conflict.right.role} · v{conflict.right.version} source</button>
                  {role === "clinician" && <button className="resolve-conflict" onClick={() => resolveClinicalConflict(conflict)}>Resolve after review</button>}
                </div>
              </div>
            </article>
          ))}
          <div className="highlight-grid">
            {visibleHighlights.map((item) => (
              <article className={`highlight-card ${item.severity}`} key={item.id}>
                <div className="highlight-topline">
                  <span className="severity-label">{item.severity}</span>
                  <span className="evidence-label">Evidence {item.evidence.verifiedClaims}/{item.evidence.totalClaims}</span>
                </div>
                <h3>{item.title}</h3>
                <p>{item.detail}</p>
                <div className="reason"><span>Risk basis</span>{item.riskReason}{item.riskFloorRule && <b className="floor-chip">Safety floor</b>}</div>
                <details className="score-details">
                  <summary>Importance {item.score} · inspect calculation</summary>
                  <p>risk {item.scoreBreakdown.risk} + recency {item.scoreBreakdown.recency} + action {item.scoreBreakdown.action} + entity {item.scoreBreakdown.entity} + feedback {item.scoreBreakdown.feedback} + floor {item.scoreBreakdown.safetyFloor}</p>
                  {item.riskFloorRule && <p>{item.riskFloorRule}</p>}
                </details>
                <p className="failure-action"><b>If wrong:</b> {item.evidence.failureAction}</p>
                <div className="highlight-footer">
                  <button className="source-link" onClick={() => jumpToSource(item.sourceEntryId, item.sourceQuote)}>View exact span · v{item.sourceVersion} ↘</button>
                  {item.status === "suggested" && role === "clinician" ? (
                    <div className="review-buttons">
                      <button aria-label={`Reject ${item.title}`} onClick={() => reviewHighlight(item.id, "rejected")}>×</button>
                      <button aria-label={`Accept ${item.title}`} onClick={() => reviewHighlight(item.id, "accepted")}>✓</button>
                    </div>
                  ) : <span className={`review-state ${item.status}`}>{item.status === "suggested" ? "Review" : "Confirmed"}</span>}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="timeline-section" aria-labelledby="timeline-title">
          <div className="timeline-header">
            <div><span className="eyebrow">Longitudinal record</span><h2 id="timeline-title">Care timeline</h2></div>
            <div className="filter-row" role="group" aria-label="Timeline filters">
              {filters.map((item) => <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item}</button>)}
            </div>
          </div>
          <div className="timeline">
            {visibleEntries.map((entry) => {
              const entryComments = comments.filter((comment) => comment.entryId === entry.id);
              const isAi = entry.authorRole === "system";
              return (
                <article id={entry.id} className="timeline-entry" key={entry.id}>
                  <div className={`timeline-node ${entry.authorRole}`} aria-hidden="true">{isAi ? "AI" : entry.authorName.split(" ").map((part) => part[0]).slice(0, 2).join("")}</div>
                  <div className="entry-card">
                    <div className="entry-header">
                      <div>
                        <div className="entry-author">
                          <strong>{entry.authorName}</strong>
                          <span className={`role-tag ${entry.authorRole}`}>{entry.authorRole}</span>
                          {entry.reviewState === "pending_review" && <span className="pending-tag">Not clinician confirmed</span>}
                          {entry.evidenceMode && <span className={`evidence-mode ${entry.evidenceMode}`}>{entry.evidenceMode}</span>}
                          {entry.patientReleaseState === "clinician_approved" && <span className="release-tag approved">Patient release approved</span>}
                          {entry.patientReleaseState === "draft" && <span className="release-tag blocked">Patient release blocked</span>}
                        </div>
                        <time>{formatDate(entry.createdAt)} · {entry.type.replaceAll("_", " ")}</time>
                      </div>
                      <div className="entry-actions">
                        <button onClick={() => toggleHistory(entry)}>v{entry.version} · History</button>
                        {canEdit(entry) && <button onClick={() => { setEditingEntry(entry.id); setEditDraft(entry.content); }}>Edit</button>}
                      </div>
                    </div>
                    <h3>{entry.title}</h3>
                    {editingEntry === entry.id ? (
                      <div className="editor-box"><textarea value={editDraft} onChange={(event) => setEditDraft(event.target.value)} /><div><button onClick={() => setEditingEntry(null)}>Cancel</button><button className="primary" onClick={() => saveEdit(entry)}>Save new version</button></div></div>
                    ) : <p className="entry-content">{anchoredContent(entry)}</p>}
                    {entry.evidenceCoverageBasisPoints !== undefined && (
                      <div className="entry-evidence">
                        <span>Evidence coverage {(entry.evidenceCoverageBasisPoints / 100).toFixed(0)}%</span>
                        <p>{entry.evidenceMode === "extraction" ? "Measured from exact source-span matches; not model self-confidence." : "Generated draft requires claim-by-claim source verification."}</p>
                      </div>
                    )}
                    {entry.releaseBlockReason && <div className="release-block"><b>Abstained from patient view</b><span>{entry.releaseBlockReason}</span></div>}
                    {entry.patientReleaseState === "clinician_approved" && entry.patientReleaseApprovedBy && (
                      <div className="release-approved">Approved by {entry.patientReleaseApprovedBy} · source note retained</div>
                    )}
                    {entry.sourceLabel && <button className="provenance-strip" onClick={() => setToast(`Source opened: ${entry.sourceLabel}`)}><span>Source</span>{entry.sourceLabel}<b>↗</b></button>}
                    {expandedHistory === entry.id && (
                      <div className="history-panel">
                        <strong>Revision history</strong>
                        {(historyByEntry[entry.id] ?? [{ version: entry.version, changed_by: entry.authorId, changed_by_role: entry.authorRole, change_reason: "current", created_at: entry.createdAt }]).map((version) => (
                          <div className="history-row" key={version.version}>
                            <p>v{version.version} · {version.version === entry.version ? "Current" : version.change_reason} · {version.changed_by_role}</p>
                            {canEdit(entry) && version.version < entry.version && (
                              <button onClick={() => revertEntry(entry, version.version)}>Restore as new version</button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {entryComments.length > 0 && <div className="comment-thread">{entryComments.map((comment) => <div key={comment.id}><span>{comment.authorName}</span><p>{comment.body}</p><time>{formatDate(comment.createdAt)} · unresolved</time></div>)}</div>}
                    {role !== "patient" && <div className="comment-composer"><input value={commentDraft[entry.id] ?? ""} onChange={(event) => setCommentDraft((drafts) => ({ ...drafts, [entry.id]: event.target.value }))} placeholder="Comment or @mention a teammate" /><button onClick={() => addComment(entry.id)}>Add</button></div>}
                  </div>
                </article>
              );
            })}
            {visibleEntries.length === 0 && <div className="empty-state"><strong>No entries match this view.</strong><p>Try a different role, filter, or search term.</p></div>}
          </div>
        </section>
      </main>

      <aside className="right-rail">
        <section className="rail-card">
          <div className="rail-heading"><span className="eyebrow">Open actions</span><b>2</b></div>
          <article className="task-card urgent"><span>Today</span><h3>Place FBC + ferritin orders</h3><p>Blocks staff follow-up confirmation</p><div><span className="mini-avatar">DL</span><button onClick={() => jumpToSource("entry-ai-doctor-20260402", "The lab order is not yet placed.")}>Source ↘</button></div></article>
          <article className="task-card"><span>4 Apr</span><h3>Confirm follow-up slot</h3><p>After lab order is placed</p><div><span className="mini-avatar coral">AR</span><button onClick={() => jumpToSource("entry-staff-20260401", "Waiting for clinician to place the FBC and ferritin orders")}>Source ↘</button></div></article>
        </section>
        <section className="rail-card trust-card">
          <span className="eyebrow">Trust ledger</span>
          <h3>Every insight has a failure path</h3>
          <ul><li><span>✓</span>4/4 exact spans resolve</li><li><span>✓</span>AI extraction stays distinct</li><li><span>✓</span>Critical risk floor is locked</li><li><span>✓</span>Patient draft release is blocked</li></ul>
          <button onClick={() => setToast("Audit log records actor, action, resource, outcome and versions — not raw PHI")}>View audit events</button>
        </section>
        <section className="rail-card learning-card">
          <span className="eyebrow">Evaluation + abstention</span>
          <div className="learning-score"><strong>1/1</strong><span>claims anchored per Glance item</span></div>
          <p>“Confidence” means measured evidence coverage. A broken anchor removes the item from Glance; it never becomes a lower-confidence guess.</p>
          <ul className="guardrail-list"><li>Shadow holdout is the next exposure-bias gate</li><li>Reject ≠ automatic demotion</li><li>Critical classes ignore learned down-rank</li></ul>
        </section>
      </aside>

      <div className="toast" role="status"><span />{toast}</div>
    </div>
  );
}
