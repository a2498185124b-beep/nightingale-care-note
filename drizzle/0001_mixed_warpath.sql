CREATE TABLE `clinical_conflicts` (
	`id` text PRIMARY KEY NOT NULL,
	`clinic_id` text NOT NULL,
	`patient_id` text NOT NULL,
	`domain` text NOT NULL,
	`severity` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`summary` text NOT NULL,
	`detection_rule` text NOT NULL,
	`failure_action` text NOT NULL,
	`left_entry_id` text NOT NULL,
	`left_version` integer NOT NULL,
	`left_quote` text NOT NULL,
	`left_role` text NOT NULL,
	`right_entry_id` text NOT NULL,
	`right_version` integer NOT NULL,
	`right_quote` text NOT NULL,
	`right_role` text NOT NULL,
	`resolution` text,
	`resolved_by` text,
	`resolved_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`clinic_id`) REFERENCES `clinics`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`left_entry_id`) REFERENCES `entries`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`right_entry_id`) REFERENCES `entries`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `entries` ADD `evidence_mode` text DEFAULT 'extraction' NOT NULL;--> statement-breakpoint
ALTER TABLE `entries` ADD `evidence_coverage_basis_points` integer;--> statement-breakpoint
ALTER TABLE `entries` ADD `patient_release_state` text DEFAULT 'not_applicable' NOT NULL;--> statement-breakpoint
ALTER TABLE `entries` ADD `patient_release_approved_by` text;--> statement-breakpoint
ALTER TABLE `entries` ADD `patient_release_approved_at` text;--> statement-breakpoint
ALTER TABLE `entries` ADD `release_block_reason` text;--> statement-breakpoint
ALTER TABLE `highlights` ADD `evidence_basis_points` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `highlights` ADD `evidence_method` text DEFAULT 'exact_span' NOT NULL;--> statement-breakpoint
ALTER TABLE `highlights` ADD `evidence_state` text DEFAULT 'review_required' NOT NULL;--> statement-breakpoint
ALTER TABLE `highlights` ADD `failure_action` text DEFAULT 'queue_review' NOT NULL;--> statement-breakpoint
ALTER TABLE `highlights` ADD `risk_floor_rule` text;--> statement-breakpoint
ALTER TABLE `highlights` ADD `score_breakdown_json` text DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE `importance_feedback` ADD `eligible_for_learning` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `importance_feedback` ADD `learning_reason` text DEFAULT 'unclassified' NOT NULL;
--> statement-breakpoint
UPDATE `entries` SET `evidence_mode` = 'extraction', `evidence_coverage_basis_points` = 10000 WHERE `id` IN ('entry-ai-doctor-20260402', 'entry-ai-patient-20260331');
--> statement-breakpoint
UPDATE `entries` SET `patient_release_state` = 'clinician_approved', `patient_release_approved_by` = 'Dr. Daniel Lim', `patient_release_approved_at` = '2025-08-18T11:23:00+08:00' WHERE `id` = 'entry-clinician-20250818';
--> statement-breakpoint
UPDATE `entries` SET `content` = 'Patient can attend after 3 PM. Waiting for clinician to place the FBC and ferritin orders before staff confirms the follow-up slot. Patient reports the iron label says 200 mg twice daily. Assigned to Aisha; due 4 Apr.' WHERE `id` = 'entry-staff-20260401' AND `content` = 'Patient can attend after 3 PM. Waiting for clinician to place the FBC and ferritin orders before staff confirms the follow-up slot. Assigned to Aisha; due 4 Apr.';
--> statement-breakpoint
UPDATE `entry_versions` SET `content` = 'Patient can attend after 3 PM. Waiting for clinician to place the FBC and ferritin orders before staff confirms the follow-up slot. Patient reports the iron label says 200 mg twice daily. Assigned to Aisha; due 4 Apr.' WHERE `entry_id` = 'entry-staff-20260401' AND `version` = 2 AND `content` = 'Patient can attend after 3 PM. Waiting for clinician to place the FBC and ferritin orders before staff confirms the follow-up slot. Assigned to Aisha; due 4 Apr.';
--> statement-breakpoint
UPDATE `entries` SET `content` = 'Iron-deficiency anaemia, improving on oral iron. Continue ferrous fumarate 200 mg once daily with food if tolerated. Avoid penicillin. Return earlier for fainting, chest pain, shortness of breath at rest, or rapid worsening.' WHERE `id` = 'entry-clinician-20250818' AND `content` = 'Iron-deficiency anaemia, improving on oral iron. Continue current dose with food if tolerated. Avoid penicillin. Return earlier for fainting, chest pain, shortness of breath at rest, or rapid worsening.';
--> statement-breakpoint
UPDATE `entry_versions` SET `content` = 'Iron-deficiency anaemia, improving on oral iron. Continue ferrous fumarate 200 mg once daily with food if tolerated. Avoid penicillin. Return earlier for fainting, chest pain, shortness of breath at rest, or rapid worsening.' WHERE `entry_id` = 'entry-clinician-20250818' AND `version` = 3 AND `content` = 'Iron-deficiency anaemia, improving on oral iron. Continue current dose with food if tolerated. Avoid penicillin. Return earlier for fainting, chest pain, shortness of breath at rest, or rapid worsening.';
--> statement-breakpoint
INSERT OR IGNORE INTO `entries` (`id`, `clinic_id`, `patient_id`, `author_id`, `author_name`, `author_role`, `entry_type`, `title`, `content`, `patient_visible`, `risk_level`, `review_state`, `source_label`, `evidence_mode`, `evidence_coverage_basis_points`, `patient_release_state`, `release_block_reason`, `version`, `created_at`, `updated_at`) VALUES ('entry-patient-draft-20260402', 'clinic-eastshore', 'patient-maya', 'system', 'AI patient instruction draft', 'system', 'ai_patient_instruction_draft', 'After-visit instructions · blocked draft', 'Continue iron 200 mg once daily with food, avoid penicillin, complete FBC and ferritin tests, and seek earlier care for fainting, chest pain, breathlessness at rest, or rapid worsening.', 0, 'high', 'pending_review', 'Generated from clinician note v3 + consult summary v1', 'generation', 7500, 'draft', 'Unresolved iron-dose conflict and clinician approval required', 1, '2026-04-02T09:43:00+08:00', '2026-04-02T09:43:00+08:00');
--> statement-breakpoint
INSERT OR IGNORE INTO `entry_versions` (`id`, `entry_id`, `version`, `content`, `changed_by`, `changed_by_role`, `change_reason`, `created_at`) VALUES ('entry-patient-draft-20260402-v1', 'entry-patient-draft-20260402', 1, 'Continue iron 200 mg once daily with food, avoid penicillin, complete FBC and ferritin tests, and seek earlier care for fainting, chest pain, breathlessness at rest, or rapid worsening.', 'system', 'system', 'seed', '2026-04-02T09:43:00+08:00');
--> statement-breakpoint
UPDATE `highlights` SET `evidence_basis_points` = 10000, `evidence_method` = 'exact_span', `evidence_state` = 'verified', `failure_action` = 'Broken source anchor → remove from Glance and queue review', `risk_floor_rule` = 'RF-ALLERGY-001 · medication allergy is never demoted below critical', `score_breakdown_json` = '{"risk":60,"recency":12,"action":0,"entity":12,"feedback":4,"safetyFloor":10}' WHERE `id` = 'highlight-allergy';
--> statement-breakpoint
UPDATE `highlights` SET `evidence_basis_points` = 10000, `evidence_method` = 'exact_span', `evidence_state` = 'verified', `failure_action` = 'Missing order-state anchor → abstain and request manual task review', `score_breakdown_json` = '{"risk":25,"recency":20,"action":32,"entity":10,"feedback":7,"safetyFloor":0}' WHERE `id` = 'highlight-labs';
--> statement-breakpoint
UPDATE `highlights` SET `source_quote` = 'increasing dizziness after standing, now occurring 3–4 times weekly.', `evidence_basis_points` = 10000, `evidence_method` = 'exact_span', `evidence_state` = 'verified', `failure_action` = 'Frequency or span mismatch → abstain and show original consult only', `score_breakdown_json` = '{"risk":35,"recency":24,"action":8,"entity":12,"feedback":12,"safetyFloor":0}' WHERE `id` = 'highlight-dizziness';
--> statement-breakpoint
UPDATE `highlights` SET `source_quote` = 'missing two iron doses this week because of nausea', `evidence_basis_points` = 10000, `evidence_method` = 'exact_span', `evidence_state` = 'verified', `failure_action` = 'Source mismatch → remove suggestion; never infer adherence', `score_breakdown_json` = '{"risk":20,"recency":20,"action":12,"entity":10,"feedback":20,"safetyFloor":0}' WHERE `id` = 'highlight-adherence';
--> statement-breakpoint
INSERT OR IGNORE INTO `clinical_conflicts` (`id`, `clinic_id`, `patient_id`, `domain`, `severity`, `status`, `summary`, `detection_rule`, `failure_action`, `left_entry_id`, `left_version`, `left_quote`, `left_role`, `right_entry_id`, `right_version`, `right_quote`, `right_role`)
SELECT 'conflict-iron-dose', 'clinic-eastshore', 'patient-maya', 'dose', 'high', 'open', 'Ferrous fumarate frequency differs across two human-authored notes', 'CF-DOSE-001 · same medication + same strength + different frequency', 'Abstain from patient release; clinician must compare both sources', 'entry-staff-20260401', 2, 'iron label says 200 mg twice daily', 'staff', 'entry-clinician-20250818', 3, 'ferrous fumarate 200 mg once daily', 'clinician'
WHERE EXISTS (
	SELECT 1 FROM `entries`
	WHERE `id` = 'entry-staff-20260401'
		AND instr(`content`, 'iron label says 200 mg twice daily') > 0
)
AND EXISTS (
	SELECT 1 FROM `entries`
	WHERE `id` = 'entry-clinician-20250818'
		AND instr(`content`, 'ferrous fumarate 200 mg once daily') > 0
);
