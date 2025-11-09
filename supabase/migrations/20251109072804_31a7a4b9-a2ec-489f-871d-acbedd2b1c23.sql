-- Create email_items table for raw content entry
CREATE TABLE IF NOT EXISTS public.email_items (
  id SERIAL PRIMARY KEY,

  -- Raw content (plain text, no HTML)
  title                TEXT NOT NULL,
  subject              TEXT NULL,
  subtitle             TEXT NULL,
  hero_image_url       TEXT NULL,
  poem_text            TEXT NULL,
  section1_title       TEXT NULL DEFAULT 'דקה לפני התפילה',
  section1_text        TEXT NULL,
  section2_title       TEXT NULL DEFAULT 'מילה עם משמעות',
  section2_text        TEXT NULL,
  section3_title       TEXT NULL DEFAULT 'מילה של הלכה',
  section3_text        TEXT NULL,

  links_ref            TEXT NULL,
  rights_text          TEXT NULL DEFAULT 'כל הזכויות שמורות',

  -- Convenience field for search or quick display
  full_plain_text      TEXT NULL,

  -- Render info (to be used by future pages)
  template_id          UUID NULL,
  render_html          TEXT NULL,

  status               TEXT NOT NULL DEFAULT 'draft',
  scheduled_publish    TIMESTAMP NULL,
  published_at         TIMESTAMP NULL,

  legacy_prof_content_id INT NULL,

  created_at           TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.email_items ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Authenticated users can view email items"
ON public.email_items
FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert email items"
ON public.email_items
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update email items"
ON public.email_items
FOR UPDATE
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete email items"
ON public.email_items
FOR DELETE
USING (auth.role() = 'authenticated');

-- Touch trigger for updated_at (only create if doesn't exist)
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN 
  NEW.updated_at = NOW(); 
  RETURN NEW; 
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgrelid = 'public.email_items'::regclass 
    AND tgname = 'email_items_touch'
  ) THEN
    CREATE TRIGGER email_items_touch
    BEFORE UPDATE ON public.email_items
    FOR EACH ROW EXECUTE PROCEDURE public.touch_updated_at();
  END IF;
END $$;