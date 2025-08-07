// Export all shared types
export * from './shared-types';

// Re-export specific backend types that might be needed
export type { 
  IUser, 
  IProject, 
  IDataFile, 
  ISample, 
  IWorkflowRun,
  AuthenticatedRequest 
} from './backend-types';

// Re-export frontend-specific types that might be needed
export type {
  User as FrontendUser,
  Project as FrontendProject,
  DataFile as FrontendDataFile
} from './frontend-types';