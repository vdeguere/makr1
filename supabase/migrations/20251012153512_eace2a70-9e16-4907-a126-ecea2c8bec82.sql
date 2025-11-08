-- Update RLS policy for recommendation_items to allow admins/devs
DROP POLICY IF EXISTS "Practitioners can manage recommendation items" ON recommendation_items;

CREATE POLICY "Users can manage recommendation items"
ON recommendation_items
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM recommendations
    WHERE recommendations.id = recommendation_items.recommendation_id
    AND recommendations.practitioner_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM recommendations
    WHERE recommendations.id = recommendation_items.recommendation_id
    AND recommendations.practitioner_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);