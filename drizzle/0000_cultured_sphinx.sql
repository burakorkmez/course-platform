CREATE TYPE "public"."course_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TABLE "courses" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "courses_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description_md" text DEFAULT '' NOT NULL,
	"thumbnail_file_id" text,
	"thumbnail_path" text,
	"trailer_file_id" text,
	"trailer_path" text,
	"polar_product_id" text,
	"status" "course_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "courses_slug_unique" UNIQUE("slug"),
	CONSTRAINT "courses_polarProductId_unique" UNIQUE("polar_product_id")
);
--> statement-breakpoint
CREATE TABLE "lessons" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "lessons_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"section_id" integer NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"content_md" text DEFAULT '' NOT NULL,
	"video_file_id" text,
	"video_path" text,
	"duration_s" integer DEFAULT 0 NOT NULL,
	"is_free_preview" boolean DEFAULT false NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sections" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "sections_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"course_id" integer NOT NULL,
	"title" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_section_id_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sections" ADD CONSTRAINT "sections_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;