import dotenv from 'dotenv';
dotenv.config();

export default {
  schema: "./src/db/schema.js",
  out: "./drizzle",
  dialect: 'mysql',
  strict: true,
  verbose: true,
  dbCredentials: {
    url: process.env.DATABASE_URL
  }
};