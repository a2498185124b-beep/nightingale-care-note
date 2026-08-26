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


if __name__ == "__main__":
    unittest.main()
