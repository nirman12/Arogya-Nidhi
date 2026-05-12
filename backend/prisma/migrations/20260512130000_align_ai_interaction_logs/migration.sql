ALTER TABLE "ai_interaction_logs"
  ALTER COLUMN "id" SET DEFAULT gen_random_uuid(),
  ALTER COLUMN "user_id" DROP NOT NULL,
  ALTER COLUMN "interaction_type" DROP NOT NULL,
  ALTER COLUMN "interaction_type" TYPE VARCHAR(100),
  ALTER COLUMN "model_used" TYPE VARCHAR(100),
  ALTER COLUMN "created_at" TYPE TIMESTAMPTZ(6);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ai_interaction_logs_user_id_fkey'
  ) THEN
    ALTER TABLE "ai_interaction_logs" DROP CONSTRAINT "ai_interaction_logs_user_id_fkey";
  END IF;
END $$;

ALTER TABLE "ai_interaction_logs"
  ADD CONSTRAINT "ai_interaction_logs_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "idx_ai_interaction_logs_user_id"
  ON "ai_interaction_logs" USING btree ("user_id");
