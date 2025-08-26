-- Add invitation email fields to workshops table
ALTER TABLE public.workshops 
ADD COLUMN invitation_subject text DEFAULT 'הזמנה לסדנה: {workshop_title}',
ADD COLUMN invitation_body text DEFAULT 'שלום {participant_name},

אני שמחה להזמין אותך לסדנה "{workshop_title}".

📅 תאריך: {workshop_date}
⏰ שעה: {workshop_time}
💻 קישור זום: {zoom_link}

נתראה בסדנה!
רות פריסמן';