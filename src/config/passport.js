import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcryptjs';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';

// Estrategia local (email/contraseña)
passport.use(new LocalStrategy(
  {
    usernameField: 'email',
    passwordField: 'password'
  },
  async (email, password, done) => {
    try {
      // Buscar usuario por email
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!user) {
        return done(null, false, { message: 'Usuario no encontrado' });
      }

      // Verificar contraseña
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return done(null, false, { message: 'Contraseña incorrecta' });
      }

      // Usuario autenticado correctamente
      return done(null, {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      });
    } catch (error) {
      return done(error);
    }
  }
));

// Serializar usuario para la sesión
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserializar usuario de la sesión
passport.deserializeUser(async (id, done) => {
  try {
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
