const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase');
const { requireAuth } = require('../middleware/auth');

router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const { data, error } = await supabaseAdmin.auth.signUp({
      email,
      password,
      options: {
        data: { name }
      }
    });

    if (error) throw error;
    
    res.status(201).json({ 
      success: true,
      message: 'Signup successful',
      user: data.user, 
      session: data.session 
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Also get profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    res.status(200).json({ 
      success: true,
      message: 'Login successful',
      user: { ...data.user, ...profile },
      session: data.session
    });
  } catch (error) {
    res.status(401).json({ success: false, error: error.message });
  }
});

router.post('/logout', requireAuth, async (req, res) => {
  try {
    // The actual token invalidation can be done client side for JWTs,
    // but if we were storing sessions in DB, we'd delete them here.
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  try {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();
      
    res.status(200).json({ 
      success: true,
      user: { ...req.user, ...profile } 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
