import unittest
from care_model import Actor, CareModel, Note


class RevisionHistoryTests(unittest.TestCase):
    def setUp(self):
        self.model = CareModel()
        self.model.add_note(Note("plan", "clinic-a", "clinician", "original plan"))
        self.clinician = Actor("c1", "clinician", "clinic-a")

    def test_edit_increments_version_and_audit_metadata(self):
        version = self.model.edit(self.clinician, "plan", "updated plan", 1)
        self.assertEqual(version, 2)
        self.assertEqual(self.model.audit[-1]["before"], 1)
        self.assertEqual(self.model.audit[-1]["after"], 2)
        self.assertEqual(self.model.audit[-1]["actor"], "c1")

    def test_revert_creates_new_version_with_prior_content(self):
        self.model.edit(self.clinician, "plan", "updated plan", 1)
        version = self.model.revert(self.clinician, "plan", 1)
        self.assertEqual(version, 3)
        self.assertEqual(self.model.notes["plan"].content, "original plan")


if __name__ == "__main__":
    unittest.main()

