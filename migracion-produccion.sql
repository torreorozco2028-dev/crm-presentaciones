-- Migración consolidada e idempotente para producción (equivale a 0001..0020).
-- Se puede ejecutar varias veces: cada paso se omite si ya está aplicado.
-- Ejecutar dentro de una transacción y con respaldo previo (pg_dump).
BEGIN;

-- 0001: documento único por cliente (falla si hay documentos duplicados en prod)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'client_number_of_document_unique') THEN
    ALTER TABLE "client" ADD CONSTRAINT "client_number_of_document_unique" UNIQUE ("number_of_document");
  END IF;
END $$;

-- 0002, 0012, 0019/0020: building
ALTER TABLE "building" ADD COLUMN IF NOT EXISTS "is_published" boolean DEFAULT false NOT NULL;
ALTER TABLE "building" ADD COLUMN IF NOT EXISTS "hero_headline" varchar(120);
ALTER TABLE "building" ADD COLUMN IF NOT EXISTS "price_per_m2" integer;
ALTER TABLE "building" ADD COLUMN IF NOT EXISTS "extras_plan_image" varchar(255);

-- 0003, 0018: department_model
ALTER TABLE "department_model" ADD COLUMN IF NOT EXISTS "glb_model" varchar(255);
ALTER TABLE "department_model" ADD COLUMN IF NOT EXISTS "model_type" varchar(20) DEFAULT 'departamento' NOT NULL;
ALTER TABLE "department_model" ADD COLUMN IF NOT EXISTS "model_description" text;

-- 0004, 0006, 0008, 0016, 0017: sales
ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "currency" varchar(3);
ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "exchange_rate" numeric(10, 4);
ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "advance_type" varchar(20);
ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "advance_amount" numeric(12, 2);
ALTER TABLE "sales" ALTER COLUMN "advance_amount" SET DATA TYPE numeric(12, 2);
ALTER TABLE "sales" ALTER COLUMN "final_price" SET DATA TYPE numeric(12, 2);
ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "advance_exchange_rate" numeric(10, 4);
ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "seller_agency" varchar(100);
ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "has_commission" boolean DEFAULT false NOT NULL;
ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "has_installments" boolean DEFAULT false NOT NULL;
ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "payment_frequency" varchar(50);
ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "installments_percentage" integer;
ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "global_percentage" numeric(5, 2);
ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "sales_expense_percentage" numeric(5, 2);

-- 0007: historial de ventas
CREATE TABLE IF NOT EXISTS "sale_history" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "sale_id" uuid NOT NULL REFERENCES "sales"("id") ON DELETE cascade,
  "user_id" uuid NOT NULL REFERENCES "user"("id"),
  "type" varchar(20) DEFAULT 'system' NOT NULL,
  "summary" text NOT NULL,
  "created_at" timestamp DEFAULT now()
);

-- 0016, 0017: pagos del control de ventas (la tabla debe existir aunque el control esté deshabilitado)
CREATE TABLE IF NOT EXISTS "sale_payments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "sale_id" uuid NOT NULL REFERENCES "sales"("id") ON DELETE cascade,
  "amount" numeric(12, 2) NOT NULL,
  "paid_at" timestamp DEFAULT now() NOT NULL,
  "note" text,
  "user_id" uuid NOT NULL REFERENCES "user"("id"),
  "created_at" timestamp DEFAULT now(),
  "currency" varchar(3),
  "exchange_rate" numeric(10, 4)
);
ALTER TABLE "sale_payments" ADD COLUMN IF NOT EXISTS "currency" varchar(3);
ALTER TABLE "sale_payments" ADD COLUMN IF NOT EXISTS "exchange_rate" numeric(10, 4);

-- 0009, 0010, 0011, 0013: noticias
CREATE TABLE IF NOT EXISTS "building_news" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "building_id" uuid NOT NULL REFERENCES "building"("id") ON DELETE cascade,
  "title" varchar(150) NOT NULL,
  "body" text,
  "news_date" date NOT NULL,
  "batch_images" jsonb DEFAULT '[]'::jsonb,
  "video_url" varchar(255),
  "progress_percent" integer,
  "is_published" boolean DEFAULT false NOT NULL,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "building_news_building_published_date_idx"
  ON "building_news" USING btree ("building_id", "is_published", "news_date");
ALTER TABLE "building_news" ADD COLUMN IF NOT EXISTS "show_progress" boolean DEFAULT true NOT NULL;
ALTER TABLE "building_news" ADD COLUMN IF NOT EXISTS "title_color" varchar(20);
ALTER TABLE "building_news" ADD COLUMN IF NOT EXISTS "video_thumbnail_url" varchar(500);

-- 0014, 0015: etapas de venta
ALTER TABLE "sales_stages" ADD COLUMN IF NOT EXISTS "sold_percent" integer;
ALTER TABLE "sales_stages" ADD COLUMN IF NOT EXISTS "is_current" boolean DEFAULT false NOT NULL;
ALTER TABLE "sales_stages" ADD COLUMN IF NOT EXISTS "position" integer DEFAULT 0 NOT NULL;

-- Opcional (0012 lo hacía para todos los edificios): textos iniciales del hero.
-- UPDATE "building" SET "hero_headline" = 'Aprovecha los precios de feria', "price_per_m2" = 1100
--   WHERE "hero_headline" IS NULL AND "price_per_m2" IS NULL;

COMMIT;
