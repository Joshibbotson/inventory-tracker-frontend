import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, Observable, of, tap, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { UserDetails } from '../types/UserDetails';
import { AuthProvider } from '../enums/AuthProvider.enum';
import { LoginConfig } from '../types/LoginConfig';
import { LoginResponseDto } from '../types/LoginResponseDto';
import { RegisterConfig } from '../types/RegisterConfig';
import { User } from '../types/User';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl: string = environment.apiUrl;
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly USER_STORAGE_KEY = 'user';

  public user = signal<User | null>(null);

  async initUser(): Promise<void> {
    try {
      const user = await this.getUserFromPreferences();
      if (user) {
        this.User = user;
      } else {
        console.log('AuthService: No user found in preferences');
      }
    } catch (error) {
      console.error('AuthService: Error in initUser:', error);
    }
  }

  get User(): User | null {
    return this.user();
  }

  set User(user: User) {
    this.user.set(user);
  }

  async getUserFromPreferences(): Promise<User | null> {
    const value = await localStorage.getItem(this.USER_STORAGE_KEY);
    if (value) {
      return JSON.parse(value) as User;
    }
    return null;
  }

  async setUserInLocalStorage(user: User): Promise<void> {
    await localStorage.setItem(this.USER_STORAGE_KEY, JSON.stringify(user));
  }

  /**
   * Handle post-login navigation based on isFirstLogin flag
   */
  private async handlePostLoginNavigation(user: User): Promise<void> {
    // Use backend isFirstLogin flag

    this.router.navigate(['/dashboard'], { replaceUrl: true });
  }

  // In AuthService
  private performLocalLogout(): void {
    this.user.set(null);

    // Fire and forget these promises
    localStorage.removeItem(this.USER_STORAGE_KEY);
    localStorage.removeItem('token');

    this.router.navigate(['/login']);
  }

  logout(): Observable<void> {
    return this.http.get<void>(`${this.apiUrl}/auth/logout`).pipe(
      tap(() => this.performLocalLogout()),
      catchError((error) => {
        console.error('Logout API error:', error);
        // Still perform local logout even if API fails
        this.performLocalLogout();
        return of(void 0);
      })
    );
  }

  silentLogout(): void {
    this.user.set(null);

    // Fire and forget these cleanup operations
    // Fire and forget these promises
    localStorage.removeItem(this.USER_STORAGE_KEY);
    localStorage.removeItem('token');

    this.router.navigate(['/login']);
  }

  // For immediate logout without waiting for API
  forceLogout(): void {
    this.performLocalLogout();
    // Attempt API logout but don't wait for it
    this.http.get<void>(`${this.apiUrl}/auth/logout`).subscribe({
      error: (err) => console.error('Background logout error:', err),
    });
  }

  public loginWithLocal(
    credentials: LoginConfig
  ): Observable<LoginResponseDto> {
    return this.http
      .post<LoginResponseDto>(`${this.apiUrl}/auth/local/login`, credentials)
      .pipe(
        tap(async (res) => {
          await this.setUserInLocalStorage(res.user);
          this.user.set(res.user);

          await localStorage.setItem('token', res.token);

          // Handle tutorial navigation
          await this.handlePostLoginNavigation(res.user);
        }),
        catchError((error) => {
          console.error('[loginWithLocal] error:', error);
          return throwError(() => error);
        })
      );
  }

  public register(userData: RegisterConfig): Observable<LoginResponseDto> {
    return this.http
      .post<LoginResponseDto>(`${this.apiUrl}/auth/register`, userData)
      .pipe(
        tap(async (res) => {
          await this.setUserInLocalStorage(res.user);
          this.user.set(res.user);

          localStorage.setItem('token', res.token);

          // Handle tutorial navigation
          await this.handlePostLoginNavigation(res.user);
        }),
        catchError((error) => {
          console.error('[register] error:', error);
          return throwError(() => error);
        })
      );
  }

  public loginWithOAuth(
    authprovider: AuthProvider,
    user: Partial<UserDetails>
  ): Observable<LoginResponseDto> {
    return this.http
      .post<LoginResponseDto>(`${this.apiUrl}/auth/${authprovider}/login`, user)
      .pipe(
        tap(async (res) => {
          await this.setUserInLocalStorage(res.user);
          this.user.set(res.user);

          localStorage.setItem('token', res.token);

          // Handle tutorial navigation
          await this.handlePostLoginNavigation(res.user);
        }),
        catchError((error) => {
          console.error('[loginWithOAuth] error:', error);
          return throwError(() => error);
        })
      );
  }

  fetchUpdatedUserAndSetInPreferences(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/user-details`).pipe(
      tap(async (user) => {
        await this.setUserInLocalStorage(user);
        this.user.set(user);
        console.log('fetchedUser:', user);
      }),
      catchError((error) => {
        console.error('[loginWithLocal] error:', error);
        return throwError(() => error);
      })
    );
  }

  /** Only to be used in app, and only for locally created accounts not OAuth */
  inAppPasswordChange(oldPassword: string, newPassword: string) {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.apiUrl}/auth/in-app-reset-password`,
      { userId: this.user()?.id, oldPassword, newPassword }
    );
  }

  resetPasswordEmail(
    email: string
  ): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.apiUrl}/auth/reset-password`,
      {
        email,
      }
    );
  }

  submitNewPassword(resetData: {
    email: string;
    token: string;
    newPassword: string;
  }): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${environment.apiUrl}/auth/confirm-password-reset`,
      resetData
    );
  }
}
