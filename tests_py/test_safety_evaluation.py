import unittest

from care_model import Actor, CareModel, Note, PermissionDenied


class SafetyEvaluationTests(unittest.TestCase):
    def test_confidence_is_measured_source_coverage_not_self_report(self):
        model = CareModel()
        model.add_note(Note("source", "clinic-a", "system", "Penicillin allergy was reconfirmed."))
        model.add_highlight("h", "source", 1, "Penicillin allergy was reconfirmed.", "allergy", severity="critical")
        self.assertEqual(model.highlights["h"]["evidence_coverage"], 1.0)
        self.assertEqual(model.highlights["h"]["evidence_method"], "exact_span")
        with self.assertRaises(ValueError):
            model.add_highlight("invented", "source", 1, "Patient has severe anaphylaxis.", "allergy")

    def test_critical_floor_ignores_down_rank_feedback(self):
        model = CareModel()
        model.add_note(Note("source", "clinic-a", "system", "Penicillin allergy."))
        model.add_highlight("h", "source", 1, "Penicillin allergy.", "allergy", severity="critical")
        clinician = Actor("c1", "clinician", "clinic-a")
        model.review_highlight(clinician, "h", accepted=False)
        self.assertEqual(model.signal_weights["allergy"], 0)
        self.assertFalse(model.feedback_events[-1]["eligible"])
        self.assertEqual(model.feedback_events[-1]["reason"], "critical_safety_floor_locked")

    def test_rejection_is_logged_but_not_learned_without_reason(self):
        model = CareModel()
        model.add_note(Note("source", "clinic-a", "system", "Lab order is pending."))
        model.add_highlight("h", "source", 1, "Lab order is pending.", "task")
        model.review_highlight(Actor("c1", "clinician", "clinic-a"), "h", accepted=False)
        self.assertEqual(model.feedback_events[-1]["delta"], 0)
        self.assertEqual(model.feedback_events[-1]["reason"], "rejection_requires_reason")

    def test_human_human_dose_conflict_abstains_until_clinician_review(self):
        model = CareModel()
        model.add_note(Note("staff", "clinic-a", "staff", "Iron label says 200 mg twice daily."))
        model.add_note(Note("clinician", "clinic-a", "clinician", "Take 200 mg once daily."))
        model.add_dose_conflict("dose-1", "staff", "200 mg twice daily", "clinician", "200 mg once daily")
        self.assertEqual(model.conflicts["dose-1"]["failure_action"], "abstain_patient_release")
        with self.assertRaises(PermissionDenied):
            model.resolve_conflict(Actor("s1", "staff", "clinic-a"), "dose-1", "choose once daily")
        model.resolve_conflict(Actor("c1", "clinician", "clinic-a"), "dose-1", "reconciled against prescription")
        self.assertEqual(model.conflicts["dose-1"]["status"], "resolved")


if __name__ == "__main__":
    unittest.main()
