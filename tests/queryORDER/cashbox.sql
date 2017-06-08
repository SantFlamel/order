SELECT case when
(SELECT sum(deposit) FROM cashbox
WHERE type_payments=$1 AND user_hash=$2 AND time_operation>$3 AND time_operation<$4) IS NULL THEN 0
ELSE (SELECT sum(deposit) FROM cashbox
WHERE type_payments=$1 AND user_hash=$2 AND time_operation>$3 AND time_operation<$4)
END

SELECT case when
(SELECT sum(deposit) FROM cashbox
WHERE deposit>0 AND type_payments=$1 AND user_hash=$2 AND time_operation>$3 AND time_operation<$4) IS NULL THEN 0
ELSE (SELECT sum(deposit) FROM cashbox
WHERE deposit>0 AND type_payments=$1 AND user_hash=$2 AND time_operation>$3 AND time_operation<$4)
END

SELECT case when
(SELECT sum(deposit) FROM cashbox
WHERE deposit<0 AND type_payments=$1 AND user_hash=$2 AND time_operation>$3 AND time_operation<$4) IS NULL THEN 0
ELSE (SELECT sum(deposit) FROM cashbox
WHERE deposit<0 AND type_payments=$1 AND user_hash=$2 AND time_operation>$3 AND time_operation<$4)
END