import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/interceptors/auth-interceptor.interceptor';
import { credentialsInterceptor } from './core/interceptors/credentials-interceptor.interceptor';
import { AuthService } from './features/auth/services/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAppInitializer(async () =>
      (await intializeApp(inject(AuthService)))()
    ),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([credentialsInterceptor, authInterceptor])
    ),
  ],
};

async function intializeApp(authService: AuthService) {
  return (): Promise<void> => {
    return new Promise(async (resolve, reject) => {
      try {
        await authService.initUser();

        resolve();
      } catch (error) {
        console.error('APP_INITIALIZER: Failed to initialize app', error);
        // Still resolve to allow app to start, but log the error
        resolve();
      }
    });
  };
}
