// production-create.component.ts
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Material } from '../../../materials/models/material.model';
import { MaterialsService } from '../../../materials/services/materials.service';
import { Product } from '../../../products/models/product.model';
import { ProductsService } from '../../../products/services/products.service';
import { ProductionService } from '../../services/production.service';
import { ProductSearchComponent } from '../../../materials/components/product-search/product-search.component';

interface MaterialRequirement {
  material: Material;
  requiredQuantity: number;
  availableQuantity: number;
  unitCost: number;
  totalCost: number;
  sufficient: boolean;
  unit: any;
}

@Component({
  selector: 'app-production-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ProductSearchComponent],
  templateUrl: './production-create-form.component.html',
  styles: [],
})
export class ProductionCreateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private productionService = inject(ProductionService);
  private productsService = inject(ProductsService);
  private materialsService = inject(MaterialsService);

  loading = signal(false);
  products = signal<Product[]>([]);
  materials = signal<Material[]>([]);
  selectedProduct = signal<Product | null>(null);
  materialRequirements = signal<MaterialRequirement[]>([]);

  productionForm = this.fb.group({
    product: ['', [Validators.required]],
    quantity: [1, [Validators.required, Validators.min(1)]],
    notes: [''],
  });

  totalProductionCost = computed(() => {
    return this.materialRequirements().reduce(
      (sum, req) => sum + req.totalCost,
      0
    );
  });

  unitCost = computed(() => {
    const quantity = this.productionForm.get('quantity')?.value || 1;
    return this.totalProductionCost() / quantity;
  });

  allMaterialsSufficient = computed(() => {
    return this.materialRequirements().every((req) => req.sufficient);
  });

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    try {
      const [products, materials] = await Promise.all([
        this.productsService.getProducts().toPromise(),
        this.materialsService.getMaterials().toPromise(),
      ]);

      this.products.set(products?.data || []);
      this.materials.set(materials?.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  onProductChange() {
    const productId = this.productionForm.get('product')?.value;
    if (!productId) {
      this.selectedProduct.set(null);
      this.materialRequirements.set([]);
      return;
    }

    const product = this.products().find((p) => p._id === productId);
    if (product) {
      this.selectedProduct.set(product);
      this.calculateMaterialRequirements();
    }
  }

  onQuantityChange() {
    if (this.selectedProduct()) {
      this.calculateMaterialRequirements();
    }
  }

  calculateMaterialRequirements() {
    const product = this.selectedProduct();
    const quantity = this.productionForm.get('quantity')?.value || 0;

    if (!product || quantity <= 0) {
      this.materialRequirements.set([]);
      return;
    }

    const requirements: MaterialRequirement[] = [];

    for (const recipeItem of product.recipe) {
      const material = this.materials().find(
        (m) =>
          m._id ===
          (typeof recipeItem.material === 'object'
            ? recipeItem.material._id
            : recipeItem.material)
      );

      if (material) {
        const requiredQuantity = recipeItem.quantity * quantity;
        const totalCost = requiredQuantity * material.averageCost;

        requirements.push({
          material,
          requiredQuantity,
          availableQuantity: material.currentStock,
          unitCost: material.averageCost,
          totalCost,
          sufficient: material.currentStock >= requiredQuantity,
          unit: recipeItem.unit,
        });
      }
    }

    this.materialRequirements.set(requirements);
  }

  getUnitAbbreviation(unit: any): string {
    if (typeof unit === 'object' && unit?.abbreviation) {
      return unit.abbreviation;
    }
    return '';
  }

  onSubmit() {
    if (this.productionForm.valid && this.allMaterialsSufficient()) {
      this.loading.set(true);

      const { product, quantity, notes } = this.productionForm.value;

      this.productionService
        .createProductionBatch(product!, quantity!, notes || undefined)
        .subscribe({
          next: (batch) => {
            this.router.navigate(['/production']);
          },
          error: (error) => {
            console.error('Error creating production batch:', error);
            this.loading.set(false);

            if (error.error?.message) {
              alert(error.error.message);
            } else {
              alert('Failed to create production batch. Please try again.');
            }
          },
        });
    }
  }

  handleProductSelected(product: Product) {
    this.productionForm.patchValue({ product: product._id });
  }

  navigateBack() {
    this.router.navigate(['/production']);
  }
}
