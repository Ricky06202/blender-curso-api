import bcrypt from 'bcryptjs';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export const register = async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // Verificar si el usuario ya existe
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser) {
      return res.status(400).json({ message: 'El correo ya está registrado' });
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear el usuario
    const [user] = await db
      .insert(users)
      .values({
        email,
        password: hashedPassword,
        name,
        role: 'USER',
        emailVerified: false,
        image: null
      })
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role
      });

    // Iniciar sesión automáticamente después del registro
    req.login(user, (err) => {
      if (err) {
        return res.status(500).json({ message: 'Error al iniciar sesión' });
      }
      res.status(201).json(user);
    });
  } catch (error) {
    console.error('Error en el registro:', error);
    res.status(500).json({ 
      message: 'Error al registrar el usuario',
      error: error.message 
    });
  }
};

export const login = (req, res, next) => {
  passport.authenticate('local', async (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(401).json({ message: info.message || 'Credenciales inválidas' });
    }
    
    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      
      // No devolver la contraseña en la respuesta
      const { password, ...userWithoutPassword } = user;
      return res.json({
        message: 'Inicio de sesión exitoso',
        user: userWithoutPassword
      });
    });
  })(req, res, next);
};

export const logout = (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ message: 'Error al cerrar sesión' });
    }
    res.json({ message: 'Sesión cerrada exitosamente' });
  });
};

export const getProfile = (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'No autorizado' });
  }
  res.json({ user: req.user });
};
