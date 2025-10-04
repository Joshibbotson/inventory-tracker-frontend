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
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
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
