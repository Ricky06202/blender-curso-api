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

    // 4. Configurar cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 1 día
      path: '/',
    });

    // 5. Responder sin la contraseña
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({ 
      message: 'Inicio de sesión exitoso',
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

export const getProfile = (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'No autorizado' });
  }
  res.json({ user: req.user });
};
