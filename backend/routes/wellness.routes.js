const express = require('express');
const router = express.Router();
const { createSupabaseClient } = require('../config/supabase');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const supabase = createSupabaseClient(req);
    const { month, year } = req.query;
    
    let query = supabase.from('wellness').select('*');
    
    if (month && year) {
      const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];
      query = query.gte('log_date', startDate).lte('log_date', endDate);
    }

    const { data, error } = await query.order('log_date', { ascending: false });

    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const supabase = createSupabaseClient(req);
    const { log_date, mood, sleep, notes } = req.body;
    
    const { data, error } = await supabase
      .from('wellness')
      .upsert({
        user_id: req.user.id,
        log_date,
        mood,
        sleep,
        notes
      }, { onConflict: 'user_id,log_date' })
      .select()
      .single();

    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
