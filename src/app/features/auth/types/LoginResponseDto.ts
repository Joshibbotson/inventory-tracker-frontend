import { User } from './User';

export type LoginResponseDto = {
  user: User;
  token: string;
  expiresAt: Date;
};
