# Nightingale Care Note — evidence-backed build report source

**Audience:** Nightingale 72HR Build evaluators and implementation reviewers  
**Date:** 28 August 2026  
**Scope:** a synthetic-data clinical collaboration prototype for Singapore; no claim of legal compliance or production clinical validation.

## Executive answer

The added challenge hint changes the acceptance criterion from “show risk/confidence/importance” to “prove what each number means, how an error is detected and what happens next.” The optimized prototype therefore treats extraction, generation, risk, evidence, redaction, feedback learning, contradictions and patient release as separate evaluated controls. The focused trust loop remains: glance, trace exact evidence, decide or abstain, version and audit.

## Evidence and implications

1. Singapore MOH states that patient-data AI tools remain subject to HCSA/PDPA security requirements regardless of third-party cloud or on-premises deployment and highlights non-retention commitments for public healthcare AI vendors. **Implication:** use synthetic fixtures now; require vendor/retention review before real data. [MOH, 4 Aug 2026](https://www.moh.gov.sg/newsroom/data-security-requirements-apply-to-ai-tools-that-process-patient-data/)
2. OWASP says access control is effective only in trusted server-side code or serverless APIs and recommends deny-by-default and record-ownership checks. **Implication:** every API derives role/clinic/user from the session and rechecks ownership; UI hiding is insufficient. [OWASP A01](https://owasp.org/Top10/en/A01_2021-Broken_Access_Control/)
3. HL7 FHIR distinguishes Provenance—how a resource/version came to exist—from AuditEvent—who accessed or acted upon resources. **Implication:** model `provenance`, `entry_versions` and `audit_events` as separate relations. [FHIR R5 Provenance](https://hl7.org/fhir/provenance.html), [FHIR R5 AuditEvent](https://www.hl7.org/fhir/R5/auditevent.html)
4. HHS de-identification guidance recognizes Expert Determination and Safe Harbor and notes residual re-identification risk. **Implication:** regex redaction is a prototype boundary, not a certification claim; fail closed and expand entity coverage in production. [HHS](https://www.hhs.gov/hipaa/for-professionals/special-topics/de-identification/index.html)
5. NIST AI RMF frames trustworthy AI risk management across design, development, deployment and use. **Implication:** expose reason, source, AI state and acceptance path; measure feedback and prevent learned weights from suppressing hard safety rules. [NIST AI RMF 1.0](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-ai-rmf-10)
6. A Singapore prospective time-motion study found a modest 15% documentation-time reduction and increased eye contact with ambient AI, but heterogeneous clinician effects. **Implication:** ambient capture is promising but bonus-scoped and must be workflow-tested locally. [JMIR Medical Informatics, 2026](https://medinform.jmir.org/2026/1/e85580/)
7. A prospective AI-scribe note-quality study found omissions, hallucinations and erroneous inclusions, including some potentially serious errors. **Implication:** AI outputs remain `pending_review`; clinician confirmation outranks but never deletes source AI text. [JMIR Medical Informatics, 2026](https://medinform.jmir.org/2026/1/e86474/)
8. Singapore MOH's AIHGle 2.0 requires human oversight for Clinical and Clinical-Ops AI and calls for source checking, use-case-specific evaluation and monitoring for drift. **Implication:** patient-facing generation is blocked pending clinician approval; source anchors and failure actions are visible; continuous learning cannot bypass safety rules. [MOH AIHGle 2.0](https://isomer-user-content.by.gov.sg/3/2a43b2e0-1cec-4d35-af8a-da74bc2410e2/Updated%20AIHGle%202.0.pdf)
9. NIST's Generative AI Profile and Measure playbook recommend ground-truth evaluation, provenance/lineage, local use-context metrics and explicit tracking of overrides and failures. **Implication:** use labeled exact-span tests, deterministic failure injections and separate feedback/audit records rather than a decorative model confidence label. [NIST AI 600-1](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf), [NIST Measure](https://airc.nist.gov/airmf-resources/playbook/measure/)
10. Selective prediction literature treats abstention as valuable when the cost of a wrong prediction exceeds the cost of deferral; aggregate discrimination metrics alone do not encode that operational cost. **Implication:** unresolved anchors, dose conflicts and unapproved patient generation defer to human review instead of returning a lower-confidence answer. [JAMIA, 2024](https://academic.oup.com/jamia/article/31/1/188/7285661)
11. OpenAI Structured Outputs constrain response structure, while application evaluation must still verify task correctness. OpenAI also documents API training and retention controls separately. **Implication:** the prototype returns a strict-schema Responses API descriptor with `store: false`, then requires local quote/offset checks; it makes no compliance or zero-retention claim. [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs), [Evaluation best practices](https://developers.openai.com/api/docs/guides/evaluation-best-practices), [Data controls](https://developers.openai.com/api/docs/guides/your-data)

## Added-hint decision matrix

| Area | Evaluated meaning | Injected failure | Deterministic response |
|---|---|---|---|
| Extraction | Claims backed by literal source spans and versions | Fabricated or shifted quote | Remove from Glance and queue review |
| Generation | New patient-facing language, separately typed | Any unverified claim, conflict or missing approval | Abstain from patient release |
| Confidence | Evidence coverage = verified claims / total claims | Coverage below 100% or broken critical anchor | Review-required/abstain; never display model belief |
| Risk | Score plus rule-set minimum severity | Model/learning result below allergy floor | Apply `RF-ALLERGY-001` and log rule ID |
| Redaction | Identifier recall and clinical-fact preservation on labeled synthetic cases | Identifier leak or mutated dose/medication | Fail closed before request construction |
| Self-learning | Bounded positive confirmation for eligible non-critical signals | Rejection-driven or critical down-rank | Ignore ranking update; preserve feedback record |
| Conflict | Two resolved sources disagree on scoped medication facts | Same drug/strength, different frequency | Preserve both, block release, clinician resolves |

## Architecture decision

The app uses a Next/React interface on a Cloudflare-compatible Worker and D1 relational storage. Entries distinguish extraction from generation and carry a patient-release state. Highlights store source version/quote, measured evidence, failure action, score breakdown and optional safety-floor rule. `clinical_conflicts` preserves both sources and its human resolution. Comments, versions, provenance, feedback and audit events remain separate. Same-section edits carry `expectedVersion`; a stale request receives a deterministic conflict instead of last-write-wins data loss.

## Limitations

- Synthetic role switching is a demo mechanism, not production authentication.
- Regex redaction cannot cover all identifiers or contextual re-identification.
- Importance learning is a bounded feedback mechanism, not clinically validated machine learning.
- The synthetic redaction corpus is a regression gate, not an estimate of real-world sensitivity or specificity.
- The conflict rule currently covers one scoped medication-frequency contradiction; allergies, medication identity, strength, route, dose and timing need a broader terminology-backed rule set.
- Exposure-bias shadow evaluation is specified but not implemented in this 72-hour prototype.
- P95 measurement covers the warm built Worker shell; production network and database telemetry remain required.
- No real audio is recorded or transmitted.

## Recommendation

Use the demo to evaluate the complete trust loop. If advanced, next validate with clinicians on realistic synthetic cases, replace demo sessions with clinic SSO, expand redaction with entity models plus human review, add consented ambient capture, and run a safety/usability study before any real patient pilot.
