CREATE OR REPLACE FUNCTION raise_exception(text)
RETURNS void AS $$
BEGIN
  RAISE EXCEPTION '%', $1;
END;
$$ LANGUAGE plpgsql;

SELECT raise_exception('bubu');