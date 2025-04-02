// Create drizzle.config.ts
import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// Load appropriate environment variables for drizzle-kit
// .env.local is commonly used for local development secrets
dotenv.config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    // Provide a more helpful error message for setup
    throw new Error(`
        Missing DATABASE_URL environment variable.
        Ensure it's set in your .env.local file for drizzle-kit commands.
        Example format: "postgresql://user:password@host:port/db?sslmode=require"
        You can find it in your Supabase project settings under Database -> Connection string.
        Use the URI tab and ensure you are using the connection pooling port (6543) for serverless environments.
    `);
}

export default defineConfig({
  schema: './lib/schema/index.ts', // Point to the schema index file
  out: './drizzle/migrations',     // Output directory for migrations
  dialect: 'postgresql',
  dbCredentials: {
    url: connectionString,
  },
  verbose: true,                  // Enable detailed logging during generation/migration
  strict: true,                   // Enable strict type checking
});