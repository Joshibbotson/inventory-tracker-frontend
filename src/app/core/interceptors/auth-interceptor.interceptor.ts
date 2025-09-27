import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, throwError } from 'rxjs';
import { AuthService } from '../../features/auth/services/auth.service';

/** Intercept and handle credential failure by logging out the user
 * and redirecting to the login page
 */
export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<any>,
  next: HttpHandlerFn
): Observable<HttpEvent<any>> => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        handle401Error(router, authService);
      }
      return throwError(() => error);
    })
  );
};

function handle401Error(router: Router, authService: AuthService): void {
  // Navigate to login
  router.navigate(['/login']);
}
