-- יצירת טבלות לניהול סדנאות ורישומים

-- יצירת טבלת סדנאות
CREATE TABLE public.workshops (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  date timestamp with time zone NOT NULL,
  is_free boolean NOT NULL DEFAULT false,
  price numeric(10,2) NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- יצירת טבלת רישומים
CREATE TABLE public.registrations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  workshop_id uuid NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- הפעלת Row Level Security על שתי הטבלאות
ALTER TABLE public.workshops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- פוליסיות עבור טבלת workshops
-- קריאה ציבורית לסדנאות פעילות
CREATE POLICY "Anyone can view active workshops" 
ON public.workshops 
FOR SELECT 
USING (is_active = true);

-- רק מנהלים יכולים לנהל סדנאות
CREATE POLICY "Only admin can manage workshops" 
ON public.workshops 
FOR ALL 
USING (
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

-- פוליסיות עבור טבלת registrations
-- כל אחד יכול להירשם (INSERT)
CREATE POLICY "Anyone can register for workshops" 
ON public.registrations 
FOR INSERT 
WITH CHECK (true);

-- רק מנהלים יכולים לראות ולנהל רישומים
CREATE POLICY "Only admin can view and manage registrations" 
ON public.registrations 
FOR ALL 
USING (
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

-- יצירת טריגר לעדכון updated_at אוטומטי עבור workshops
CREATE TRIGGER update_workshops_updated_at
  BEFORE UPDATE ON public.workshops
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- יצירת אינדקס לביצועים טובים יותר
CREATE INDEX idx_workshops_active_date ON public.workshops(is_active, date);
CREATE INDEX idx_registrations_workshop_id ON public.registrations(workshop_id);
CREATE INDEX idx_registrations_email ON public.registrations(email);