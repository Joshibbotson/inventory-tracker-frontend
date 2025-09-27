import { AuthProvider } from '../enums/AuthProvider.enum';

export type User = {
  name: string;
  email: string;
  pictureUrl?: string;
  id: string;
  verifiedEmail: boolean;
  settings?: any;
  isFirstLogin: boolean;
  currentWorkoutSplitId?: string;
  authProvider: AuthProvider;
};
