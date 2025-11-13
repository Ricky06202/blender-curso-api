import { mysqlTable, mysqlSchema, AnyMySqlColumn, foreignKey, int, varchar, text, unique, timestamp, float } from "drizzle-orm/mysql-core"
import { sql } from "drizzle-orm"

export const accounts = mysqlTable("accounts", {
	id: int().autoincrement().notNull(),
	userId: int("user_id").notNull().references(() => users.id, { onDelete: "cascade" } ),
	type: varchar({ length: 255 }).notNull(),
	provider: varchar({ length: 255 }).notNull(),
	providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
	refreshToken: text("refresh_token").default('NULL'),
	accessToken: text("access_token").default('NULL'),
	expiresAt: int("expires_at").default('NULL'),
	tokenType: varchar("token_type", { length: 255 }).default('NULL'),
	scope: varchar({ length: 255 }).default('NULL'),
	idToken: text("id_token").default('NULL'),
	sessionState: varchar("session_state", { length: 255 }).default('NULL'),
});

export const chapters = mysqlTable("chapters", {
	id: int().autoincrement().notNull(),
	order: int().notNull(),
	slug: varchar({ length: 255 }).notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text().notNull(),
	videoUrl: varchar("video_url", { length: 255 }).default('NULL'),
	duration: int().default('NULL'),
	isPublished: tinyint("is_published").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).default('current_timestamp()').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default('current_timestamp()').notNull(),
},
(table) => [
	unique("chapters_order_unique").on(table.order),
	unique("chapters_slug_unique").on(table.slug),
]);

export const sections = mysqlTable("sections", {
	id: int().autoincrement().notNull(),
	title: varchar({ length: 255 }).notNull(),
	content: text().notNull(),
	order: int().notNull(),
	chapterId: int("chapter_id").notNull().references(() => chapters.id, { onDelete: "cascade" } ),
	createdAt: timestamp("created_at", { mode: 'string' }).default('current_timestamp()').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default('current_timestamp()').notNull(),
});

export const sessions = mysqlTable("sessions", {
	id: int().autoincrement().notNull(),
	sessionToken: varchar("session_token", { length: 255 }).notNull(),
	userId: int("user_id").notNull().references(() => users.id, { onDelete: "cascade" } ),
	expires: timestamp({ mode: 'string' }).default('current_timestamp()').notNull(),
},
(table) => [
	unique("sessions_session_token_unique").on(table.sessionToken),
]);

export const users = mysqlTable("users", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).default('NULL'),
	email: varchar({ length: 255 }).notNull(),
	password: varchar({ length: 255 }).default('NULL'),
	emailVerified: tinyint("email_verified").default(0),
	image: varchar({ length: 255 }).default('NULL'),
	createdAt: timestamp("created_at", { mode: 'string' }).default('current_timestamp()').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default('current_timestamp()').notNull(),
	role: varchar({ length: 50 }).default('\'USER\''),
},
(table) => [
	unique("users_email_unique").on(table.email),
]);

export const userChapterProgress = mysqlTable("user_chapter_progress", {
	id: int().autoincrement().notNull(),
	userId: int("user_id").notNull().references(() => users.id, { onDelete: "cascade" } ),
	chapterId: int("chapter_id").notNull().references(() => chapters.id, { onDelete: "cascade" } ),
	isCompleted: tinyint("is_completed").default(0),
	completedAt: timestamp("completed_at", { mode: 'string' }).default('current_timestamp()').notNull(),
	lastPlayedAt: timestamp("last_played_at", { mode: 'string' }).default('''0000-00-00 00:00:00''').notNull(),
	progress: float().default('NULL'),
	videoProgress: int("video_progress").default('NULL'),
	createdAt: timestamp("created_at", { mode: 'string' }).default('current_timestamp()').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default('current_timestamp()').notNull(),
});

export const verificationTokens = mysqlTable("verification_tokens", {
	id: int().autoincrement().notNull(),
	identifier: varchar({ length: 255 }).notNull(),
	token: varchar({ length: 255 }).notNull(),
	expires: timestamp({ mode: 'string' }).default('current_timestamp()').notNull(),
},
(table) => [
	unique("verification_tokens_token_unique").on(table.token),
]);
