// Create lib/auth.ts
import { auth, currentUser, clerkClient } from '@clerk/nextjs/server';
import { db } from './db';
import { users } from './schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';

/**
 * Gets the Clerk user ID from the current session.
 * Throws an error if the user is not authenticated.
 */
export function getRequiredAuthSession() {
    const { userId } = auth();
    if (!userId) {
        console.error("Authentication required. User ID is null.");
        // In server components/actions, redirecting is often appropriate
        redirect('/sign-in');
        // Or throw an error for API routes / specific cases
        // throw new Error("Authentication required.");
    }
    return { userId };
}

/**
 * Gets the full Clerk User object for the current session.
 * Returns null if not authenticated. Caches the result per request.
 */
export async function getCurrentUser() {
    // currentUser() is the recommended way in App Router Server Components
    const user = await currentUser();
    return user;
}


/**
 * Gets the full Clerk User object for the current session.
 * Throws an error (or redirects) if not authenticated.
 */
export async function getRequiredCurrentUser() {
    const { userId } = auth(); // First check if a session exists
    if (!userId) {
        console.error("Authentication required (getRequiredCurrentUser). User ID is null.");
        redirect('/sign-in');
    }
    // Fetch the full user object using the known userId
    // This ensures we get the most up-to-date user data
    const user = await clerkClient.users.getUser(userId);
     if (!user) {
        // This case should be rare if auth() passes but indicates an issue
         console.error(`Clerk user not found for userId: ${userId}`);
        redirect('/sign-in');
     }
    return user;
}


/**
 * Finds the corresponding user in our database based on the Clerk user ID.
 * Returns the database user record or null if not found.
 */
export async function getDbUser() {
    const { userId } = auth(); // Use auth() for efficiency if only ID is needed initially
    if (!userId) {
        return null;
    }

    try {
        const dbUser = await db.query.users.findFirst({
            where: eq(users.clerkId, userId),
        });
        return dbUser ?? null;
    } catch (error) {
        console.error("Error fetching database user:", error);
        return null;
    }
}

/**
 * Finds the corresponding user in our database.
 * Throws an error (or redirects) if the user is not authenticated or not found in the DB.
 */
export async function getRequiredDbUser() {
    const { userId } = getRequiredAuthSession(); // Ensures authentication

    try {
        const dbUser = await db.query.users.findFirst({
            where: eq(users.clerkId, userId),
        });

        if (!dbUser) {
            // This indicates a sync issue: user exists in Clerk but not in our DB.
            // Attempting to sync here might hide underlying problems with webhook/signup flow.
            // It's often better to log this and investigate the sync process.
            console.error(`Database user not found for Clerk user ID: ${userId}. Check sync process.`);
            // Depending on the desired behavior, you might:
            // 1. Redirect to an error page or sign-in
            // redirect('/error?code=DB_USER_NOT_FOUND');
            // 2. Throw an error
            throw new Error("Database user record not found.");
            // 3. Attempt findOrCreateDbUser (use cautiously)
            // const syncedUser = await findOrCreateDbUser();
            // if (!syncedUser) throw new Error("Failed to find or create DB user.");
            // return syncedUser;
        }
        return dbUser;

    } catch (error) {
        console.error("Error fetching required database user:", error);
        // Re-throw or handle appropriately
        throw error;
        // Or redirect: redirect('/error?code=DB_FETCH_FAILED');
    }
}


/**
 * Finds or creates a user in the database based on the current Clerk user.
 * Should ideally be triggered by a Clerk webhook (user.created) for reliability.
 * Can be used as a fallback, e.g., on first access to a protected route.
 * Ensure sensitive data handling (email verification status, etc.).
 */
export async function findOrCreateDbUser() {
    const clerkUser = await getCurrentUser(); // Use the cached currentUser()

    if (!clerkUser) {
        console.warn("findOrCreateDbUser called without an authenticated user.");
        return null;
    }

    try {
        // Check if user already exists
        const existingUser = await db.query.users.findFirst({
            where: eq(users.clerkId, clerkUser.id),
        });

        if (existingUser) {
            // Optional: Implement logic to update user fields if they changed in Clerk
            // This is often better handled by user.updated webhook
            // Consider checking primary email verification status if relevant
            return existingUser;
        }

        // User does not exist, create them
        console.log(`Creating new database user for Clerk ID: ${clerkUser.id}`);
        const [newUser] = await db.insert(users).values({
            clerkId: clerkUser.id,
            email: clerkUser.primaryEmailAddress?.emailAddress ?? 'missing-email', // Handle potential missing email
            firstName: clerkUser.firstName,
            lastName: clerkUser.lastName,
            profileImageUrl: clerkUser.imageUrl,
            // plan: 'free' // Default is set in schema
            // createdAt/updatedAt have defaults
        }).returning();

        if (!newUser) {
            throw new Error("Failed to create user in database transaction.");
        }
        console.log(`Successfully created new database user with ID: ${newUser.id}`);
        return newUser;

    } catch (error) {
        console.error(`Error in findOrCreateDbUser for Clerk ID ${clerkUser.id}:`, error);
        // Depending on context, might return null, throw, or redirect
        return null;
    }
}

/**
 * Checks if the current user has a Pro plan based on the database record.
 * Requires authentication. Returns false if not authenticated or not Pro.
 */
export async function isProUser(): Promise<boolean> {
    const dbUser = await getDbUser(); // Fetches DB user based on current Clerk session
    return dbUser?.plan === 'pro';
}

/**
 * Server Action or Route Handler decorator to ensure the user is authenticated
 * and their record exists in the database. It calls findOrCreateDbUser.
 * Use this cautiously at the entry points of protected features if webhook sync
 * cannot be fully relied upon or needs a fallback.
 */
export async function ensureUserSynced() {
    const { userId } = auth(); // Check auth status first
    if (!userId) {
        redirect('/sign-in'); // Or throw appropriate error for API routes
    }
    // Attempt to find or create the user in the DB
    const dbUser = await findOrCreateDbUser();
    if (!dbUser) {
        // Handle the case where findOrCreate failed (e.g., DB error)
        console.error("Failed to sync user with database.");
        // redirect('/error?code=USER_SYNC_FAILED'); // Example redirect
        throw new Error("Failed to ensure user is synced with the database.");
    }
    return dbUser; // Return the synced DB user record
}
