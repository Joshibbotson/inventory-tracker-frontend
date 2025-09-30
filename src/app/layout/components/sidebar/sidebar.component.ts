import { Component, DestroyRef, inject, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLink } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { MaterialsService } from '../../../features/materials/services/materials.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
  badge?: number;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLink],
  templateUrl: './sidebar.component.html',
  styles: [],
})
export class SidebarComponent {
  private readonly materialService = inject(MaterialsService);
  private readonly destroyRef = inject(DestroyRef);
  @Input() isOpen = true;
  businessName = environment.businessName;

  materialOutOfStock = signal(0);
  materialLowStock = signal(0);
  materialTotalStock = signal(0);

  ngOnInit(): void {
    this.fetchCounts();
  }

  fetchCounts(): void {
    this.materialService
      .getCounts()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (counts) => {
          this.materialOutOfStock.set(counts.outOfStock);
          this.materialLowStock.set(counts.lowStock);
          this.materialTotalStock.set(counts.totalMaterials);
        },
      });
  }
}
