// Middleware para verificar si el usuario está autenticado
export const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: 'No autorizado' });
};

// Middleware para verificar si el usuario es administrador
export const isAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === 'ADMIN') {
    return next();
  }
  return res.status(403).json({ message: 'Acceso denegado. Se requieren permisos de administrador' });
};
