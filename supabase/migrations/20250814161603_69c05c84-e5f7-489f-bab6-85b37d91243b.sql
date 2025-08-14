-- הסרת פוליסיות אבטחה בעייתיות מטבלת מנויי התוכן
-- מסיר גישה ציבורית למידע רגיש של לקוחות

-- הסרת פוליסיית גישה מלאה לכולם
DROP POLICY IF EXISTS "full open access on content_subscribers" ON content_subscribers;

-- הסרת פוליסיית גישה מלאה למשתמשים אנונימיים  
DROP POLICY IF EXISTS "anon full access on content_subscribers" ON content_subscribers;

-- הסרת פוליסיית קריאה למשתמשים אנונימיים
DROP POLICY IF EXISTS "anon users can SELECT from content_subscribers" ON content_subscribers;

-- וידוא שרק service_role ומנהלים מורשים יכולים לגשת לנתונים
-- הפוליסיות הללו כבר קיימות ונשארות:
-- "Only service_role can INSERT/UPDATE/DELETE on content_subscribe"
-- "Only service_role can access content_subscribers"

-- הוספת פוליסיה חדשה לגישה מוגבלת למנהלים מאושרים בלבד
CREATE POLICY "Only admin ruthprissman can access content subscriber data" ON content_subscribers
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