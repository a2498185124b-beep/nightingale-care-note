# Nightingale Care Note - Technical Brief

**Challenge:** Nightingale 72HR Build  
**Build:** Synthetic-data clinical collaboration prototype  
**Performance:** Warm SSR Glance View P95 6.38 ms (30 measured requests after 5 warm-ups; target <= 300 ms)

## 1. Product thesis

Nightingale Care Note turns fragmented dated notes into one longitudinal, role-safe workspace. Its highest-value loop is deliberately narrow: **glance -> trace source -> accept/reject -> edit/version -> audit**. The first viewport caps the priority list at four explainable cards so a clinician can identify the active risk, change, open task and patient context in under ten seconds.

All people, clinics, identifiers, dates and notes are synthetic. This prototype does not claim HIPAA, PDPA or HCSA compliance and must not be used with real patient data.

## 2. Architecture

- **Interface:** React/Next application built for a Cloudflare-compatible Worker.
- **Data:** D1/SQLite tables for clinics, users, patients, entries, versions, comments, highlights, provenance, importance feedback and audit events.
- **Authorization:** every protected route derives the actor from an HttpOnly session and checks `role + clinic_id + section ownership` in server code.
- **Revisions:** every successful edit creates an immutable snapshot. An `expectedVersion` guard returns a deterministic 409 conflict for stale same-section edits. Revert restores a prior snapshot as a new version.
- **AI boundary:** external model traffic is represented by one gateway. Identifiers are redacted before the boundary; the gateway fails closed when redaction does not complete.

## 3. Trust model

| Actor | Read scope | Write scope |
|---|---|---|
| Patient | Patient-visible instructions only | No internal note or comment writes |
| Staff | Same-clinic staff/patient/shared AI context | Staff notes and comments |
| Clinician | All same-clinic entries and AI context | Clinician notes, comments, AI highlight review |
| Admin | Same-clinic oversight and audit metadata | No overwrite of clinical/staff note content |

Provenance, revisions and audit events are separate relations. A highlight stores its source entry, exact source version and quoted span. The audit log stores actor, role, action, resource, outcome and before/after versions without duplicating raw note content.

AI summaries remain separate `system` entries with `pending_review`; clinician confirmation can promote confidence but never deletes the source AI text. Importance feedback is bounded: an acceptance adds 12 to the signal family and a rejection subtracts 8. Hard safety alerts always outrank learned weights.

## 4. Validation

The automated suite covers server-side clinic/role scope, patient data boundaries, version increments, revert-as-new-version, source resolution, stale-write conflicts, independent role-owned edits, clinician feedback learning and pre-model redaction. Eleven domain tests plus a rendered product-shell test pass.

The warm-path benchmark performs five warm-up requests and 30 measured sequential requests against the built Worker. Result: P50 3.44 ms, P95 6.38 ms, max 10.58 ms. It measures warm SSR shell time, not public internet transit or a production clinical SLA.

## 5. 72-hour tradeoffs and next steps

**Built now:** Glance View, longitudinal timeline, exact source jumps, server RBAC, inline comments, immutable revision history, real revert, optimistic conflicts, feedback learning, audit metadata and redaction boundary.

**Represented but not production-ready:** ambient capture, real identity, full de-identification, clinical model validation, formal data retention and real EHR interoperability.

**Next:** replace the demo role switch with clinic SSO, validate with clinicians using realistic synthetic cases, add consented multilingual ambient capture, use stronger entity recognition plus human review, measure Worker/D1/network latency separately, and complete legal/security review before any real-data pilot.

## Evidence

- Singapore MOH patient-data AI security requirements: https://www.moh.gov.sg/newsroom/data-security-requirements-apply-to-ai-tools-that-process-patient-data/
- OWASP Broken Access Control: https://owasp.org/Top10/en/A01_2021-Broken_Access_Control/
- HL7 FHIR R5 Provenance: https://hl7.org/fhir/provenance.html
- HL7 FHIR R5 AuditEvent: https://www.hl7.org/fhir/R5/auditevent.html
- HHS de-identification guidance: https://www.hhs.gov/hipaa/for-professionals/special-topics/de-identification/index.html
- NIST AI RMF 1.0: https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-ai-rmf-10
- JMIR Singapore ambient AI time-motion study (2026): https://medinform.jmir.org/2026/1/e85580/
- JMIR AI-scribe note quality study (2026): https://medinform.jmir.org/2026/1/e86474/

Open-source repositories informed patterns only; no repository source files were copied. See `ATTRIBUTION.txt` for dependency licenses and `research/claim-source-ledger.md` for claim-level sourcing.
