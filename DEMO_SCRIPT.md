# Nightingale Care Note — 3-minute demo script

## 0:00–0:20 · The problem and the promise

Open Maya Tan’s Care Note in **Clinician view**.

Say: “EHRs give us dated fragments. Nightingale turns them into a shared longitudinal record, while keeping AI suggestions separate, reviewable and source-linked. The first screen is designed to answer ‘what matters now?’ in under ten seconds.”

Point to the four Top Cards and the two open actions. Mention that the view is deliberately capped to avoid alert fatigue.

## 0:20–1:05 · Scenario A: evidence, risk and abstention

1. Click **View source** on “Dizziness is worsening.”
2. Show that the exact quoted words—not only the entry—are highlighted.
3. Point out **Evidence 1/1**, the importance-score breakdown and **If wrong** behavior.
4. On the allergy card, show `RF-ALLERGY-001`: the critical floor cannot be learned down.
5. Return and accept “Place FBC + ferritin orders.”

Say: “This is not model self-confidence. Evidence coverage means verified claims divided by total claims. If an anchor breaks, the card disappears and the system abstains instead of guessing. Acceptance may add a small bounded weight; rejection is logged but does not silently suppress future alerts.”

## 1:05–1:55 · Scenario B: collaboration, audit and revision

1. Switch to **Staff view**; show that the clinician-only historical plan is absent.
2. Add a comment to the staff follow-up entry: `@Dr. Daniel Lim Please place the lab order before noon.`
3. Switch back to **Clinician view**.
4. Open the clinician note, click **Edit**, change one sentence and save.
5. Open **History** and explain that every save creates a full recoverable snapshot.
6. Mention the deterministic same-section rule: first save wins; a stale expected version returns `409`, while separate role-owned sections can be edited concurrently.

Say: “Staff cannot overwrite clinician content and clinicians cannot overwrite staff notes. This is enforced by the API, not by hidden buttons.”

## 1:55–2:35 · Scenario C: human conflict and patient boundary

1. Open the dose-conflict banner: Staff reports `200 mg twice daily`; the clinician note says `200 mg once daily`.
2. Use both source buttons and explain that neither human note is overwritten.
3. Show the generated after-visit draft marked **Release blocked**, then resolve the conflict as Clinician.
4. Switch to **Patient view** and show that raw AI, internal notes/comments and unapproved generated content remain hidden.

Say: “Contradictions can occur between humans too. The scoped rule detects the disagreement, preserves both sources and blocks patient release until a clinician adjudicates it. Resolution alone does not auto-publish the draft; explicit approval is still required.”

## 2:35–3:00 · Safety and architecture close

Point to the **Trust ledger** and **Importance learning** panel.

Say: “All data here is synthetic. The redaction test checks both identifier removal and preservation of medication facts, then fails closed on a residual pattern. The OpenAI integration is only a strict-schema request descriptor with `store: false`; no external model call runs. Structured output controls shape, while exact-span verification controls evidence.”

Close with: “Trusted context. Clear next steps.”

## Capture checklist

- Record at 1440×900 or higher; keep browser zoom at 100%.
- Blur no content: all fixtures are synthetic.
- Ensure every source jump lands visibly and the accepted-card state changes.
- Keep the final frame on the Glance View with the Nightingale title visible.
- Add captions for RBAC, evidence coverage, abstention, safety floor, provenance and pre-LLM redaction.
