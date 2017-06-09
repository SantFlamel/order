
--INSERT_ORDER_LIST
with s AS(UPDATE "order" SET "Changed"=true WHERE id=36)
INSERT INTO public.order_list(order_id, id_item, id_parent_item, price_id, price_name, type_id, 
            type_name, parent_id, parent_name, image, units, value, set, 
            finished, discount_name, discount_percent, price, time_cook, 
            time_fry)
    	VALUES (36, (CASE WHEN(select max(id_item) from order_list where order_id = 36) 
			is null THEN 1 
            ELSE(select max(id_item)+1 from order_list where order_id = 36) END), 0, 4, 'price_name', 6, 
            'type_name', 8, 'parent_name', 'image', 'units', 12, false, 
            false, 'discount_name', 16, 17, 18, 
            19)returning id_item;

--------------------------------------------------------------------------------
--UPDATE
with s AS(UPDATE order_list SET finished=$3 WHERE order_id=$1 and id_item=$2) UPDATE "order" SET "Changed"=true WHERE id=$1;
--------------------------------------------------------------------------------
--ДЛЯ ПОВАРА
------------
--Получить для сушивейкера
--(SELECT order_status.time FROM order_status ORDER BY time ASC LIMIT 1) os,

SELECT order_id, id_item, id_parent_item, price_id, price_name, type_id,
       type_name, parent_id, parent_name, image, units, value, set,
       finished, discount_name, discount_percent, price, time_cook,
       time_fry, composition, additionally, packaging
FROM (
SELECT order_id, id_item, id_parent_item, price_id, price_name, type_id,
       type_name, parent_id, parent_name, image, units, value, set,
       finished, ol.discount_name, ol.discount_percent, ol.price, time_cook,
       time_fry, composition, additionally, packaging,
       (SELECT status_id FROM order_status os
       WHERE
	  os.order_id=ol.order_id
	  AND id_item=order_id_item
       ORDER BY time DESC LIMIT 1),
       (SELECT user_hash FROM order_status os
       WHERE
	  os.order_id=ol.order_id
	  AND id_item=order_id_item
       ORDER BY time DESC LIMIT 1)
FROM
  "order" o

INNER JOIN order_list ol ON ol.order_id=o.id

WHERE
  o.org_hash='yapoki'
  AND ol.finished=false
  AND ol.type_id<>5
  AND ol.type_id<>10
  AND o.date_preorder_cook < (timestamp '2017-03-22 16:50' - interval '1 hours')
ORDER BY ol.order_id, ol.id_item  ASC) w
WHERE status_id < 4 OR w.status_id is null OR user_hash='23423423' AND status_id > 7
ORDER BY order_id, id_item ASC LIMIT 6  OFFSET 0;

--........................................................................
--Получить для пице мейкера
--queryReadOrderListRangeForCook
SELECT
	order_id, id_item, id_parent_item, price_id, price_name, type_id,
	type_name, parent_id, parent_name, image, units, value, set,
	finished, discount_name, discount_percent, price, cooking_tracker,
	time_cook, time_fry, composition, additionally, packaging
FROM (
			 SELECT ol.*,
					(SELECT status_id
					 FROM order_status
					 WHERE order_id=ol.order_id AND order_id_item=0 ORDER BY "time" DESC LIMIT 1) as status_id_order,
					(SELECT status_id
					 FROM order_status
					 WHERE order_id=ol.order_id AND order_id_item=id_item ORDER BY "time" DESC LIMIT 1) as status_id,
					(SELECT user_hash
					 FROM order_status
					 WHERE order_id=ol.order_id AND order_id_item=id_item AND order_status.status_id=4
					 ORDER BY "time" DESC LIMIT 1) as osu
				 ,(SELECT CASE WHEN (SELECT order_status.status_id
														 FROM order_status
														 WHERE order_status.order_id=ol.order_id AND order_status.status_id=4
														 ORDER BY id DESC LIMIT 1)is not null then 0 else 1 end
					) as oss
			 FROM  "order" o
				 RIGHT JOIN order_list ol ON ol.order_id=o.id
			 WHERE
				 o.org_hash = ''
				 AND (select case when o.type = 'Доставка' then
					 o.date_preorder_cook - interval '45 minutes' else
											 o.date_preorder_cook - interval '30 minutes' end) < localtimestamp
				 AND ol.set=false
				 AND ol.time_cook>0
				 AND ol.finished=false
		 )	ol
WHERE
	(cooking_tracker=$3 AND (status_id < 4 OR status_id=14 OR status_id is null)
OR (status_id = 4 AND cooking_tracker=$3 AND OSU = $4)) AND status_id_order<>15 AND status_id_order<>16
ORDER BY ol.oss, ol.order_id, ol.id_item  ASC  LIMIT $5  OFFSET $6
