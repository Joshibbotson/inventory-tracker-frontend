import { Component, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../features/auth/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.component.html',
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
    const firstLetter = this.authService.User?.name.slice(0, 1).toUpperCase();
    return firstLetter!;
  }

  toggleUserMenu() {
    this.userMenuOpen = !this.userMenuOpen;
  }

  showNotifications() {
    // Implement notifications panel
  }

  logout() {
    this.authService.logout().subscribe();
  }
}
