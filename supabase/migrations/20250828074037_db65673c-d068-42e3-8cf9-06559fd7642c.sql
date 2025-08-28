-- הוספת שדה לינק דף נחיתה
ALTER TABLE public.workshops 
ADD COLUMN landing_page_url TEXT;

-- הוספת שדה לקביעת נראות בדף הציבורי
ALTER TABLE public.workshops 
ADD COLUMN is_public_visible BOOLEAN DEFAULT true NOT NULL;

-- עדכון הערות
COMMENT ON COLUMN public.workshops.landing_page_url IS 'לינק לדף הנחיתה של הסדנה';
COMMENT ON COLUMN public.workshops.is_public_visible IS 'האם הסדנה מוצגת בדף הציבורי';