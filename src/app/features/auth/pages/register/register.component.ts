// register.component.ts
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../services/auth.service';

// Custom validator for password match
function passwordMatchValidator(
  control: AbstractControl
): ValidationErrors | null {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');

  if (!password || !confirmPassword) {
    return null;
  }

  return password.value === confirmPassword.value
    ? null
    : { passwordMismatch: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div
      class="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center px-4 sm:px-6 lg:px-8"
    >
      <div class="max-w-md w-full space-y-8">
        <!-- Logo and Title -->
        <div class="text-center">
          <div
            class="mx-auto h-16 w-16 bg-amber-100 rounded-2xl flex items-center justify-center"
          >
            <svg
              class="h-10 w-10 text-amber-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
              />
            </svg>
          </div>
          <h2 class="mt-6 text-3xl font-bold text-neutral-900">
            Create your account
          </h2>
          <p class="mt-2 text-sm text-neutral-600">
            Start managing your candle inventory
          </p>
        </div>

        <!-- Registration Form -->
        <div class="bg-white py-8 px-4 shadow-xl rounded-2xl sm:px-10">
          <!-- Error Alert -->
          @if (errorMessage()) {
          <div
            class="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg relative"
          >
            <span class="block sm:inline">{{ errorMessage() }}</span>
            <button
              (click)="errorMessage.set('')"
              class="absolute top-0 bottom-0 right-0 px-4 py-3"
            >
              <svg
                class="h-4 w-4 text-red-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clip-rule="evenodd"
                />
              </svg>
            </button>
          </div>
          }

          <!-- Success Message -->
          @if (successMessage()) {
          <div
            class="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg"
          >
            <span class="block sm:inline">{{ successMessage() }}</span>
          </div>
          }

          <form
            [formGroup]="registerForm"
            (ngSubmit)="onSubmit()"
            class="space-y-6"
          >
            <!-- Name Fields Row -->
            <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <!-- First Name -->
              <div>
                <label
                  for="name"
                  class="block text-sm font-medium text-neutral-700"
                >
                  Name
                </label>
                <div class="mt-1">
                  <input
                    id="name"
                    type="text"
                    formControlName="name"
                    autocomplete="given-name"
                    class="appearance-none block w-full px-3 py-2 border border-neutral-300 rounded-lg shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
                    [class.border-red-500]="
                      registerForm.get('name')?.invalid &&
                      registerForm.get('name')?.touched
                    "
                  />
                </div>
                @if (registerForm.get('name')?.invalid &&
                registerForm.get('name')?.touched) {
                <p class="mt-1 text-xs text-red-600">First name is required</p>
                }
              </div>
            </div>

            <!-- Email -->
            <div>
              <label
                for="email"
                class="block text-sm font-medium text-neutral-700"
              >
                Email address
              </label>
              <div class="mt-1">
                <input
                  id="email"
                  type="email"
                  formControlName="email"
                  autocomplete="email"
                  class="appearance-none block w-full px-3 py-2 border border-neutral-300 rounded-lg shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
                  [class.border-red-500]="
                    registerForm.get('email')?.invalid &&
                    registerForm.get('email')?.touched
                  "
                />
              </div>
              @if (registerForm.get('email')?.invalid &&
              registerForm.get('email')?.touched) {
              <p class="mt-1 text-xs text-red-600">
                @if (registerForm.get('email')?.hasError('required')) { Email is
                required } @if (registerForm.get('email')?.hasError('email')) {
                Please enter a valid email address }
              </p>
              }
            </div>

            <!-- Business Name (Optional) -->
            <!-- <div>
              <label
                for="businessName"
                class="block text-sm font-medium text-neutral-700"
              >
                Business name <span class="text-neutral-400">(optional)</span>
              </label>
              <div class="mt-1">
                <input
                  id="businessName"
                  type="text"
                  formControlName="businessName"
                  placeholder="e.g. Kirrou Candles"
                  class="appearance-none block w-full px-3 py-2 border border-neutral-300 rounded-lg shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
                />
              </div>
            </div> -->

            <!-- Password -->
            <div>
              <label
                for="password"
                class="block text-sm font-medium text-neutral-700"
              >
                Password
              </label>
              <div class="mt-1 relative">
                <input
                  id="password"
                  [type]="showPassword() ? 'text' : 'password'"
                  formControlName="password"
                  autocomplete="new-password"
                  class="appearance-none block w-full px-3 py-2 border border-neutral-300 rounded-lg shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm pr-10"
                  [class.border-red-500]="
                    registerForm.get('password')?.invalid &&
                    registerForm.get('password')?.touched
                  "
                />
                <button
                  type="button"
                  (click)="togglePasswordVisibility()"
                  class="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  @if (showPassword()) {
                  <svg
                    class="h-5 w-5 text-neutral-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                  } @else {
                  <svg
                    class="h-5 w-5 text-neutral-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  }
                </button>
              </div>
              @if (registerForm.get('password')?.invalid &&
              registerForm.get('password')?.touched) {
              <p class="mt-1 text-xs text-red-600">
                @if (registerForm.get('password')?.hasError('required')) {
                Password is required } @if
                (registerForm.get('password')?.hasError('minlength')) { Password
                must be at least 8 characters }
              </p>
              }
              <p class="mt-1 text-xs text-neutral-500">
                Must be at least 8 characters
              </p>
            </div>

            <!-- Confirm Password -->
            <div>
              <label
                for="confirmPassword"
                class="block text-sm font-medium text-neutral-700"
              >
                Confirm password
              </label>
              <div class="mt-1">
                <input
                  id="confirmPassword"
                  [type]="showPassword() ? 'text' : 'password'"
                  formControlName="confirmPassword"
                  autocomplete="new-password"
                  class="appearance-none block w-full px-3 py-2 border border-neutral-300 rounded-lg shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
                  [class.border-red-500]="
                    registerForm.hasError('passwordMismatch') &&
                    registerForm.get('confirmPassword')?.touched
                  "
                />
              </div>
              @if (registerForm.hasError('passwordMismatch') &&
              registerForm.get('confirmPassword')?.touched) {
              <p class="mt-1 text-xs text-red-600">Passwords do not match</p>
              }
            </div>

            <!-- Terms and Conditions -->
            <div class="flex items-start">
              <input
                id="terms"
                type="checkbox"
                formControlName="agreeToTerms"
                class="h-4 w-4 text-amber-600 focus:ring-amber-500 border-neutral-300 rounded"
              />
              <label for="terms" class="ml-2 block text-sm text-neutral-700">
                I agree to the
                <a
                  href="#"
                  class="font-medium text-amber-600 hover:text-amber-500"
                  >Terms and Conditions</a
                >
                and
                <a
                  href="#"
                  class="font-medium text-amber-600 hover:text-amber-500"
                  >Privacy Policy</a
                >
              </label>
            </div>
            @if (registerForm.get('agreeToTerms')?.invalid &&
            registerForm.get('agreeToTerms')?.touched) {
            <p class="text-xs text-red-600">
              You must agree to the terms to continue
            </p>
            }

            <!-- Submit Button -->
            <div>
              <button
                type="submit"
                [disabled]="loading() || registerForm.invalid"
                class="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                @if (loading()) {
                <svg
                  class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  ></circle>
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Creating account... } @else { Create account }
              </button>
            </div>

            <!-- Sign In Link -->
            <div class="text-center">
              <span class="text-sm text-neutral-600">
                Already have an account?
                <a
                  routerLink="/auth/login"
                  class="font-medium text-amber-600 hover:text-amber-500 ml-1"
                >
                  Sign in
                </a>
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  showPassword = signal(false);

  registerForm = this.fb.group(
    {
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      businessName: [''],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
      agreeToTerms: [false, [Validators.requiredTrue]],
    },
    { validators: passwordMatchValidator }
  );

  togglePasswordVisibility() {
    this.showPassword.update((v) => !v);
  }

  onSubmit() {
    if (this.registerForm.valid) {
      this.loading.set(true);
      this.errorMessage.set('');

      const { confirmPassword, agreeToTerms, ...registerData } =
        this.registerForm.value;

      this.authService
        .register(registerData as any)
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe({
          next: (response) => {
            this.successMessage.set(
              'Account created successfully! Redirecting...'
            );
            // Navigation is handled in the AuthService
          },
          error: (error) => {
            console.error('Registration error:', error);
            if (error.error?.message) {
              this.errorMessage.set(error.error.message);
            } else if (error.status === 409) {
              this.errorMessage.set(
                'An account with this email already exists.'
              );
            } else if (error.status === 0) {
              this.errorMessage.set(
                'Unable to connect to the server. Please check your connection.'
              );
            } else {
              this.errorMessage.set('Registration failed. Please try again.');
            }
          },
        });
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.registerForm.controls).forEach((key) => {
        const control = this.registerForm.get(key);
        control?.markAsTouched();
      });
    }
  }
}
