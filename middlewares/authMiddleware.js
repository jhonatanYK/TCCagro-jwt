
const jwt = require('jsonwebtoken');
require('dotenv').config();
const generateToken = (user) => {
  const payload = {
    id: user.id,
    username: user.username,
    name: user.name
  };
  return jwt.sign(
    payload,
    process.env.SECRET_KEY,
    { expiresIn: '1h' }
  );
};

const authMiddleware = (req, res, next) => {
  const token = req.cookies?.token || req.headers['authorization']?.split(' ')[1];
  if (!token) {
    return res.status(401).send({ error: 'No token provided' });
  }
  jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).send({ error: 'Invalid token' });
    }
    req.user = decoded;
    req.userId = decoded.id; // Adiciona req.userId para facilitar o uso
    next();
  });
};

module.exports = {
  generateToken,
  authMiddleware
}