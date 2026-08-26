import unittest
from care_model import Actor, CareModel, Conflict, Note


class ConcurrentEditTests(unittest.TestCase):
    def test_different_role_sections_do_not_overwrite(self):
        model = CareModel()
        model.add_note(Note("staff", "clinic-a", "staff", "staff v1"))
        model.add_note(Note("clinical", "clinic-a", "clinician", "clinical v1"))
        model.edit(Actor("s1", "staff", "clinic-a"), "staff", "staff v2", 1)
        model.edit(Actor("c1", "clinician", "clinic-a"), "clinical", "clinical v2", 1)
        self.assertEqual(model.notes["staff"].content, "staff v2")
        self.assertEqual(model.notes["clinical"].content, "clinical v2")

    def test_same_section_uses_optimistic_version_conflict(self):
        model = CareModel()
        model.add_note(Note("clinical", "clinic-a", "clinician", "v1"))
        clinician = Actor("c1", "clinician", "clinic-a")
        model.edit(clinician, "clinical", "first save", 1)
        with self.assertRaises(Conflict):
            model.edit(clinician, "clinical", "stale save", 1)
        self.assertEqual(model.notes["clinical"].content, "first save")


if __name__ == "__main__":
    unittest.main()

