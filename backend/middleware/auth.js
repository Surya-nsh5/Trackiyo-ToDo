const { supabaseAdmin } = require('../config/supabase');

const requireAuth = async (req, res, next) => {
  const token = req.cookies.sb_access_token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ message: 'Invalid or expired token', error: error?.message });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error during authentication' });
  }
};

module.exports = { requireAuth };
