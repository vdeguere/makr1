-- Explicitly deny practitioners from creating herbs
CREATE POLICY "Practitioners cannot create herbs"
ON public.herbs
FOR INSERT
TO authenticated
WITH CHECK (NOT has_role(auth.uid(), 'practitioner'::app_role));

-- Explicitly deny practitioners from updating herbs
CREATE POLICY "Practitioners cannot update herbs"
ON public.herbs
FOR UPDATE
TO authenticated
USING (NOT has_role(auth.uid(), 'practitioner'::app_role))
WITH CHECK (NOT has_role(auth.uid(), 'practitioner'::app_role));

-- Explicitly deny practitioners from deleting herbs
CREATE POLICY "Practitioners cannot delete herbs"
ON public.herbs
FOR DELETE
TO authenticated
USING (NOT has_role(auth.uid(), 'practitioner'::app_role));