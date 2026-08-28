# Nightingale Care Note - Technical Brief

**Challenge:** Nightingale 72HR Build  
**Build:** Synthetic-data clinical collaboration prototype  
**Performance:** Warm SSR Glance View P95 11.68 ms (30 measured requests after 5 warm-ups; target <= 300 ms)

## 1. Product thesis

Nightingale Care Note turns fragmented dated notes into one longitudinal, role-safe workspace. Its highest-value loop is deliberately narrow: **glance -> trace source -> accept/reject -> edit/version -> audit**. The first viewport caps the priority list at four explainable cards so a clinician can identify the active risk, change, open task and patient context in under ten seconds.

All people, clinics, identifiers, dates and notes are synthetic. This prototype does not claim HIPAA, PDPA or HCSA compliance and must not be used with real patient data.

## 2. Architecture

- **Interface:** React/Next application built for a Cloudflare-compatible Worker.
- **Data:** D1/SQLite tables for clinics, users, patients, entries, versions, comments, highlights, provenance, clinical conflicts, importance feedback and audit events.
- **Authorization:** every protected route derives the actor from an HttpOnly session and checks `role + clinic_id + section ownership` in server code.
- **Revisions:** every successful edit creates an immutable snapshot. An `expectedVersion` guard returns a deterministic 409 conflict for stale same-section edits. Revert restores a prior snapshot as a new version.
- **AI boundary:** external model traffic is represented by one gateway. Identifiers are redacted before the boundary; the gateway fails closed on residual patterns. Extraction uses exact source spans and a strict schema. Generated patient instructions are modeled separately and remain blocked until source verification, conflict resolution and clinician approval.

## 3. Trust model

| Actor | Read scope | Write scope |
|---|---|---|
| Patient | Patient-visible instructions only | No internal note or comment writes |
| Staff | Same-clinic staff/patient/shared AI context | Staff notes and comments |
| Clinician | All same-clinic entries and AI context | Clinician notes, comments, AI highlight review |
| Admin | Same-clinic oversight and audit metadata | No overwrite of clinical/staff note content |

Provenance, revisions and audit events are separate relations. A highlight stores its source entry, exact source version and quoted span. The audit log stores actor, role, action, resource, outcome and before/after versions without duplicating raw note content.

AI summaries remain separate `system` entries with `pending_review`; clinician confirmation never deletes their source text. The interface does not show model self-confidence. It shows measured evidence coverage—verified claims divided by total claims—and an exact failure action. A broken anchor removes the card from Glance or causes abstention.

Risk and learning are constrained by deterministic rules. `RF-ALLERGY-001` prevents a medication-allergy signal from falling below critical. Eligible non-critical clinician acceptance adds a bounded `+4`; rejection is logged but does not automatically demote future items, because alert exposure and fatigue make negative feedback ambiguous. Learned weights are clamped and cannot override the critical floor.

`CF-DOSE-001` demonstrates human-human conflict detection: two notes contain the same medication and strength but disagree on frequency. Neither note is overwritten. Both exact sources are shown, patient-facing generation abstains, and only a clinician can record a resolution.

## 4. Validation

The automated suite covers server-side clinic/role scope, patient data boundaries, version increments, revert-as-new-version, source resolution, stale-write conflicts, independent role-owned edits, bounded feedback, pre-model redaction, fabricated-span abstention, critical risk floors and clinician-only conflict resolution. Sixteen domain tests plus a rendered product-shell test pass.

The evaluation contract answers three questions for every visible safety number: what it means, how an error is detected, and what the system does next. Evidence coverage is a source-match ratio, not model belief; risk has deterministic minimums; redaction is tested for false negatives and clinical-fact preservation; unresolved generation and contradictions abstain from patient release. A shadow holdout for exposure-bias measurement remains a next-step evaluation, not a completed feature.

The warm-path benchmark performs five warm-up requests and 30 measured sequential requests against the built Worker. Result: P50 4.76 ms, P95 11.68 ms, max 12.50 ms. It measures warm SSR shell time, not public internet transit or a production clinical SLA.

## 5. 72-hour tradeoffs and next steps

**Built now:** Glance View, longitudinal timeline, exact-span source jumps, server RBAC, inline comments, immutable revision history, real revert, optimistic edit conflicts, clinical contradiction handling, bounded feedback, audit metadata, redaction gate and patient-release abstention.

**Represented but not production-ready:** ambient capture, real identity, full de-identification, calibrated clinical model validation, exposure-bias holdout, formal data retention and real EHR interoperability. The OpenAI integration is an auditable Responses API request descriptor with `store: false` and strict Structured Outputs; no external call occurs. Structured schema conformance is never treated as clinical truth.

**Next:** replace the demo role switch with clinic SSO, validate with clinicians using realistic synthetic cases, add consented multilingual ambient capture, use stronger entity recognition plus human review, measure Worker/D1/network latency separately, and complete legal/security review before any real-data pilot.

## Evidence

- Singapore MOH patient-data AI security requirements: https://www.moh.gov.sg/newsroom/data-security-requirements-apply-to-ai-tools-that-process-patient-data/
- OWASP Broken Access Control: https://owasp.org/Top10/en/A01_2021-Broken_Access_Control/
- HL7 FHIR R5 Provenance: https://hl7.org/fhir/provenance.html
- HL7 FHIR R5 AuditEvent: https://www.hl7.org/fhir/R5/auditevent.html
- HHS de-identification guidance: https://www.hhs.gov/hipaa/for-professionals/special-topics/de-identification/index.html
- NIST AI RMF 1.0: https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-ai-rmf-10
- NIST AI RMF Generative AI Profile: https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf
- NIST AI RMF Measure playbook: https://airc.nist.gov/airmf-resources/playbook/measure/
- Singapore MOH AIHGle 2.0: https://isomer-user-content.by.gov.sg/3/2a43b2e0-1cec-4d35-af8a-da74bc2410e2/Updated%20AIHGle%202.0.pdf
- OpenAI Structured Outputs: https://developers.openai.com/api/docs/guides/structured-outputs
- OpenAI API data controls: https://developers.openai.com/api/docs/guides/your-data
- JMIR Singapore ambient AI time-motion study (2026): https://medinform.jmir.org/2026/1/e85580/
- JMIR AI-scribe note quality study (2026): https://medinform.jmir.org/2026/1/e86474/

Open-source repositories informed patterns only; no repository source files were copied. See `ATTRIBUTION.txt` for dependency licenses and `research/claim-source-ledger.md` for claim-level sourcing.
