import { pgTable, text, timestamp, integer, serial, boolean, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

// TODO: Import other related schemas (budgets, tasks, contacts, etc.) when created
// import { budgets } from './budgets';
// import { tasks } from './tasks';
// import { contacts } from './contacts';
// import { projectTeamMembers } from './projectTeamMembers';
// import { documents } from './documents';

export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  // We link primarily via clerkUserId for easier checks in middleware/server actions
  // The internal userId is useful for relational integrity within the DB if needed
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }), // FK to internal users.id (optional but good practice)
  clerkUserId: text('clerk_user_id').notNull(), // Denormalized Clerk ID for direct access checks
  name: text('name').notNull(),
  description: text('description'),
  address: text('address'), // Consider making this structured (street, city, etc.) if needed for features
  isArchived: boolean('is_archived').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
    // Index for quickly finding projects by user
    return {
        clerkUserIdIdx: index('projects_clerk_user_id_idx').on(table.clerkUserId),
        userIdx: index('projects_user_id_idx').on(table.userId), // Index if using internal ID frequently
    }
});

// Define relationships
export const projectsRelations = relations(projects, ({ one, many }) => ({
  // Relation back to the owner using the internal ID (if `userId` column is used)
  owner: one(users, {
    fields: [projects.userId],
    references: [users.id],
    relationName: 'projectOwner' // Optional explicit relation name
  }),
  // TODO: Define relations to other project-specific tables
  // budgets: many(budgets),
  // tasks: many(tasks),
  // contacts: many(contacts),
  // teamMembers: many(projectTeamMembers),
  // documents: many(documents),
}));

// Type helper for database project record
export type DbProject = typeof projects.$inferSelect;
// Type helper for inserting a new project
export type NewDbProject = typeof projects.$inferInsert;
