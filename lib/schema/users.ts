import { pgTable, text, timestamp, varchar, serial, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { projects } from './projects'; // Adjusted import path

// Define ENUM for plan types if your DB supports it, otherwise use varchar
// import { pgEnum } from 'drizzle-orm/pg-core';
// export const planEnum = pgEnum('plan_enum', ['free', 'pro']);

export const users = pgTable('users', {
  id: serial('id').primaryKey(), // Internal auto-incrementing ID
  clerkId: text('clerk_id').unique().notNull(), // Clerk User ID is the main identifier
  email: text('email').unique().notNull(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  profileImageUrl: text('profile_image_url'),
  // plan: planEnum('plan').default('free').notNull(), // Use if using pgEnum
  plan: varchar('plan', { length: 10 }).default('free').notNull(), // 'free' or 'pro'
  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubscriptionId: text('stripe_subscription_id').unique(), // If using subscriptions
  stripePriceId: text('stripe_price_id'),
  stripeCurrentPeriodEnd: timestamp('stripe_current_period_end', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
    // Add indexes for faster lookups
    return {
        clerkIdIdx: uniqueIndex('users_clerk_id_idx').on(table.clerkId),
        emailIdx: uniqueIndex('users_email_idx').on(table.email),
        stripeCustomerIdIdx: uniqueIndex('users_stripe_customer_id_idx').on(table.stripeCustomerId),
    }
});

// Define relationships: one user can have many projects
export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
}));

// Type helper for database user record
export type DbUser = typeof users.$inferSelect;
// Type helper for inserting a new user
export type NewDbUser = typeof users.$inferInsert;
