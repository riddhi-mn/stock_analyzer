const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token      = authHeader.split(' ')[1];

  //console.log('→ AUTH HEADER:', authHeader);
  //console.log('→ TOKEN:', token);
  //console.log('→ JWT_SECRET:', process.env.JWT_SECRET);

  if (!token) {
    return res.status(401).json({ error: 'No token' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    return next();  
  } catch (e) {
    console.error('→ jwt.verify error:', e.message);
    return res.status(401).json({ error: 'Invalid token' });
  }
};
