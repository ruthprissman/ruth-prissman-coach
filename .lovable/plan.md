## ניתוח: למה ה-DB תופס כל כך הרבה מקום?

בדקתי את כל הטבלאות במסד הנתונים והתוצאה ברורה - **כמעט כל הנפח הוא לא מהנתונים שלך, אלא מטבלאות לוגים פנימיות של המערכת.**

### פירוט הנפח (Top tables):

| טבלה | סכמה | נפח | מה זה? |
|------|------|-----|--------|
| `_http_response` | net | **430 MB** | תוצאות של קריאות HTTP מ-cron job |
| `job_run_details` | cron | **261 MB** | היסטוריית הרצות של ה-cron job |
| `audit_log_entries` | auth | **34 MB** | לוגים של auth |
| `refresh_tokens` | auth | **19 MB** | טוקנים ישנים |
| **כל הטבלאות הציבוריות שלך יחד** | public | **~3 MB בלבד!** | הנתונים האמיתיים שלך |

**סה"כ: ~750 MB - מתוכם 744 MB הם לוגים של מערכת!**

### מקור הבעיה

יש cron job שרץ **כל דקה** (`* * * * *`) שקורא לפונקציה `process-scheduled-emails`. כל הרצה כזו שומרת:
- שורה ב-`cron.job_run_details` (387,897 שורות הצטברו מאז יולי 2025!)
- שורה ב-`net._http_response` (התשובה של ה-HTTP)

בדקתי את הלוגים של הפונקציה - היא מחזירה כל פעם "Found 0 emails to process". כלומר רוב ההרצות סתם מבזבזות מקום.

---

## תוכנית הצמצום

### שלב 1: ניקוי לוגים ישנים (חד-פעמי) - ישחרר ~744 MB

```sql
-- מחיקת תוצאות HTTP ישנות (430 MB)
DELETE FROM net._http_response WHERE created < now() - interval '1 day';

-- מחיקת היסטוריית cron ישנה (261 MB)
DELETE FROM cron.job_run_details WHERE start_time < now() - interval '1 day';

-- מחיקת audit logs ישנים (34 MB)
DELETE FROM auth.audit_log_entries WHERE created_at < now() - interval '7 days';

-- ניקוי refresh tokens ישנים (19 MB)
DELETE FROM auth.refresh_tokens WHERE updated_at < now() - interval '7 days';

-- VACUUM FULL כדי לשחרר את הנפח לדיסק (חובה אחרי DELETE!)
VACUUM FULL net._http_response;
VACUUM FULL cron.job_run_details;
VACUUM FULL auth.audit_log_entries;
VACUUM FULL auth.refresh_tokens;
```

### שלב 2: שינוי תדירות ה-cron job ל**פעם ביום**

ה-cron job רץ כל דקה - הרבה מדי. אשנה לרוץ **פעם ביום בשעה 06:00 בבוקר**.
זה יפחית את הלוגים פי **1,440** (מ-1,440 הרצות ביום ל-1 בלבד).

```sql
SELECT cron.unschedule(1);
SELECT cron.schedule(
  'process-scheduled-emails-daily',
  '0 6 * * *',  -- כל יום ב-06:00
  $$
    SELECT net.http_post(
      url:='https://uwqwlltrfvokjlaufguz.supabase.co/functions/v1/process-scheduled-emails',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer ..."}'::jsonb,
      body:=concat('{"time": "', now(), '"}')::jsonb
    );
  $$
);
```

**השפעה על התזמון של מיילים:**
- אם תתזמני מייל לשעה 14:00 ביום מסוים - הוא יישלח רק למחרת ב-06:00.
- אם זה בעייתי, אפשר להריץ פעמיים ביום (06:00 + 18:00) - עדיין חיסכון אדיר.
- אם בכלל לא משתמשים בפיצ'ר הזה - אפשר פשוט לבטל לגמרי את ה-cron.

### שלב 3: cron job יומי שמנקה לוגים אוטומטית - ימנע הצטברות לעולם

```sql
SELECT cron.schedule(
  'cleanup-old-logs',
  '0 3 * * *',  -- כל יום ב-03:00
  $$
    DELETE FROM net._http_response WHERE created < now() - interval '3 days';
    DELETE FROM cron.job_run_details WHERE start_time < now() - interval '3 days';
    DELETE FROM auth.audit_log_entries WHERE created_at < now() - interval '14 days';
  $$
);
```

---

## תוצאה צפויה

| מצב | נפח DB | הרצות cron ביום |
|-----|--------|----------------|
| לפני | ~750 MB | 1,440 |
| אחרי | **~5-10 MB** | **1** |

**צמצום של ~99%** - תוכלי לעבור בקלות לתוכנית Free (מגבלה 500 MB).

---

## הערות חשובות

1. **המידע העסקי שלך לא נמחק** - רק לוגים פנימיים. כל הלקוחות, הסטוריז, המנויים, התשלומים, הפגישות נשארים בדיוק כמו שהם.

2. **VACUUM FULL נדרש** - DELETE רגיל מוחק שורות אבל לא משחרר נפח לדיסק. רק VACUUM FULL עושה זאת. הוא נועל את הטבלה לרגעים ספורים בזמן הריצה.

3. **שאלה לפני ביצוע**: רוצה שאריץ פעם ביום (06:00) או פעמיים ביום (06:00 + 18:00)? פעמיים ביום עדיין נותן חיסכון של 99.86%.

4. **לאחר ביצוע** - תוכלי לבדוק ב-Supabase Dashboard את גודל הפרויקט ואז לעבור לתוכנית Free ידנית מ-Settings → Billing.

האם לבצע את התוכנית?
