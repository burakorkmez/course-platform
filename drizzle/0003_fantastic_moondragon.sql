CREATE TYPE "public"."purchase_kind" AS ENUM('course', 'lifetime');--> statement-breakpoint
CREATE TYPE "public"."purchase_status" AS ENUM('paid', 'partially_refunded', 'refunded');--> statement-breakpoint
CREATE TABLE "purchases" (
	"polar_order_id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"polar_product_id" text NOT NULL,
	"kind" "purchase_kind" NOT NULL,
	"course_id" integer,
	"status" "purchase_status" NOT NULL,
	"polar_modified_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"polar_subscription_id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"status" text NOT NULL,
	"current_period_end" timestamp with time zone,
	"cancel_at_period_end" boolean NOT NULL,
	"polar_modified_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_events" (
	"webhook_id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE restrict ON UPDATE no action;