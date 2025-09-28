import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from '../models/product.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ProductsService {
  private readonly apiUrl = `${environment.apiUrl}/products`;
  private readonly http = inject(HttpClient);

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(this.apiUrl);
  }

  getProduct(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`);
  }

  createProduct(product: Partial<Product>): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, product);
  }

  updateProduct(id: string, product: Partial<Product>): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/${id}`, product);
  }

  deleteProduct(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Get products by category
  getProductsByCategory(category: string): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/category/${category}`);
  }

  // Get active products only (for POS)
  getActiveProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/active`);
  }

  // Calculate material cost for a product
  calculateProductCost(
    productId: string
  ): Observable<{ cost: number; margin: number }> {
    return this.http.get<{ cost: number; margin: number }>(
      `${this.apiUrl}/${productId}/cost`
    );
  }

  // Check if materials are available for a product
  checkMaterialAvailability(
    productId: string,
    quantity: number
  ): Observable<{
    available: boolean;
    missingMaterials?: Array<{
      material: string;
      required: number;
      available: number;
    }>;
  }> {
    return this.http.post<{
      available: boolean;
      missingMaterials?: Array<{
        material: string;
        required: number;
        available: number;
      }>;
    }>(`${this.apiUrl}/${productId}/check-availability`, { quantity });
  }
}
