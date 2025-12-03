-- Drop the restrictive policies that only allow is_subscribed = false
DROP POLICY IF EXISTS "Allow anonymous unsubscribe for content_subscribers" ON content_subscribers;
DROP POLICY IF EXISTS "Allow anonymous unsubscribe for story_subscribers" ON story_subscribers;

-- Create new policies that allow both unsubscribe and resubscribe
CREATE POLICY "Allow anonymous subscription changes for content_subscribers"
ON content_subscribers
FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow anonymous subscription changes for story_subscribers"
ON story_subscribers
FOR UPDATE
USING (true)
WITH CHECK (true);