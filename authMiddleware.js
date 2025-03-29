const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  // Obtener token del header
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Acceso no autorizado' });
  }

  try {
    // Verificar token
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    req.user = decoded; // Añadir datos del usuario al request
    next();
  } catch (error) {
    console.error('Error al verificar token:', error);
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

module.exports = authMiddleware;