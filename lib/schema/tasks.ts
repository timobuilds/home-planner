import { pgTable, text, timestamp, integer, serial, index, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { projects } from './projects'; // Link back to projects
// Optional: Link to assignees (commented out for now)
// import { users } from './users'; 

// Define possible task statuses for Kanban board
export const taskStatusEnum = pgEnum('task_status', ['todo', 'inprogress', 'done', 'archived']);

export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  clerkUserId: text('clerk_user_id').notNull(), // User who owns the project (for access checks)
  title: text('title').notNull(),
  description: text('description'),
  status: taskStatusEnum('status').default('todo').notNull(), // Status for Kanban
  priority: integer('priority').default(0), // Example: 0=Low, 1=Medium, 2=High
  dueDate: timestamp('due_date', { withTimezone: true }),
  assigneeClerkUserId: text('assignee_clerk_user_id'), // Optional: Clerk ID of the assigned user
  order: integer('order').default(0).notNull(), // For manual sorting within statuses
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    // Indexes for common lookups
    projectIdIdx: index('tasks_project_id_idx').on(table.projectId),
    statusIdx: index('tasks_status_idx').on(table.status),
    dueDateIdx: index('tasks_due_date_idx').on(table.dueDate),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
  // Optional: Relation to the user assigned to the task
  // assignee: one(users, {
  //   fields: [tasks.assigneeClerkUserId],
  //   references: [users.clerkId], // Assuming assignee links via Clerk ID directly
  //   relationName: 'taskAssignee'
  // }),
}));

export type DbTask = typeof tasks.$inferSelect;
export type NewDbTask = typeof tasks.$inferInsert;
