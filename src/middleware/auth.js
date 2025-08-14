const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const headerToken = req.headers.authorization?.split(' ')[1];
  const queryToken = req.query.token;
  const bodyToken = req.body?.token;

  console.log("Header token:", headerToken);
  console.log("Query token:", queryToken);
  console.log("Body token:", bodyToken);

  const token = headerToken || queryToken || bodyToken;

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // attach user info to request
    next();
  } catch (e) {
    console.error('JWT verify error:', e.message);
    return res.status(401).json({ error: 'Invalid token' });
  }
};
