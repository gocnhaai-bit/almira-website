CREATE TRIGGER orders_validate_money_insert BEFORE INSERT ON orders
WHEN NEW.total NOT GLOB '[0-9]*' OR NEW.total GLOB '*[^0-9.]*' OR length(NEW.total) NOT BETWEEN 4 AND 18 OR substr(NEW.total,-3,1)!='.' OR instr(NEW.total,'.')!=length(NEW.total)-2 OR (substr(NEW.total,1,1)='0' AND substr(NEW.total,2,1)!='.')
  OR NEW.deposit NOT GLOB '[0-9]*' OR NEW.deposit GLOB '*[^0-9.]*' OR length(NEW.deposit) NOT BETWEEN 4 AND 18 OR substr(NEW.deposit,-3,1)!='.' OR instr(NEW.deposit,'.')!=length(NEW.deposit)-2 OR (substr(NEW.deposit,1,1)='0' AND substr(NEW.deposit,2,1)!='.')
  OR NEW.remaining NOT GLOB '[0-9]*' OR NEW.remaining GLOB '*[^0-9.]*' OR length(NEW.remaining) NOT BETWEEN 4 AND 18 OR substr(NEW.remaining,-3,1)!='.' OR instr(NEW.remaining,'.')!=length(NEW.remaining)-2 OR (substr(NEW.remaining,1,1)='0' AND substr(NEW.remaining,2,1)!='.')
BEGIN SELECT RAISE(ABORT,'invalid_money'); END;

CREATE TRIGGER orders_immutable_price BEFORE UPDATE OF quote_json,total,deposit,remaining,shop_id,warehouse_id ON orders
BEGIN SELECT RAISE(ABORT,'immutable_order_snapshot'); END;
