-- הסרת פוליסיות אבטחה בעייתיות מטבלת יומני האימיילים
-- מסיר גישה ציבורית לכתובות אימייל של לקוחות

-- הסרת פוליסיית גישה מלאה לכולם
DROP POLICY IF EXISTS "full open access on email_logs" ON email_logs;

-- הסרת פוליסיית גישה מלאה למשתמשים אנונימיים  
DROP POLICY IF EXISTS "anon full access on email_logs" ON email_logs;

-- הסרת פוליסיית קריאה למשתמשים אנונימיים
DROP POLICY IF EXISTS "anon users can SELECT from email_logs" ON email_logs;

-- וידוא שרק service_role ומנהלים מורשים יכולים לגשת לנתונים
-- הפוליסיות הללו כבר קיימות ונשארות:
-- "Only service_role can INSERT/UPDATE/DELETE on email_logs"
-- "Only service_role can access email_logs"

-- הוספת פוליסיה חדשה לגישה מוגבלת למנהלים מאושרים בלבד
CREATE POLICY "Only admin ruthprissman can access email logs data" ON email_logs
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