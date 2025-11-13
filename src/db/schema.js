import { mysqlTable, varchar, text, boolean, timestamp, int, float, serial } from 'drizzle-orm/mysql-core';

export const users = mysqlTable('users', {
  id: int('id').primaryKey().autoincrement().notNull(),
  name: varchar('name', { length: 255 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }),
  emailVerified: boolean('email_verified').default(false),
  image: varchar('image', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  role: varchar('role', { length: 50, enum: ['USER', 'ADMIN'] }).default('USER'),
});

export const accounts = mysqlTable('accounts', {
  id: int('id').primaryKey().autoincrement().notNull(),
  userId: int('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 255 }).notNull(),
  provider: varchar('provider', { length: 255 }).notNull(),
  providerAccountId: varchar('provider_account_id', { length: 255 }).notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: int('expires_at'),
  token_type: varchar('token_type', { length: 255 }),
  scope: varchar('scope', { length: 255 }),
  id_token: text('id_token'),
  session_state: varchar('session_state', { length: 255 }),
}, (table) => ({
  providerProviderAccountId: {
    unique: true,
    columns: [table.provider, table.providerAccountId],
  },
}));

export const sessions = mysqlTable('sessions', {
  id: int('id').primaryKey().autoincrement().notNull(),
  sessionToken: varchar('session_token', { length: 255 }).notNull().unique(),
  userId: int('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires').notNull(),
});

export const verificationTokens = mysqlTable('verification_tokens', {
  id: int('id').primaryKey().autoincrement().notNull(),
  identifier: varchar('identifier', { length: 255 }).notNull(),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expires: timestamp('expires').notNull(),
}, (table) => ({
  identifierToken: {
    unique: true,
    columns: [table.identifier, table.token],
  },
}));

export const chapters = mysqlTable('chapters', {
  id: int('id').primaryKey().autoincrement().notNull(),
  order: int('order').notNull().unique(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  videoUrl: varchar('video_url', { length: 255 }),
  duration: int('duration'),
  isPublished: boolean('is_published').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const sections = mysqlTable('sections', {
  id: int('id').primaryKey().autoincrement().notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  order: int('order').notNull(),
  chapterId: int('chapter_id')
    .notNull()
    .references(() => chapters.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const userChapterProgress = mysqlTable('user_chapter_progress', {
  id: int('id').primaryKey().autoincrement().notNull(),
  userId: int('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  chapterId: int('chapter_id')
    .notNull()
    .references(() => chapters.id, { onDelete: 'cascade' }),
  isCompleted: boolean('is_completed').default(false),
  completedAt: timestamp('completed_at'),
  lastPlayedAt: timestamp('last_played_at'),
  progress: float('progress'),
  videoProgress: int('video_progress'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
}, (table) => ({
  userChapterUnique: {
    unique: true,
    columns: [table.userId, table.chapterId],
  },
}));
