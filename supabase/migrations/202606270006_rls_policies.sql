-- 006_rls_policies.sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE employers ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE semester_breaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users read own settings" ON settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own settings" ON settings FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users manage own employers" ON employers FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own shifts" ON work_shifts FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own breaks" ON semester_breaks FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
