import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import passport from 'passport';

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
    const result = await db
      .insert(users)
      .values({
        email,
        password: hashedPassword,
        name,
        role: 'USER',
        emailVerified: false,
        image: null
      });

    // Obtener el usuario creado (MySQL no soporta .returning())
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    // Retornar respuesta exitosa
    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error en el registro:', error);
    res.status(500).json({ 
      message: 'Error al registrar el usuario',
      error: error.message 
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Buscar usuario por email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // 2. Verificar contraseña
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // 3. Generar token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'tu_secreto_secreto',
      { expiresIn: '1d' }
    );

    // 4. Responder con el token y usuario
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({ 
      message: 'Inicio de sesión exitoso',
      token,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Error en el login:', error);
    res.status(500).json({ 
      message: 'Error al iniciar sesión',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const logout = (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Sesión cerrada exitosamente' });
};

export const getProfile = async (req, res) => {
  try {
    // Obtener datos completos del usuario desde la base de datos
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role
      })
      .from(users)
      .where(eq(users.id, req.user.id))
      .limit(1);

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json({ 
      user: {
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ message: 'Error al obtener perfil' });
  }
};

// Google OAuth endpoints
export const googleAuth = passport.authenticate('google', { 
  session: false,
  scope: ['profile', 'email'] 
});

export const googleCallback = (req, res) => {
  passport.authenticate('google', { session: false }, (err, data) => {
    if (err || !data) {
      // Devolver error JSON para debugging
      return res.status(400).json({ 
        error: 'Google authentication failed',
        message: err?.message || 'Authentication error',
        details: err?.toString()
      });
    }

    const { user, token } = data;
    
    try {
      // Redirigir al frontend con el token y datos del usuario
      const userData = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        image: user.image
      };

      res.redirect(`${process.env.FRONTEND_URL}?token=${token}&user=${encodeURIComponent(JSON.stringify(userData))}`);
    } catch (redirectError) {
      return res.status(500).json({
        error: 'Redirect failed',
        message: redirectError.message,
        user: user.email
      });
    }
  })(req, res);
};
