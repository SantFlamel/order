SELECT op.order_id, op.order_id_item,
status_id, op.user_hash,role,role_name

FROM order_status os

INNER JOIN order_personal op
ON op.order_id=os.order_id
AND op.order_id_item=os.order_id_item
AND op.user_hash=os.user_hash

WHERE os.time > '2017.03.22 9:31';


--Количество заказов
WITH iss as (
  SELECT DISTINCT order_id FROM order_status WHERE "time" > current_date ORDER BY order_id ASC)

, s as(
  SELECT order_id, (SELECT status_id FROM order_status WHERE order_id=iss.order_id ORDER BY id DESC LIMIT 1) from iss)

SELECT COUNT(*)
FROM s
INNER JOIN order_personal op ON op.order_id = s.order_id
WHERE user_hash='eb2ffc0c4632ba9f3026f8ae35520f1fb1a708b7e213bdbfb643bc16a0900190'
AND status_id > 8
AND status_id < 11;
