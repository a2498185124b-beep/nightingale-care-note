import unittest
from care_model import Actor, CareModel, Note


class ImportanceLearningTests(unittest.TestCase):
    def test_manual_confirmation_increases_similar_signal_priority(self):
        model = CareModel()
        model.add_note(Note("ai-1", "clinic-a", "system", "Two iron doses were missed."))
        model.add_highlight("h1", "ai-1", 1, "iron doses", "medication-adherence")
        model.review_highlight(Actor("c1", "clinician", "clinic-a"), "h1", True)
        model.add_note(Note("ai-2", "clinic-a", "system", "Another medication dose was missed."))
        model.add_highlight("h2", "ai-2", 1, "medication dose", "medication-adherence")
        self.assertGreater(model.highlights["h2"]["score"], model.highlights["h1"]["score"])


if __name__ == "__main__":
    unittest.main()

