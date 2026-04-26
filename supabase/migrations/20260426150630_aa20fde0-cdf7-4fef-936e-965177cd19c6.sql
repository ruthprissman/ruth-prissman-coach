-- שלב 1: ביטול ה-cron job הקיים שרץ כל דקה
SELECT cron.unschedule(jobid) FROM cron.job WHERE schedule = '* * * * *';

-- שלב 2: יצירת cron job חדש שרץ פעם ביום ב-06:00
SELECT cron.schedule(
  'process-scheduled-emails-daily',
  '0 6 * * *',
  $$
    SELECT net.http_post(
      url:='https://uwqwlltrfvokjlaufguz.supabase.co/functions/v1/process-scheduled-emails',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3cXdsbHRyZnZva2psYXVmZ3V6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4NjU0MjYsImV4cCI6MjA1NjQ0MTQyNn0.G2JhvsEw4Q24vgt9SS9_nOMPtOdOqTGpus8zEJ5USD8"}'::jsonb,
      body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);

-- שלב 3: יצירת cron job יומי לניקוי אוטומטי של לוגים ישנים
SELECT cron.schedule(
  'cleanup-old-logs-daily',
  '0 3 * * *',
  $$
    DELETE FROM net._http_response WHERE created < now() - interval '3 days';
    DELETE FROM cron.job_run_details WHERE start_time < now() - interval '3 days';
    DELETE FROM auth.audit_log_entries WHERE created_at < now() - interval '14 days';
    DELETE FROM auth.refresh_tokens WHERE updated_at < now() - interval '14 days';
  $$
);

-- שלב 4: ניקוי חד-פעמי של הלוגים שכבר הצטברו
DELETE FROM net._http_response WHERE created < now() - interval '1 day';
DELETE FROM cron.job_run_details WHERE start_time < now() - interval '1 day';
DELETE FROM auth.audit_log_entries WHERE created_at < now() - interval '7 days';
DELETE FROM auth.refresh_tokens WHERE updated_at < now() - interval '7 days';