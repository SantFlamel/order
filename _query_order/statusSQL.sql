--TABLE_STATUS
INSERT INTO public.status(id, name)VALUES (1, 'Предзаказ');
INSERT INTO public.status(id, name)VALUES (2, 'Принят');
INSERT INTO public.status(id, name)VALUES (3, 'Передан');
INSERT INTO public.status(id, name)VALUES (4, 'В работе');
INSERT INTO public.status(id, name)VALUES (5, 'Раскатка');
INSERT INTO public.status(id, name)VALUES (6, 'Начинение');
INSERT INTO public.status(id, name)VALUES (7, 'Запекание');
INSERT INTO public.status(id, name)VALUES (8, 'Приготовлен');
INSERT INTO public.status(id, name)VALUES (9, 'Собран');
INSERT INTO public.status(id, name)VALUES (10, 'Доставлятся');
INSERT INTO public.status(id, name)VALUES (11, 'Доставлен');
INSERT INTO public.status(id, name)VALUES (12, 'На месте в ожидании');
INSERT INTO public.status(id, name)VALUES (13, 'Заказ не забрали');
INSERT INTO public.status(id, name)VALUES (14, 'На переделке');
INSERT INTO public.status(id, name)VALUES (15, 'Отменен со списанием');
INSERT INTO public.status(id, name)VALUES (16, 'Отменен без списания');
INSERT INTO public.status(id, name)VALUES (17, 'Изменен');

--88888888888888888888888888888888888888888888888888888888888888888
/*
1-сушист
2-раскатка
3-начинение
4-упаковка.запекание
5-салаты закуски
*/

--88888888888888888888888888888888888888888888888888888888888888888


--....................................................
/*
"WITH uol as(UPDATE order_list SET finished=$3 WHERE order_id=$1 and id_item=$2 RETURNING id_parent_item), " +
"usol as (SELECT count(*) as c FROM order_list where order_id=$1 AND id_parent_item=(SELECT id_parent_item FROM uol) AND finished=false AND id_item<>$2), " +
"u as (UPDATE order_list SET finished=true WHERE order_id=$1 AND id_item=(SELECT id_parent_item FROM uol) AND 0 = (SELECT c FROM usol)), " +
"olf as(SELECT COUNT(*) as c  FROM order_list WHERE order_id=$1 AND finished=FALSE AND id_item<>$2 AND id_item<>(select * from uol)) " +
"INSERT INTO order_status (order_id, order_id_item, cause, status_id,user_hash,\"time\")  " +
"SELECT $1,0,'',8,'system',localtimestamp FROM olf where olf.c=0;"
*/
--++++
WITH uol as(UPDATE order_list SET finished=true WHERE order_id=88 and id_item=9 RETURNING id_parent_item),
usol as (SELECT count(*) as c FROM order_list where order_id=88 AND id_parent_item=(SELECT id_parent_item FROM uol) AND finished=false AND id_item<>9),
u as (UPDATE order_list SET finished=true WHERE order_id=88 AND id_item=(SELECT id_parent_item FROM uol) AND 0 = (SELECT c FROM usol)),
i as (INSERT INTO order_status (order_id, order_id_item, cause, status_id,user_hash,"time")
      SELECT 88,(SELECT id_parent_item FROM uol),'',8,'system',localtimestamp FROM usol WHERE usol.c = 0 AND 0<>(SELECT id_parent_item FROM uol) AND (SELECT id_parent_item FROM uol) is not null),
olf as(SELECT COUNT(*) as c  FROM order_list WHERE order_id=88 AND finished=FALSE AND id_item<>9 AND id_item<>(select * from uol))
INSERT INTO order_status (order_id, order_id_item, cause, status_id,user_hash,"time")
SELECT 88,0,'',8,'system',localtimestamp FROM olf where olf.c=0 RETURNING order_id,order_id_item;

--SELECT 44,0, FROM order_status WHERE order_id=44
select order_id, id_item,id_parent_item,set,finished from order_list where order_id=88;
--....................................................

with s as (select count(finished) as c from order_list where order_id=3 AND finished=false)
,lst as(
    select order_list.order_id,order_list.id_item from order_list,s where s.c=0 AND order_list.order_id=3
)
,max_id as (select CASE
	WHEN(select max(id) from order_status where order_id = 3 limit 1) is null THEN 0
	ELSE(select max(id) from order_status where order_id = 3 limit 1)
	END as m)
,max_s as (select CASE
	WHEN(select status_id from order_status,max_id where id = m limit 1) is null THEN 0
	ELSE(select status_id from order_status,max_id where id = m limit 1)
	END as max_stat)
,iso as (
INSERT INTO order_status(id,order_id, order_id_item, cause, status_id, user_hash, "time")
    SELECT m+1,lst.order_id,lst.id_item,'',8,'system',localtimestamp
    FROM lst,max_id WHERE 8=8
)
INSERT INTO order_status(
	id, order_id, order_id_item, cause, status_id, user_hash, "time")
	SELECT m+1, $1, $2, $3, $4, $5, $6 from max_id,max_s where max_stat<>15 AND max_stat<>16;

---------------------------------------------------------------------------------
SELECT * FROM order_status
WHERE status_id in
      (SELECT status_id FROM order_status WHERE id=1 AND order_id=2)
      AND order_id=2 AND order_id_item = 0