/*
  Предзаказ создавать если нет нагрузки на это время


 */
CREATE TABLE "order" (
  "id" BIGSERIAL NOT NULL,
  "side_order" int,
  "time_delivery" TIMESTAMP,
  "date_preorder_cook" TIMESTAMP,
  "count_person" int,
  "division" character varying,
  "name_storage" character varying,
  "org_hash" character varying,
  "note" TEXT,
  "discount_name" character varying,
  "discount_percent" int,
  "bonus" bigint,
  "type" character varying,
  "OneCid" character varying,
  "Changed" BOOLEAN,
  "price" numeric,
  "price_with_discount" numeric,
  "price_currency" character varying,
  "type_payments" INTEGER NOT NULL,
  "order_time" TIMESTAMP,
  "paid_off" bool,
  CONSTRAINT order_pk PRIMARY KEY ("id")
) WITH (
OIDS=FALSE
);