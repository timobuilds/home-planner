// Create lib/db.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema'; // Import all schemas

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error("Missing env variable: DATABASE_URL");
}

// Configure the PostgreSQL client
// See https://github.com/porsager/postgres#options
// Important for serverless: use pool mode (default), configure idle timeout, max lifetime, etc.
const client = postgres(connectionString, {
    // prepare: false, // Use prepared statements (default is true) unless specifically needed otherwise
    max: 10, // Example: Max connections in pool
    idle_timeout: 20, // Example: Close idle connections after 20s
    max_lifetime: 60 * 5, // Example: Reconnect after 5 mins
});

export const db = drizzle(client, { schema, logger: process.env.NODE_ENV === 'development' }); // Enable logging in dev