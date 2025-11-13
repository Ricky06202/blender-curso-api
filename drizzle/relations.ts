import { relations } from "drizzle-orm/relations";
import { users, accounts, chapters, sections, sessions, userChapterProgress } from "./schema";

export const accountsRelations = relations(accounts, ({one}) => ({
	user: one(users, {
		fields: [accounts.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	accounts: many(accounts),
	sessions: many(sessions),
	userChapterProgresses: many(userChapterProgress),
}));

export const sectionsRelations = relations(sections, ({one}) => ({
	chapter: one(chapters, {
		fields: [sections.chapterId],
		references: [chapters.id]
	}),
}));

export const chaptersRelations = relations(chapters, ({many}) => ({
	sections: many(sections),
	userChapterProgresses: many(userChapterProgress),
}));

export const sessionsRelations = relations(sessions, ({one}) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id]
	}),
}));

export const userChapterProgressRelations = relations(userChapterProgress, ({one}) => ({
	chapter: one(chapters, {
		fields: [userChapterProgress.chapterId],
		references: [chapters.id]
	}),
	user: one(users, {
		fields: [userChapterProgress.userId],
		references: [users.id]
	}),
}));