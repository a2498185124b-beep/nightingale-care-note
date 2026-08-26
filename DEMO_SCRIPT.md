# Nightingale Care Note — 3-minute demo script

## 0:00–0:20 · The problem and the promise

Open Maya Tan’s Care Note in **Clinician view**.

Say: “EHRs give us dated fragments. Nightingale turns them into a shared longitudinal record, while keeping AI suggestions separate, reviewable and source-linked. The first screen is designed to answer ‘what matters now?’ in under ten seconds.”

Point to the four Top Cards and the two open actions. Mention that the view is deliberately capped to avoid alert fatigue.

## 0:20–1:05 · Scenario A: Glance View + AI scribe provenance

1. Click **View source** on “Dizziness is worsening.”
2. Show the exact AI doctor-consult entry and its source strip: session plus timestamp range.
3. Point out **Not clinician confirmed**.
4. Return to the Top Card and accept “Place FBC + ferritin orders.”

Say: “Acceptance is fast, but never blind: the card explains why it ranked, shows the original text and records the clinician’s decision. That feedback also increases the future weight of similar unresolved-action signals.”

## 1:05–1:55 · Scenario B: collaboration, audit and revision

1. Switch to **Staff view**; show that the clinician-only historical plan is absent.
2. Add a comment to the staff follow-up entry: `@Dr. Daniel Lim Please place the lab order before noon.`
3. Switch back to **Clinician view**.
4. Open the clinician note, click **Edit**, change one sentence and save.
5. Open **History** and explain that every save creates a full recoverable snapshot.
6. Mention the deterministic same-section rule: first save wins; a stale expected version returns `409`, while separate role-owned sections can be edited concurrently.

Say: “Staff cannot overwrite clinician content and clinicians cannot overwrite staff notes. This is enforced by the API, not by hidden buttons.”

## 1:55–2:35 · Scenario C: longitudinal context and patient boundary

1. Filter the timeline to **AI scribe**, then **Staff**, then **All activity**.
2. Show the 2025 clinician-confirmed plan alongside 2026 AI and staff entries.
3. Switch to **Patient view**.
4. Show that raw AI notes, staff notes and internal comments disappear; only patient-facing instructions remain.

Say: “The same longitudinal record serves different roles, but the server releases only the fields and entries each role is allowed to see.”

## 2:35–3:00 · Safety and architecture close

Point to the **Trust ledger** and **Importance learning** panel.

Say: “All data here is synthetic. In the model path, names, Singapore-style IDs, phone numbers and emails are redacted before any external LLM boundary. Provenance records how a version was produced; the append-only audit log records who accessed or changed it. For a 72-hour build, we focused on one complete trust loop: glance, trace, decide, version and audit.”

Close with: “Trusted context. Clear next steps.”

## Capture checklist

- Record at 1440×900 or higher; keep browser zoom at 100%.
- Blur no content: all fixtures are synthetic.
- Ensure every source jump lands visibly and the accepted-card state changes.
- Keep the final frame on the Glance View with the Nightingale title visible.
- Add captions for the terms RBAC, provenance, optimistic conflict and pre-LLM redaction.

