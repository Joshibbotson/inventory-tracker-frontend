import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-mobile-menu',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <!-- Mobile menu overlay -->
    @if (isOpen) {
    <div
      (click)="closeMenu.emit()"
      class="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
    ></div>
    }

    <!-- Mobile menu panel -->
    <aside
      [class.translate-x-0]="isOpen"
      [class.-translate-x-full]="!isOpen"
      class="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transition-transform duration-300 ease-in-out lg:hidden"
    >
      <!-- Header -->
      <div
        class="flex items-center justify-between h-16 px-4 border-b border-neutral-200"
      >
        <div class="flex items-center gap-2">
          <div
            class="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center"
          >
            <svg
              class="w-5 h-5 text-amber-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
              />
            </svg>
          </div>
          <span class="font-semibold text-neutral-900">Kirrou</span>
        </div>
        <button
          (click)="closeMenu.emit()"
          class="p-2 rounded-lg hover:bg-neutral-100"
        >
          <svg
            class="w-5 h-5 text-neutral-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <!-- Navigation -->
      <nav class="px-3 py-4">
        <div class="space-y-1">
          <a
            routerLink="/dashboard"
            routerLinkActive="bg-amber-50 text-amber-700"
            (click)="closeMenu.emit()"
            class="flex items-center gap-3 px-3 py-2 text-neutral-600 rounded-lg hover:bg-neutral-50"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <span class="font-medium">Dashboard</span>
          </a>

          <a
            routerLink="/materials"
            routerLinkActive="bg-amber-50 text-amber-700"
            (click)="closeMenu.emit()"
            class="flex items-center gap-3 px-3 py-2 text-neutral-600 rounded-lg hover:bg-neutral-50"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
            <span class="font-medium">Materials</span>
          </a>

          <a
            routerLink="/products"
            routerLinkActive="bg-amber-50 text-amber-700"
            (click)="closeMenu.emit()"
            class="flex items-center gap-3 px-3 py-2 text-neutral-600 rounded-lg hover:bg-neutral-50"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <span class="font-medium">Products</span>
          </a>

          <a
            routerLink="/sales"
            routerLinkActive="bg-amber-50 text-amber-700"
            (click)="closeMenu.emit()"
            class="flex items-center gap-3 px-3 py-2 text-neutral-600 rounded-lg hover:bg-neutral-50"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            <span class="font-medium">Sales</span>
          </a>
        </div>
      </nav>
    </aside>
  `,
  styles: [],
})
export class MobileMenuComponent {
  @Input() isOpen = false;
  @Output() closeMenu = new EventEmitter<void>();
}
