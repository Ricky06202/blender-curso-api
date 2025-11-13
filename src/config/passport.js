// src/config/passport.js
import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';

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

export default passport;