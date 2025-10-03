import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
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

  searchProducts(query: string): Observable<Product[]> {
    const params = new HttpParams().set('q', query);
    return this.http.get<Product[]>(`${this.apiUrl}/search`, { params });
  }

  createProduct(
    product: Partial<Product>,
    imageFile?: File
  ): Observable<Product> {
    const formData = new FormData();

    // Append the file
    if (imageFile) {
      formData.append('image', imageFile);
    }

    // Append product data as a JSON blob (proper JSON, not stringified fields)
    formData.append(
      'product',
      new Blob([JSON.stringify(product)], {
        type: 'application/json',
      })
    );

    return this.http.post<Product>(this.apiUrl, formData);
  }

  updateProduct(
    id: string,
    product: Partial<Product>,
    imageFile?: File
  ): Observable<Product> {
    const formData = new FormData();

    // Append the file if provided
    if (imageFile) {
      formData.append('image', imageFile);
      console.log('Appending image file:', imageFile.name); // Debug
    }

    // Append product data
    formData.append(
      'product',
      new Blob([JSON.stringify(product)], {
        type: 'application/json',
      })
    );

    return this.http.put<Product>(`${this.apiUrl}/${id}`, formData);
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
