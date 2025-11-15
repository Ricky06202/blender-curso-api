// src/config/passport.js
import dotenv from 'dotenv';
dotenv.config();

import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET || 'tu_secreto_secreto',
};

passport.use(
  new JwtStrategy(jwtOptions, async (payload, done) => {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, payload.id))
        .limit(1);

      if (user) {
        return done(null, user);
      }
      return done(null, false);
    } catch (error) {
      return done(error, false);
    }
  })
);

// Google OAuth Strategy
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID);
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'NOT SET');

try {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/api/auth/google/callback',
    scope: ['profile', 'email']
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Verificar si el usuario ya existe
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, profile.emails[0].value))
        .limit(1);

      let user;

      if (existingUser) {
        // Usuario existe, actualizar datos de Google si es necesario
        if (!existingUser.emailVerified) {
          await db
            .update(users)
            .set({ 
              emailVerified: true,
              image: profile.photos[0]?.value || existingUser.image
            })
            .where(eq(users.id, existingUser.id));
        }
        user = existingUser;
      } else {
        // Crear nuevo usuario
        await db
          .insert(users)
          .values({
            email: profile.emails[0].value,
            name: profile.displayName,
            image: profile.photos[0]?.value || null,
            emailVerified: true,
            role: 'USER',
            password: null // Usuarios de Google no tienen contraseña
          });

        const [newUser] = await db
          .select()
          .from(users)
          .where(eq(users.email, profile.emails[0].value))
          .limit(1);
        
        user = newUser;
      }

      // Generar token JWT
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );

      return done(null, { user, token });
    } catch (error) {
      return done(error, null);
    }
  }));
  console.log('✅ Google OAuth strategy configured successfully');
} catch (error) {
  console.error('❌ Error configuring Google OAuth strategy:', error.message);
}

export default passport;