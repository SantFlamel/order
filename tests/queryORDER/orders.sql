  /*
Никита:
Дата оплаты.
Склад готовки
Кто оформил
Хэши блюд
 */
------------------------------------------------------------------------------
with orderset_exists as (
    select id from "OrderList" 
    where id_order=8 and id = 2 and "set" = true
), orderset_delete as (
    delete from "OrderList" where id_order=8 and id_parents in (select id from orderset_exists)
)
update "OrderList" set id_parents = 0,hash_product='hash_product2',name_product='name_product1',id_type_parent=2,name_type_parent='name_type_parent1',id_type=2,name_type = 'sadasd',parameters=array[2,3,1,4,6,4,3],"set"=false,finished=false where id_order=8 and id = 2;
------------------------------------------------------------------------------
insert into "OrderList"(id_order,id,id_parents,
            id_price,product_name,type_id, type_name,
            parent_id,parent_name,image,units,"values","sets",finished) values
            (2,(CASE
            WHEN (select max(id) from "OrderList" where id_order = 2) is null THEN 0
            ELSE (select max(id)+1 from "OrderList" where id_order = 2)
            END),
            0,11,'Картоха',5,'Картоха обычная',5,'Петр I','/public/image/roll.png','кг',5.2,false,false);

------------------------------------------------------------------------------
CREATE TYPE type_order AS ENUM('Доставка','Самовывоз');
CREATE TYPE status_order AS ENUM('Принят','Передан', 'В работе', 'Собран', 'Доставлятся', 'Доставлен','На переделке','Отменен со списанием','Отменен без списания');
CREATE TYPE payment_enum AS ENUM('Наличные','Карта','Бонусы');
Create type payment_type AS ("type_payment" character varying, "price" numeric);
--для удаления нужно изменить тип данных у используеммых таблиц на другой
drop type TypeOrder;
drop type StatusOrder;
drop type payment_enum;
drop type payment_type;
------------------------------------------------------------------------------
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

CREATE TABLE "order_customer" (
	"order_id" bigint NOT NULL UNIQUE,
	"name_customer" character varying,
	"phone" character varying NOT NULL,
	"note" TEXT,
	"city" character varying NOT NULL,
	"street" character varying NOT NULL,
	"house" int NOT NULL,
	"building" character varying,
	"floor" int,
	"apartment" int,
	"entrance" int,
	"doorphone_code" character varying
) WITH (
  OIDS=FALSE
);

CREATE TABLE "order_list" (
	"order_id" bigint NOT NULL,
	"id_item" int NOT NULL,
	"id_parent_item" int,
	"price_id" bigint,
	"price_name" character varying,
	"type_id" bigint,
	"type_name" character varying,
	"parent_id" bigint,
	"parent_name" character varying,
	"image" character varying,
	"units" character varying,
	"value" numeric,
	"set" bool,
	"finished" bool,
	"discount_name" character varying,
	"discount_percent" int,
	"price" numeric,
	"cooking_tracker" int NOT NULL,
	"time_cook" int,
	"time_fry" int,
	"composition" character varying,
	"additionally" character varying,
	"packaging" character varying,
	UNIQUE ("order_id", "id_item")
) WITH (
  OIDS=FALSE
);

CREATE TABLE "order_personal" (
	"order_id" bigint NOT NULL,
	"order_id_item" bigint NOT NULL,
	"user_hash" character varying,
	"first_name" character varying,
	"second_name" character varying,
	"sure_name" character varying,
	"role" character varying,
	"role_name" character varying,
	UNIQUE ("order_id", "order_id_item", "user_hash")
) WITH (
  OIDS=FALSE
);



CREATE TABLE "order_status" (
  "id" bigint NOT NULL,
	"order_id" bigint NOT NULL,
	"order_id_item" bigint,
	"cause" character varying,
	"status_id" int NOT NULL,
	"user_hash" character varying NOT NULL,
	"time" TIMESTAMP NOT NULL,
	UNIQUE ("id","order_id")
) WITH (
  OIDS=FALSE
);



