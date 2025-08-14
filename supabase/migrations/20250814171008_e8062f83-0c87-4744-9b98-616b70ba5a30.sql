-- הסרת פוליסיות אבטחה בעייתיות מטבלת פגישות הטיפול
-- מסיר גישה ציבורית למידע רפואי רגיש של מטופלים

-- הסרת פוליסיית גישה מלאה לכולם
DROP POLICY IF EXISTS "full open access on sessions" ON sessions;

-- הסרת פוליסיית גישה מלאה למשתמשים אנונימיים  
DROP POLICY IF EXISTS "anon full access on sessions" ON sessions;

-- הסרת פוליסיית קריאה למשתמשים אנונימיים
DROP POLICY IF EXISTS "anon users can SELECT from sessions" ON sessions;

-- וידוא שרק service_role ומנהלים מורשים יכולים לגשת לנתונים
-- הפוליסיות הללו כבר קיימות ונשארות:
-- "Only service_role can INSERT/UPDATE/DELETE on sessions"
-- "Only service_role can access sessions"

-- הוספת פוליסיה חדשה לגישה מוגבלת למנהלים מאושרים בלבד
CREATE POLICY "Only admin ruthprissman can access patient session data" ON sessions
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