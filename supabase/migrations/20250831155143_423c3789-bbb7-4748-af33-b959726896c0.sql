-- First, let's clean up existing duplicates by keeping only the earliest registration for each email/workshop combination
-- We'll normalize emails by trimming whitespace and converting to lowercase

-- Create a temporary table to identify duplicates
WITH duplicate_registrations AS (
  SELECT 
    id,
    LOWER(TRIM(email)) as normalized_email,
    workshop_id,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY LOWER(TRIM(email)), workshop_id 
      ORDER BY created_at ASC
    ) as row_num
  FROM registrations
),
registrations_to_delete AS (
  SELECT id 
  FROM duplicate_registrations 
  WHERE row_num > 1
)
-- Delete duplicate registrations (keep only the earliest one for each email/workshop)
DELETE FROM registrations 
WHERE id IN (SELECT id FROM registrations_to_delete);

-- Update all existing emails to be normalized (lowercase and trimmed)
UPDATE registrations 
SET email = LOWER(TRIM(email));

-- Create a unique index on normalized email and workshop_id to prevent future duplicates
CREATE UNIQUE INDEX registrations_unique_email_workshop 
ON registrations (LOWER(TRIM(email)), workshop_id);

-- Add a function to normalize emails before insert/update
CREATE OR REPLACE FUNCTION normalize_registration_email()
RETURNS TRIGGER AS $$
BEGIN
  NEW.email := LOWER(TRIM(NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically normalize emails on insert/update
CREATE TRIGGER normalize_registration_email_trigger
  BEFORE INSERT OR UPDATE ON registrations
  FOR EACH ROW
  EXECUTE FUNCTION normalize_registration_email();