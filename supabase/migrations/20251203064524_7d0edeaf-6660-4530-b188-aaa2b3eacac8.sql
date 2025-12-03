-- Allow anonymous users to unsubscribe from content_subscribers
CREATE POLICY "Allow anonymous unsubscribe for content_subscribers"
ON content_subscribers
FOR UPDATE
USING (true)
WITH CHECK (is_subscribed = false);

-- Allow anonymous users to unsubscribe from story_subscribers
CREATE POLICY "Allow anonymous unsubscribe for story_subscribers"
ON story_subscribers
FOR UPDATE
USING (true)
WITH CHECK (is_subscribed = false);