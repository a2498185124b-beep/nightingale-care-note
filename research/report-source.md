# Nightingale Care Note — evidence-backed build report source

**Audience:** Nightingale 72HR Build evaluators and implementation reviewers  
**Date:** 25 August 2026  
**Scope:** a synthetic-data clinical collaboration prototype for Singapore; no claim of legal compliance or production clinical validation.

## Executive answer

The safest high-scoring prototype is not a general EHR or a generic Notion clone. It is a focused trust loop: a four-item Glance View, a continuous longitudinal timeline, role-owned collaboration, AI notes that remain pending review, exact source resolution, deterministic revision control and append-only audit metadata. Ambient capture is architecturally represented but not allowed to distract from the core loop.

## Evidence and implications

1. Singapore MOH states that patient-data AI tools remain subject to HCSA/PDPA security requirements regardless of third-party cloud or on-premises deployment and highlights non-retention commitments for public healthcare AI vendors. **Implication:** use synthetic fixtures now; require vendor/retention review before real data. [MOH, 4 Aug 2026](https://www.moh.gov.sg/newsroom/data-security-requirements-apply-to-ai-tools-that-process-patient-data/)
2. OWASP says access control is effective only in trusted server-side code or serverless APIs and recommends deny-by-default and record-ownership checks. **Implication:** every API derives role/clinic/user from the session and rechecks ownership; UI hiding is insufficient. [OWASP A01](https://owasp.org/Top10/en/A01_2021-Broken_Access_Control/)
3. HL7 FHIR distinguishes Provenance—how a resource/version came to exist—from AuditEvent—who accessed or acted upon resources. **Implication:** model `provenance`, `entry_versions` and `audit_events` as separate relations. [FHIR R5 Provenance](https://hl7.org/fhir/provenance.html), [FHIR R5 AuditEvent](https://www.hl7.org/fhir/R5/auditevent.html)
4. HHS de-identification guidance recognizes Expert Determination and Safe Harbor and notes residual re-identification risk. **Implication:** regex redaction is a prototype boundary, not a certification claim; fail closed and expand entity coverage in production. [HHS](https://www.hhs.gov/hipaa/for-professionals/special-topics/de-identification/index.html)
5. NIST AI RMF frames trustworthy AI risk management across design, development, deployment and use. **Implication:** expose reason, source, AI state and acceptance path; measure feedback and prevent learned weights from suppressing hard safety rules. [NIST AI RMF 1.0](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-ai-rmf-10)
6. A Singapore prospective time-motion study found a modest 15% documentation-time reduction and increased eye contact with ambient AI, but heterogeneous clinician effects. **Implication:** ambient capture is promising but bonus-scoped and must be workflow-tested locally. [JMIR Medical Informatics, 2026](https://medinform.jmir.org/2026/1/e85580/)
7. A prospective AI-scribe note-quality study found omissions, hallucinations and erroneous inclusions, including some potentially serious errors. **Implication:** AI outputs remain `pending_review`; clinician confirmation outranks but never deletes source AI text. [JMIR Medical Informatics, 2026](https://medinform.jmir.org/2026/1/e86474/)

## Architecture decision

The app uses a Next/React interface on a Cloudflare-compatible Worker and D1 relational storage. The hot path is two indexed reads—top highlights and timeline entries—plus role filtering. Comments, versions, provenance, feedback and audit events are separate tables. Same-section edits carry `expectedVersion`; a stale request receives a deterministic conflict instead of last-write-wins data loss.

## Limitations

- Synthetic role switching is a demo mechanism, not production authentication.
- Regex redaction cannot cover all identifiers or contextual re-identification.
- Importance learning is a bounded feedback mechanism, not clinically validated machine learning.
- P95 measurement covers the warm built Worker shell; production network and database telemetry remain required.
- No real audio is recorded or transmitted.

## Recommendation

Use the demo to evaluate the complete trust loop. If advanced, next validate with clinicians on realistic synthetic cases, replace demo sessions with clinic SSO, expand redaction with entity models plus human review, add consented ambient capture, and run a safety/usability study before any real patient pilot.

