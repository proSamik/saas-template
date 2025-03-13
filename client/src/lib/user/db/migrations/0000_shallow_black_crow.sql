CREATE TYPE "public"."priority" AS ENUM('URGENT_IMPORTANT', 'NOT_URGENT_IMPORTANT', 'URGENT_NOT_IMPORTANT', 'NOT_URGENT_NOT_IMPORTANT');--> statement-breakpoint
CREATE TABLE "user_ai_recommendations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(256) NOT NULL,
	"recommendation" text NOT NULL,
	"context" text,
	"is_applied" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"applied_at" timestamp,
	"is_deleted" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "user_calendar_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(256) NOT NULL,
	"task_id" integer,
	"title" varchar(256) NOT NULL,
	"description" text,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"is_all_day" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"is_deleted" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "user_tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(256) NOT NULL,
	"title" varchar(256) NOT NULL,
	"description" text,
	"priority" "priority" NOT NULL,
	"due_date" timestamp,
	"completed_at" timestamp,
	"is_completed" boolean DEFAULT false,
	"estimated_time_minutes" integer,
	"actual_time_minutes" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"is_deleted" boolean DEFAULT false
);
--> statement-breakpoint
ALTER TABLE "user_calendar_events" ADD CONSTRAINT "user_calendar_events_task_id_user_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."user_tasks"("id") ON DELETE no action ON UPDATE no action;