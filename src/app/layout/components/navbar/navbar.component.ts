import { Component, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../features/auth/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav class="sticky top-0 z-40 bg-white border-b border-neutral-200">
      <div class="px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <!-- Left side -->
          <div class="flex items-center">
            <!-- Mobile menu button -->
            <button
              (click)="toggleMobileMenu.emit()"
              class="lg:hidden p-2 rounded-md text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <svg
                class="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            <!-- Desktop sidebar toggle -->
            <button
              (click)="toggleSidebar.emit()"
              class="hidden lg:block p-2 rounded-md text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <svg
                class="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            <!-- Page Title / Breadcrumb area -->
            <div class="ml-4">
              <h1 class="text-lg font-medium text-neutral-900">
                Inventory Management
              </h1>
            </div>
          </div>

          <!-- Right side -->
          <div class="flex items-center gap-3">
            <!-- Notifications -->
            <button
              (click)="showNotifications()"
              class="relative p-2 text-neutral-600 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <svg
                class="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              @if (hasNotifications) {
              <span
                class="absolute top-1.5 right-1.5 h-2 w-2 bg-amber-500 rounded-full"
              ></span>
              }
            </button>

            <!-- User menu -->
            <div class="relative">
              <button
                (click)="toggleUserMenu()"
                class="flex items-center gap-2 p-2 text-neutral-600 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <div
                  class="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center"
                >
                  <span class="text-sm font-medium text-amber-700">
                    {{ getUserInitials() }}
                  </span>
                </div>
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              @if (userMenuOpen) {
              <div
                class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-neutral-200 py-1"
              >
                <a
                  href="#"
                  class="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                  >Profile</a
                >
                <a
                  href="#"
                  class="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                  >Settings</a
                >
                <hr class="my-1 border-neutral-200" />
                <button
                  (click)="logout()"
                  class="block w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                >
                  Sign out
                </button>
              </div>
              }
            </div>
          </div>
        </div>
      </div>
    </nav>
  `,
  styles: [],
})
export class NavbarComponent {
  @Output() toggleSidebar = new EventEmitter<void>();
  @Output() toggleMobileMenu = new EventEmitter<void>();

  private authService = inject(AuthService);
  // private notificationService = inject(NotificationService);

  userMenuOpen = false;
  hasNotifications = true; // This would come from a service

  getUserInitials(): string {
    // This would come from auth service
    return 'KC';
  }

  toggleUserMenu() {
    this.userMenuOpen = !this.userMenuOpen;
  }

  showNotifications() {
    // Implement notifications panel
  }

  logout() {
    this.authService.logout();
  }
}
