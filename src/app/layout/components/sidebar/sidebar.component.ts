import { Component, DestroyRef, inject, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLink } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { MaterialsService } from '../../../features/materials/services/materials.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Quote, QuoteService } from '../../../core/services/quote.service';

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
  private readonly quoteService = inject(QuoteService);

  @Input() isOpen = true;
  businessName = environment.businessName;

  materialOutOfStock = signal(0);
  materialLowStock = signal(0);
  materialTotalStock = signal(0);
  quoteOfTheDay = signal<Quote | null>(null);

  ngOnInit(): void {
    this.fetchCounts();
    this.fetchQuoteOfTheDay();
  }
  fetchQuoteOfTheDay() {
    this.quoteService
      .getTodaysApi()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => this.quoteOfTheDay.set(res),
        error: (err) => console.log('err'),
      });
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
