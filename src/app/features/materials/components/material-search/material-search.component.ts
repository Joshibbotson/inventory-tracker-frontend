import { Component, signal, output, input, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialsService } from '../../services/materials.service';
import { Material } from '../../models/material.model';
import {
  Subject,
  debounceTime,
  distinctUntilChanged,
  switchMap,
  of,
} from 'rxjs';

@Component({
  selector: 'app-material-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './material-search.component.html',
  styleUrl: './material-search.component.scss',
})
export class MaterialSearchComponent {
  initialMaterialId = input<string | undefined>('');

  searchQuery = signal('');
  materials = signal<Material[]>([]);
  isLoading = signal(false);
  isOpen = signal(false);
  selectedIndex = signal(-1);

  materialSelected = output<Material | undefined>();

  private searchSubject = new Subject<string>();

  constructor(private materialsService: MaterialsService) {
    // Setup debounced search
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((query) => {
          if (query.trim().length < 2) {
            this.isLoading.set(false);
            return of([]);
          }
          this.isLoading.set(true);
          return this.materialsService.searchMaterials(query);
        })
      )
      .subscribe({
        next: (results) => {
          this.materials.set(results);
          this.isLoading.set(false);
          this.isOpen.set(results.length > 0);
          this.selectedIndex.set(-1);
        },
        error: () => {
          this.isLoading.set(false);
          this.materials.set([]);
        },
      });

    // Effect to load initial material when materialId changes
    effect(() => {
      const materialId = this.initialMaterialId();
      if (materialId) {
        this.loadInitialMaterial(materialId);
      } else if (!materialId) {
        // for reset by parent
        this.searchQuery.set('');
      }
    });
  }

  private loadInitialMaterial(materialId: string): void {
    this.materialsService.getMaterial(materialId).subscribe({
      next: (material) => {
        this.searchQuery.set(material.name);
      },
      error: (error) => {
        console.error('Error loading initial material:', error);
      },
    });
  }

  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);

    if (value.trim().length < 2) {
      this.materials.set([]);
      this.isOpen.set(false);
      return;
    }

    this.searchSubject.next(value);
  }

  onKeyDown(event: KeyboardEvent): void {
    const materialsCount = this.materials().length;

    if (!this.isOpen() || materialsCount === 0) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.selectedIndex.update((i) => (i < materialsCount - 1 ? i + 1 : 0));
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.selectedIndex.update((i) => (i > 0 ? i - 1 : materialsCount - 1));
        break;
      case 'Enter':
        event.preventDefault();
        const selected = this.selectedIndex();
        if (selected >= 0 && selected < materialsCount) {
          this.selectMaterial(this.materials()[selected]);
        }
        break;
      case 'Escape':
        this.isOpen.set(false);
        break;
    }
  }

  selectMaterial(material: Material): void {
    this.materialSelected.emit(material);
    this.searchQuery.set(material.name);
    this.isOpen.set(false);
    this.materials.set([]);
  }

  onBlur(): void {
    setTimeout(() => {
      this.isOpen.set(false);
    }, 200);
  }

  onFocus(): void {
    if (this.materials().length > 0) {
      this.isOpen.set(true);
    }
  }

  clearSearch(): void {
    this.materialSelected.emit(undefined);
    this.searchQuery.set('');
    this.materials.set([]);
    this.isOpen.set(false);
    this.selectedIndex.set(-1);
  }

  getStockStatus(material: Material): { label: string; class: string } {
    if (material.currentStock <= 0) {
      return { label: 'Out of Stock', class: 'text-red-600' };
    } else if (material.currentStock <= material.minimumStock) {
      return { label: 'Low Stock', class: 'text-amber-600' };
    }
    return { label: 'In Stock', class: 'text-green-600' };
  }
}
