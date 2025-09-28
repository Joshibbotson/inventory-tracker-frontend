import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../features/auth/services/auth.service';

export const verifiedEmailGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const currentUser = authService.User;

  if (!currentUser || !currentUser.verifiedEmail) {
    // Instead of completely blocking access, redirect to a verification required page
    router.navigate(['/verification-required']);
    return false;
  }

  return true;
};
