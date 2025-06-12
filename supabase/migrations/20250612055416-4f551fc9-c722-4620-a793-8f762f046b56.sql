
-- מחיקת כל ה-policies הקיימים
DROP POLICY IF EXISTS "Allow authenticated users to read session types" ON public.session_types;
DROP POLICY IF EXISTS "Allow only admin to manage session types" ON public.session_types;

-- יצירת policy יחיד שמאפשר רק לך גישה מלאה (קריאה, כתיבה, עריכה, מחיקה)
CREATE POLICY "Only admin ruthprissman can access session types" 
ON public.session_types 
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.admins 
    WHERE email = auth.jwt() ->> 'email' 
    AND email = 'ruthprissman@gmail.com'
  )
);
