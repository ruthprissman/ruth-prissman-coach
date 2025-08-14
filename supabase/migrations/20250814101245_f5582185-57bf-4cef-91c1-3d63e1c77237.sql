-- הסרת פוליסיות אבטחה בעייתיות מטבלת המטופלים
-- מסיר גישה ציבורית למידע רגיש של מטופלים

-- הסרת פוליסיית גישה מלאה לכולם
DROP POLICY IF EXISTS "full open access on patients" ON patients;

-- הסרת פוליסיית גישה מלאה למשתמשים אנונימיים  
DROP POLICY IF EXISTS "anon full access on patients" ON patients;

-- הסרת פוליסיית קריאה למשתמשים אנונימיים
DROP POLICY IF EXISTS "anon users can SELECT from patients" ON patients;

-- וידוא שרק service_role ומנהלים מורשים יכולים לגשת לנתונים
-- הפוליסיות הללו כבר קיימות ונשארות:
-- "Only service_role can INSERT/UPDATE/DELETE on patients"
-- "Only service_role can access patients"

-- הוספת פוליסיה חדשה לגישה מוגבלת למנהלים מאושרים בלבד
CREATE POLICY "Only admin ruthprissman can access patient data" ON patients
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE admins.email = (auth.jwt() ->> 'email'::text) 
    AND admins.email = 'ruthprissman@gmail.com'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE admins.email = (auth.jwt() ->> 'email'::text) 
    AND admins.email = 'ruthprissman@gmail.com'
  )
);