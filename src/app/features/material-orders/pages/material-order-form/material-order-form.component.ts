import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  MaterialOrder,
  MaterialOrderService,
} from '../../services/material-order.service';
import { Material } from '../../../materials/models/material.model';
import { MaterialsService } from '../../../materials/services/materials.service';
import { MaterialSearchComponent } from '../../../materials/components/material-search/material-search.component';

@Component({
  selector: 'app-material-order-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MaterialSearchComponent,
  ],
  templateUrl: './material-order-form.component.html',
  styleUrl: './material-order-form.component.scss',
})
export class MaterialOrderFormComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private materialService = inject(MaterialsService);
  private readonly materialOrderService = inject(MaterialOrderService);

  loading = signal(false);
  materials = signal<Material[]>([]);

  materialOrderId: string | null = null;

  materialOrderForm = this.fb.group({
    material: ['', [Validators.required]],
    quantity: [0, [Validators.required, Validators.min(1)]],
    totalCost: [0, [Validators.required, Validators.min(0.01)]],
    supplier: [''],
    notes: [''],
  });

  navigateBack() {
    this.router.navigate(['/material-orders']);
  }

  ngOnInit() {
    // Load units
    this.loadMaterials();
  }

  loadMaterials() {
    this.materialService.getMaterials().subscribe({
      next: (materials) => this.materials.set(materials.data),
      error: (error) => console.error('Error loading materials:', error),
    });
  }

  loadOrder() {
    if (!this.materialOrderId) return;

    this.loading.set(true);
    this.materialOrderService.getOrder(this.materialOrderId).subscribe({
      next: (order) => {
        this.materialOrderForm.patchValue({
          material: order.material._id,
          quantity: order.quantity,
          totalCost: order.totalCost,
          supplier: order.supplier,
          notes: order.notes,
        });
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading material:', error);
        this.loading.set(false);
        alert('Failed to load material');
        this.navigateBack();
      },
    });
  }

  calculateCostPerUnit(): number {
    const quantity = this.materialOrderForm.get('quantity')?.value ?? 0;
    const totalCost = this.materialOrderForm.get('totalCost')?.value ?? 0;

    return totalCost / quantity;
  }

  onSubmit() {
    if (this.materialOrderForm.valid) {
      this.loading.set(true);
      const orderData = this.materialOrderForm.value as Partial<MaterialOrder>;

      this.materialOrderService.createOrder(orderData).subscribe({
        next: () => {
          this.router.navigate(['/material-orders']);
        },
        error: (error) => {
          console.error('Error saving material:', error);
          this.loading.set(false);

          alert('Failed to save material. Please try again.');
        },
      });
    } else {
      this.materialOrderForm.markAllAsTouched();
    }
  }

  onMaterialSelected(material: Material | undefined) {
    this.materialOrderForm.patchValue({ material: material?._id });
  }
}
