-- ============================================================
-- AUTH TRIGGER (run this after everything else)
-- This creates a profile automatically when a user signs up
-- ============================================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