CREATE TABLE "status" (
	"id" bigserial NOT NULL UNIQUE,
	"name" character varying NOT NULL,
	CONSTRAINT status_pk PRIMARY KEY ("id")
) WITH (
  OIDS=FALSE
);

CREATE TABLE "type_payment" (
	"id" bigserial NOT NULL,
	"name" character varying NOT NULL,
	CONSTRAINT type_payment_pk PRIMARY KEY ("id")
) WITH (
  OIDS=FALSE
);

CREATE TABLE "cashbox" (
	"id" bigserial NOT NULL,
	"order_id" bigint,
  "сhange_employee_id" bigint NOT NULL,
	"first_sure_name" character varying NOT NULL,
	"user_hash" character varying NOT NULL,
	"role_name" character varying NOT NULL,
	"org_hash" character varying NOT NULL,
	"type_payments" INTEGER NOT NULL,
	"type_operation" bool NOT NULL,
	"deposit" numeric NOT NULL,
	"short_change" numeric NOT NULL,
	"cause" character varying NOT NULL,
	"time_operation" timestamp with time zone NOT NULL,
	CONSTRAINT cashbox_pk PRIMARY KEY ("id")
) WITH (
  OIDS=FALSE
);

CREATE TABLE "сhange_employee" (
	"id" bigserial NOT NULL,
	"user_hash" character varying NOT NULL,
	"org_hash" character varying NOT NULL,
	"sum_in_cashbox" numeric NOT NULL,
	"non_cash_end_day" numeric NOT NULL,
	"cash_end_day" numeric NOT NULL,
	"close" bool NOT NULL,
	"date_begin" TIMESTAMP NOT NULL,
	"date_end" TIMESTAMP NOT NULL,
	CONSTRAINT сhange_employee_pk PRIMARY KEY ("id")
) WITH (
OIDS=FALSE
);

CREATE TABLE "order_payments" (
	"order_id" bigint NOT NULL,
	"type_payments" INTEGER NOT NULL,
	"user_hash" character varying NOT NULL,
	"price" numeric,
	"time" TIMESTAMP,
	UNIQUE ("order_id", "time")
) WITH (
  OIDS=FALSE
);


CREATE TABLE "timers_cook" (
	"order_id" bigint NOT NULL,
	"order_id_item" bigint NOT NULL,
	"time_begin" TIMESTAMP NOT NULL,
	"time_end" TIMESTAMP NOT NULL,
	"count" INTEGER,
	"finished" bool

) WITH (
  OIDS=FALSE
);

ALTER TABLE "timers_cook" ADD CONSTRAINT "timers_cook_fk0" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE CASCADE;



ALTER TABLE "order_list" ADD CONSTRAINT "order_list_fk0" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE CASCADE;
ALTER TABLE "order" ADD CONSTRAINT "order_fk0" FOREIGN KEY ("type_payments") REFERENCES "type_payment"("id");

ALTER TABLE "order_personal" ADD CONSTRAINT "order_personal_fk0" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE CASCADE;

ALTER TABLE "order_payments" ADD CONSTRAINT "order_payments_fk0" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE CASCADE;
ALTER TABLE "order_payments" ADD CONSTRAINT "order_payments_fk1" FOREIGN KEY ("type_payments") REFERENCES "type_payment"("id");

ALTER TABLE "order_status" ADD CONSTRAINT "order_status_fk0" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE CASCADE;
ALTER TABLE "order_status" ADD CONSTRAINT "order_status_fk1" FOREIGN KEY ("status_id") REFERENCES "status"("id");

ALTER TABLE "order_customer" ADD CONSTRAINT "order_customer_fk0" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE CASCADE;

ALTER TABLE "cashbox" ADD CONSTRAINT "cashbox_fk0" FOREIGN KEY ("сhange_employee_id") REFERENCES "сhange_employee"("id");
ALTER TABLE "cashbox" ADD CONSTRAINT "cashbox_fk1" FOREIGN KEY ("type_payments") REFERENCES "type_payment"("id");
