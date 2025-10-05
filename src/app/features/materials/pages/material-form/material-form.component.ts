import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MaterialsService } from '../../services/materials.service';
import { UnitsService } from '../../../units/services/units.service';
import { Material } from '../../models/material.model';
import { Unit } from '../../../units/models/Unit.model';

@Component({
  selector: 'app-material-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './material-form.component.html',
  styles: [],
})
export class MaterialFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private materialsService = inject(MaterialsService);
  private unitsService = inject(UnitsService);

  loading = signal(false);
  units = signal<Unit[]>([]);

  isEditMode = false;
  materialId: string | null = null;

  materialForm = this.fb.group({
    name: ['', [Validators.required]],
    unit: ['', [Validators.required]],
    currentStock: [0, [Validators.required, Validators.min(0)]],
    minimumStock: [0, [Validators.required, Validators.min(0)]],
    costPerUnit: [0, [Validators.required, Validators.min(0)]],
    supplier: [''],
    category: ['wax', [Validators.required]],
    notes: [''],
    isActive: [true],
  });

  // really just here to show SKU on edit readonly
  material = signal<Material | null>(null);

  ngOnInit() {
    // Check if we're in edit mode
    this.isEditMode = this.route.snapshot.data['mode'] === 'edit';
    this.materialId = this.route.snapshot.paramMap.get('id');

    // Load units
    this.loadUnits();

    // If edit mode, load the material
    if (this.isEditMode && this.materialId) {
      this.loadMaterial();
    }
  }

  loadUnits() {
    this.unitsService.getUnits().subscribe({
      next: (units) => this.units.set(units),
      error: (error) => console.error('Error loading units:', error),
    });
  }

  loadMaterial() {
    if (!this.materialId) return;

    this.loading.set(true);
    this.materialsService.getMaterial(this.materialId).subscribe({
      next: (material) => {
        this.material.set(material);
        this.materialForm.patchValue({
          name: material.name,
          unit:
            typeof material.unit === 'object'
              ? material.unit._id
              : material.unit,
          currentStock: parseFloat(material.currentStock.toFixed(2)),
          minimumStock: parseFloat(material.minimumStock.toFixed(2)),
          costPerUnit: parseFloat(material.averageCost.toFixed(2)),
          supplier: material.supplier,
          category: material.category,
          notes: material.notes,
          isActive: material.isActive,
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

  calculateStockValue(): number {
    const currentStock = this.materialForm.get('currentStock')?.value || 0;
    const costPerUnit = this.materialForm.get('costPerUnit')?.value || 0;
    return currentStock * costPerUnit;
  }

  onSubmit() {
    if (this.materialForm.valid) {
      this.loading.set(true);
      const materialData = this.materialForm.value as Partial<Material>;

      const request =
        this.isEditMode && this.materialId
          ? this.materialsService.updateMaterial(this.materialId, materialData)
          : this.materialsService.createMaterial(materialData);

      request.subscribe({
        next: () => {
          this.router.navigate(['/materials']);
        },
        error: (error) => {
          console.error('Error saving material:', error);
          this.loading.set(false);

          if (error.status === 409) {
            alert('A material with this SKU already exists.');
          } else {
            alert('Failed to save material. Please try again.');
          }
        },
      });
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.materialForm.controls).forEach((key) => {
        const control = this.materialForm.get(key);
        control?.markAsTouched();
      });
    }
  }

  navigateBack() {
    this.router.navigate(['/materials']);
  }
}
