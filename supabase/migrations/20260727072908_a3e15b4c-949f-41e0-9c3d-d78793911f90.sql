-- Anonymous visitors only ever need active announcements; drop the admin branch for them.
DROP POLICY "announcements public read" ON public.announcements;
CREATE POLICY "announcements anon read active" ON public.announcements FOR SELECT TO anon USING (is_active);
CREATE POLICY "announcements auth read" ON public.announcements FOR SELECT TO authenticated
  USING (is_active OR public.has_role(auth.uid(), 'admin'));

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated, service_role;