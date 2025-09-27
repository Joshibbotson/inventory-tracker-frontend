import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../components/navbar/navbar.component';
import { SidebarComponent } from '../components/sidebar/sidebar.component';
import { MobileMenuComponent } from '../components/mobile-menu/mobile-menu.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NavbarComponent,
    SidebarComponent,
    MobileMenuComponent,
  ],
  template: `
    <div class="min-h-screen bg-neutral-50">
      <!-- Desktop Sidebar -->
      <app-sidebar [isOpen]="sidebarOpen()" class="hidden lg:block" />

      <!-- Mobile Menu -->
      <app-mobile-menu
        [isOpen]="mobileMenuOpen()"
        (closeMenu)="mobileMenuOpen.set(false)"
      />

      <!-- Main Content Area -->
      <div class="lg:pl-64">
        <!-- Top Navbar -->
        <app-navbar
          (toggleSidebar)="toggleSidebar()"
          (toggleMobileMenu)="toggleMobileMenu()"
        />

        <!-- Page Content -->
        <main class="px-4 py-6 sm:px-6 lg:px-8">
          <div class="mx-auto max-w-7xl">
            <router-outlet />
          </div>
        </main>
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
export class MainLayoutComponent {
  sidebarOpen = signal(true);
  mobileMenuOpen = signal(false);

  toggleSidebar() {
    this.sidebarOpen.update((value) => !value);
  }

  toggleMobileMenu() {
    this.mobileMenuOpen.update((value) => !value);
  }
}
