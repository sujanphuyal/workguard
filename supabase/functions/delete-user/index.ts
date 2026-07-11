import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  const token = authHeader.replace('Bearer ', '');
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401 });
  }

  const userId = userData.user.id;
  await supabase.from('work_shifts').delete().eq('user_id', userId);
  await supabase.from('employers').delete().eq('user_id', userId);
  await supabase.from('semester_breaks').delete().eq('user_id', userId);
  await supabase.from('settings').delete().eq('user_id', userId);
  await supabase.from('profiles').delete().eq('id', userId);

  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
});
