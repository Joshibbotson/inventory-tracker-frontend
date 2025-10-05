import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  DestroyRef,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from '../../../../environments/environment';
import { Quote, QuoteService } from '../../../core/services/quote.service';
import { MaterialsService } from '../../../features/materials/services/materials.service';

@Component({
  selector: 'app-mobile-menu',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: 'mobile-menu.component.html',
  styles: [],
})
export class MobileMenuComponent {
  private readonly materialService = inject(MaterialsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly quoteService = inject(QuoteService);
  @Input() isOpen = false;
  @Output() closeMenu = new EventEmitter<void>();

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
