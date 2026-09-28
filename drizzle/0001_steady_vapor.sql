CREATE TYPE "public"."course_level" AS ENUM('Beginner', 'Intermediate', 'Advanced', 'All levels');--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "tagline" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "level" "course_level" DEFAULT 'All levels' NOT NULL;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "outcomes" text[] DEFAULT '{}' NOT NULL;