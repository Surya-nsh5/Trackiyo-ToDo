const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables.');
}

const createSupabaseClient = (req) => {
  const token = req.cookies.sb_access_token || req.headers.authorization?.split(' ')[1];
  
  if (token) {
    return createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });
  }
  
  return createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY || '');
};

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

module.exports = {
  createSupabaseClient,
  supabaseAdmin
};
