import unittest
from care_model import Actor, CareModel, Note, PermissionDenied


class RbacScopeTests(unittest.TestCase):
    def setUp(self):
        self.model = CareModel()
        self.model.add_note(Note("staff", "clinic-a", "staff", "staff-only"))
        self.model.add_note(Note("clinical", "clinic-a", "clinician", "raw internal AI review"))
        self.model.add_note(Note("patient-summary", "clinic-a", "clinician", "patient instructions", patient_visible=True))
        self.staff = Actor("s1", "staff", "clinic-a")
        self.clinician = Actor("c1", "clinician", "clinic-a")
        self.patient = Actor("p1", "patient", "clinic-a")

    def test_staff_and_clinician_cannot_edit_as_each_other(self):
        with self.assertRaises(PermissionDenied):
            self.model.edit(self.staff, "clinical", "overwrite", 1)
        with self.assertRaises(PermissionDenied):
            self.model.edit(self.clinician, "staff", "overwrite", 1)

    def test_patient_cannot_access_internal_or_raw_ai_notes(self):
        with self.assertRaises(PermissionDenied):
            self.model.read(self.patient, "clinical")
        self.assertEqual(self.model.read(self.patient, "patient-summary"), "patient instructions")

    def test_cross_clinic_is_denied(self):
        outsider = Actor("c2", "clinician", "clinic-b")
        with self.assertRaises(PermissionDenied):
            self.model.read(outsider, "staff")


if __name__ == "__main__":
    unittest.main()

