CREATE TABLE `audit_events` (
	`id` text PRIMARY KEY NOT NULL,
	`request_id` text NOT NULL,
	`clinic_id` text NOT NULL,
	`actor_id` text NOT NULL,
	`actor_role` text NOT NULL,
	`action` text NOT NULL,
	`resource_type` text NOT NULL,
	`resource_id` text NOT NULL,
	`outcome` text NOT NULL,
	`before_version` integer,
	`after_version` integer,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `clinics` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `comments` (
	`id` text PRIMARY KEY NOT NULL,
	`entry_id` text NOT NULL,
	`clinic_id` text NOT NULL,
	`author_id` text NOT NULL,
	`author_name` text NOT NULL,
	`author_role` text NOT NULL,
	`body` text NOT NULL,
	`resolved` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`entry_id`) REFERENCES `entries`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`clinic_id`) REFERENCES `clinics`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `entries` (
	`id` text PRIMARY KEY NOT NULL,
	`clinic_id` text NOT NULL,
	`patient_id` text NOT NULL,
	`author_id` text NOT NULL,
	`author_name` text NOT NULL,
	`author_role` text NOT NULL,
	`entry_type` text NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`patient_visible` integer DEFAULT false NOT NULL,
	`risk_level` text DEFAULT 'routine' NOT NULL,
	`review_state` text DEFAULT 'manual' NOT NULL,
	`source_label` text,
	`source_session_id` text,
	`confidence_basis_points` integer,
	`version` integer DEFAULT 1 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`clinic_id`) REFERENCES `clinics`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `entry_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`entry_id` text NOT NULL,
	`version` integer NOT NULL,
	`content` text NOT NULL,
	`changed_by` text NOT NULL,
	`changed_by_role` text NOT NULL,
	`change_reason` text DEFAULT 'edit' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`entry_id`) REFERENCES `entries`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `entry_versions_entry_version_idx` ON `entry_versions` (`entry_id`,`version`);--> statement-breakpoint
CREATE TABLE `highlights` (
	`id` text PRIMARY KEY NOT NULL,
	`clinic_id` text NOT NULL,
	`patient_id` text NOT NULL,
	`title` text NOT NULL,
	`detail` text NOT NULL,
	`category` text NOT NULL,
	`severity` text NOT NULL,
	`status` text DEFAULT 'suggested' NOT NULL,
	`risk_reason` text NOT NULL,
	`source_entry_id` text NOT NULL,
	`source_version` integer NOT NULL,
	`source_quote` text NOT NULL,
	`source_start` integer,
	`source_end` integer,
	`source_fragment_hash` text,
	`score` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`clinic_id`) REFERENCES `clinics`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`source_entry_id`) REFERENCES `entries`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `importance_feedback` (
	`id` text PRIMARY KEY NOT NULL,
	`clinic_id` text NOT NULL,
	`actor_id` text NOT NULL,
	`highlight_id` text NOT NULL,
	`signal_key` text NOT NULL,
	`action` text NOT NULL,
	`weight_delta` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`clinic_id`) REFERENCES `clinics`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`highlight_id`) REFERENCES `highlights`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `patients` (
	`id` text PRIMARY KEY NOT NULL,
	`clinic_id` text NOT NULL,
	`display_name` text NOT NULL,
	`synthetic_mrn` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`clinic_id`) REFERENCES `clinics`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `patients_clinic_mrn_idx` ON `patients` (`clinic_id`,`synthetic_mrn`);--> statement-breakpoint
CREATE TABLE `provenance` (
	`id` text PRIMARY KEY NOT NULL,
	`target_type` text NOT NULL,
	`target_id` text NOT NULL,
	`target_version` integer,
	`source_entry_id` text,
	`source_version` integer,
	`source_span` text,
	`source_uri` text,
	`generated_by` text NOT NULL,
	`model_version` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`source_entry_id`) REFERENCES `entries`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`clinic_id` text NOT NULL,
	`name` text NOT NULL,
	`role` text NOT NULL,
	FOREIGN KEY (`clinic_id`) REFERENCES `clinics`(`id`) ON UPDATE no action ON DELETE no action
);
