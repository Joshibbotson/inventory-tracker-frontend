import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../features/auth/services/auth.service';

export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const routePathLogin = route.routeConfig?.path === 'login';

  // check for logged in user if route is login page
  // only allow access if no logged in user.
  if (routePathLogin) {
    if (authService.User) {
      router.navigate(['/dashboard']);
      return false;
    }
    const user = authService.getUserFromLocalStorage();

    if (user !== null) {
      authService.User = user;
      router.navigate(['/dashboard']);

      return false;
    }

    return true;
  }

  // check if logged in user else redirect to login page
  if (authService.User) {
    return true;
  }

  const user = authService.getUserFromLocalStorage();

  if (user !== null) {
    authService.User = user;
    return true;
  }

  router.navigate(['/login']);
  return false;
};
