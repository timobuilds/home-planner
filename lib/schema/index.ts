// Create lib/schema/index.ts (Exports all schemas for Drizzle)
export * from './users';
export * from './projects';
export * from './tasks';
export * from './projectTeamMembers';
export type { DbTask, NewDbTask } from './tasks';

// TODO: Export other schemas as they are created
// export * from './budgets';
// export * from './contacts';
// export * from './projectTeamMembers'; // Renamed for clarity (join table)
// export * from './documents';
