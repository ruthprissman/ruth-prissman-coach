
-- 1) יצירת דלי receipts (פרטי)
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

-- 2) מדיניות RLS על storage.objects עבור הדלי 'receipts'
-- קריאה לקבצים בדלי receipts למשתמשים מחוברים
create policy "Authenticated can read receipts"
on storage.objects
for select
to authenticated
using (bucket_id = 'receipts');

-- העלאה (insert) של קבצים בדלי receipts למשתמשים מחוברים
create policy "Authenticated can upload receipts"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'receipts');

-- עדכון מטא-דאטה/החלפת קובץ (אם נדרש) בדלי receipts למשתמשים מחוברים
create policy "Authenticated can update receipts"
on storage.objects
for update
to authenticated
using (bucket_id = 'receipts')
with check (bucket_id = 'receipts');

-- מחיקה של קבצים בדלי receipts למשתמשים מחוברים
create policy "Authenticated can delete receipts"
on storage.objects
for delete
to authenticated
using (bucket_id = 'receipts');
