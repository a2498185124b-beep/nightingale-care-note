import unittest
from care_model import redact_before_llm


class RedactionTests(unittest.TestCase):
    def test_identifiers_are_removed_before_model_boundary(self):
        raw = "Dr Maya Tan, S1234567D, +65 9123 4567, maya@example.com"
        output = redact_before_llm(raw)
        for identifier in ["Dr Maya Tan", "S1234567D", "9123 4567", "maya@example.com"]:
            self.assertNotIn(identifier, output)
        for placeholder in ["[NAME]", "[ID]", "[PHONE]", "[EMAIL]"]:
            self.assertIn(placeholder, output)

    def test_redaction_accuracy_corpus_preserves_clinical_facts(self):
        cases = [
            ("Dr Maya Tan has FBC due; S1234567D; +65 9123 4567; maya@example.com", ["Dr Maya Tan", "S1234567D", "+65 9123 4567", "maya@example.com"]),
            ("Mr Daniel Lim takes ferrous fumarate 200 mg once daily; 6123 4567", ["Mr Daniel Lim", "6123 4567"]),
        ]
        found = 0
        total = sum(len(spans) for _, spans in cases)
        for raw, spans in cases:
            output = redact_before_llm(raw)
            found += sum(span not in output for span in spans)
            for clinical_fact in [fact for fact in ["FBC", "ferrous fumarate", "200 mg", "once daily"] if fact in raw]:
                self.assertIn(clinical_fact, output)
        self.assertEqual(found / total, 1.0, "Required PHI-span recall must be 100% on the synthetic gate set")


if __name__ == "__main__":
    unittest.main()
