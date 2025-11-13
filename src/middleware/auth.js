import passport from 'passport';

export const isAuthenticated = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err || !user) {
      return res.status(401).json({ 
        error: 'No autorizado',
        details: info?.message || 'Token inválido o expirado'
      });
    }
    req.user = user;
    return next();
  })(req, res, next);
}; // Added the missing closing brace and semicolon