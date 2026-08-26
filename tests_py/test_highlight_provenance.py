import unittest
from care_model import CareModel, Note


class HighlightProvenanceTests(unittest.TestCase):
    def test_each_highlight_resolves_to_entry_version_and_span(self):
        model = CareModel()
        model.add_note(Note("ai-note", "clinic-a", "system", "Dizziness increased to four episodes weekly."))
        model.add_highlight("h1", "ai-note", 1, "four episodes weekly", "symptom-frequency")
        resolved = model.resolve_highlight("h1")
        self.assertIn(model.highlights["h1"]["source_quote"], resolved)

    def test_unresolvable_source_is_rejected(self):
        model = CareModel()
        model.add_note(Note("ai-note", "clinic-a", "system", "Source text"))
        with self.assertRaises(ValueError):
            model.add_highlight("h1", "ai-note", 1, "invented text", "risk")


if __name__ == "__main__":
    unittest.main()

