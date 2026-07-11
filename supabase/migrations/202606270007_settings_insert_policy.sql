-- 007_settings_insert_policy.sql
CREATE POLICY "Users insert own settings" ON settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);
