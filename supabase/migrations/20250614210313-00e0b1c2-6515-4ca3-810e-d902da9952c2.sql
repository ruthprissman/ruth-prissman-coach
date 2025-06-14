
-- הוספת עמודה חדשה "end_time" לטבלת future_sessions
ALTER TABLE public.future_sessions
ADD COLUMN end_time timestamp without time zone;

-- יצירת פונקציה שמחשבת את end_time לפי session_type_id (משך בפגישה)
CREATE OR REPLACE FUNCTION public.set_future_session_end_time()
RETURNS trigger AS $$
DECLARE
  session_duration INT;
BEGIN
  -- להביא את משך הפגישה מהטבלה session_types
  SELECT duration_minutes INTO session_duration
  FROM public.session_types
  WHERE id = NEW.session_type_id;

  IF session_duration IS NOT NULL AND NEW.session_date IS NOT NULL THEN
    NEW.end_time := NEW.session_date + (session_duration || ' minutes')::interval;
  ELSE
    NEW.end_time := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- יצירת טריגר שיקרא לפונקציה הזו לפני כל insert/update
DROP TRIGGER IF EXISTS trg_set_future_session_end_time ON public.future_sessions;
CREATE TRIGGER trg_set_future_session_end_time
BEFORE INSERT OR UPDATE ON public.future_sessions
FOR EACH ROW
EXECUTE FUNCTION public.set_future_session_end_time();
