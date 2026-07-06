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
    
    // Set cookie if session exists
    if (data.session) {
      res.cookie('sb_access_token', data.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: data.session.expires_in * 1000
      });
    }

    res.status(201).json({ user: data.user, session: data.session });
  } catch (error) {
    res.status(400).json({ error: error.message });
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

    res.cookie('sb_access_token', data.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: data.session.expires_in * 1000
    });

    // Also get profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    res.status(200).json({ 
      user: { ...data.user, ...profile },
    });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

router.post('/logout', requireAuth, async (req, res) => {
  try {
    res.clearCookie('sb_access_token');
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  try {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();
      
    res.status(200).json({ user: { ...req.user, ...profile } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
