import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  FormArray,
  FormGroup,
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ProductsService } from '../../services/products.service';
import { MaterialsService } from '../../../materials/services/materials.service';
import { UnitsService } from '../../../units/services/units.service';
import { Product } from '../../models/product.model';
import { Material } from '../../../materials/models/material.model';
import { Unit } from '../../../units/models/Unit.model';
import { MaterialSearchComponent } from '../../../materials/components/material-search/material-search.component';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialSearchComponent],
  templateUrl: './product-form.component.html',
  styles: [],
})
export class ProductFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private productsService = inject(ProductsService);
  private materialsService = inject(MaterialsService);
  private unitsService = inject(UnitsService);

  loading = signal(false);
  materials = signal<Material[]>([]);
  units = signal<Unit[]>([]);

  isEditMode = false;
  productId: string | null = null;

  productForm = this.fb.group({
    name: ['', [Validators.required]],
    sku: ['', [Validators.required]],
    description: [''],
    sellingPrice: [0, [Validators.required, Validators.min(0)]],
    status: ['active'],
    category: ['regular'],
    recipe: this.fb.array([]),
  });

  get recipeItems() {
    return this.productForm.get('recipe') as FormArray;
  }

  ngOnInit() {
    // Check if we're in edit mode
    this.isEditMode = this.route.snapshot.data['mode'] === 'edit';
    this.productId = this.route.snapshot.paramMap.get('id');

    // Load materials and units
    this.loadMaterials();
    this.loadUnits();

    // If edit mode, load the product
    if (this.isEditMode && this.productId) {
      this.loadProduct();
    }
  }

  loadMaterials() {
    this.materialsService.getMaterials().subscribe({
      next: (materials) => this.materials.set(materials.data),
      error: (error) => console.error('Error loading materials:', error),
    });
  }

  loadUnits() {
    this.unitsService.getUnits().subscribe({
      next: (units) => this.units.set(units),
      error: (error) => console.error('Error loading units:', error),
    });
  }

  loadProduct() {
    if (!this.productId) return;

    this.loading.set(true);
    this.productsService.getProduct(this.productId).subscribe({
      next: (product) => {
        // Populate basic fields
        this.productForm.patchValue({
          name: product.name,
          sku: product.sku,
          description: product.description,
          sellingPrice: product.sellingPrice,
          status: product.status,
          category: product.category,
        });

        // Clear and rebuild recipe array
        while (this.recipeItems.length !== 0) {
          this.recipeItems.removeAt(0);
        }

        // Add recipe items
        product.recipe?.forEach((item) => {
          this.recipeItems.push(
            this.createRecipeItem(
              typeof item.material === 'object'
                ? item.material._id
                : item.material,
              item.quantity,
              typeof item.unit === 'object' ? item.unit._id : item.unit
            )
          );
        });

        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading product:', error);
        this.loading.set(false);
        alert('Failed to load product');
        this.navigateBack();
      },
    });
  }

  onMaterialSelected(material: Material, recipeIndex: number) {
    const recipeItem = this.recipeItems.at(recipeIndex);

    // Set the material ID
    recipeItem.patchValue({
      material: material._id,
      // Auto-populate unit from material
      unit: material.unit._id,
    });
  }

  getSelectedMaterial(index: number): Material | undefined {
    const materialId = this.recipeItems.at(index)?.get('material')?.value;
    return this.materials().find((m) => m._id === materialId);
  }

  getSelectedMaterialUnit(index: number): string {
    const selectedMaterial = this.getSelectedMaterial(index);
    if (!selectedMaterial) return '';

    if (typeof selectedMaterial.unit === 'object') {
      return selectedMaterial.unit.name || '';
    }

    const unit = this.units().find((u) => u._id === selectedMaterial.unit._id);
    return unit?.name || '';
  }

  createRecipeItem(
    materialId: string = '',
    quantity: number = 1,
    unitId: string = ''
  ): FormGroup {
    return this.fb.group({
      material: [materialId, [Validators.required]],
      quantity: [quantity, [Validators.required, Validators.min(0.01)]],
      unit: [unitId, [Validators.required]],
    });
  }

  addRecipeItem() {
    this.recipeItems.push(this.createRecipeItem());
  }

  removeRecipeItem(index: number) {
    this.recipeItems.removeAt(index);
  }

  calculateTotalCost(): number {
    let total = 0;
    this.recipeItems.controls.forEach((control) => {
      const materialId = control.get('material')?.value;
      const quantity = control.get('quantity')?.value || 0;
      const material = this.materials().find((m) => m._id === materialId);
      if (material) {
        total += material.averageCost * quantity;
      }
    });
    return total;
  }

  calculateMargin(): number {
    const cost = this.calculateTotalCost();
    const price = this.productForm.get('sellingPrice')?.value || 0;
    if (price === 0) return 0;
    return ((price - cost) / price) * 100;
  }

  onSubmit() {
    // Mark all fields as touched to trigger validation display
    this.productForm.markAllAsTouched();

    // Also mark recipe items as touched
    this.recipeItems.controls.forEach((control) => {
      control.markAllAsTouched();
    });

    if (this.productForm.valid) {
      this.loading.set(true);

      // Prepare the product data
      const productData = {
        ...this.productForm.value,
        recipe: this.productForm.value.recipe || [],
      };

      const request =
        this.isEditMode && this.productId
          ? this.productsService.updateProduct(
              this.productId,
              productData as Partial<Product>
            )
          : this.productsService.createProduct(productData as Partial<Product>);

      request.subscribe({
        next: (product) => {
          this.router.navigate(['/products', product._id]);
        },
        error: (error) => {
          console.error('Error saving product:', error);
          this.loading.set(false);

          // Show more specific error messages
          if (error.status === 400) {
            alert(
              'Invalid product data. Please check all fields and try again.'
            );
          } else if (error.status === 409) {
            alert('A product with this SKU already exists.');
          } else {
            alert('Failed to save product. Please try again.');
          }
        },
      });
    } else {
      // Show validation summary
      const errors: string[] = [];

      if (this.productForm.get('name')?.invalid) {
        errors.push('Product name is required');
      }
      if (this.productForm.get('sku')?.invalid) {
        errors.push('SKU is required');
      }
      if (this.productForm.get('sellingPrice')?.invalid) {
        errors.push('Valid selling price is required');
      }

      // Check recipe items
      let hasInvalidRecipe = false;
      this.recipeItems.controls.forEach((control, index) => {
        if (control.invalid) {
          hasInvalidRecipe = true;
          if (control.get('material')?.invalid) {
            errors.push(`Recipe item ${index + 1}: Material is required`);
          }
          if (control.get('quantity')?.invalid) {
            errors.push(`Recipe item ${index + 1}: Valid quantity is required`);
          }
          if (control.get('unit')?.invalid) {
            errors.push(`Recipe item ${index + 1}: Unit is required`);
          }
        }
      });

      if (errors.length > 0) {
        alert('Please fix the following errors:\n\n' + errors.join('\n'));
      }
    }
  }

  navigateBack() {
    this.router.navigate(['/products']);
  }

  // Helper method to check if a form control has an error and has been touched
  hasError(controlName: string): boolean {
    const control = this.productForm.get(controlName);
    return !!(control?.invalid && control?.touched);
  }

  // Helper method for recipe item errors
  hasRecipeItemError(index: number, field: string): boolean {
    const control = this.recipeItems.at(index)?.get(field);
    return !!(control?.invalid && control?.touched);
  }
}
