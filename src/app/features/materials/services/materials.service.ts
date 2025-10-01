import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Material } from '../models/material.model';
import { environment } from '../../../../environments/environment';
import { StockAdjustment } from '../../sales/models/StockAdjustment.model';
import { PaginatedResponse } from '../../../core/types/PaginatedResponse';

@Injectable({
  providedIn: 'root',
})
export class MaterialsService {
  private readonly apiUrl = `${environment.apiUrl}/materials`;
  private readonly http = inject(HttpClient);

  // Get all materials
  getMaterials(
    page = 1,
    pageSize = 10
  ): Observable<PaginatedResponse<Material>> {
    return this.http.get<PaginatedResponse<Material>>(
      `${this.apiUrl}?page=${page}&pageSize=${pageSize}`
    );
  }

  // Get single material by ID
  getMaterial(id: string): Observable<Material> {
    return this.http.get<Material>(`${this.apiUrl}/${id}`);
  }

  getCounts(): Observable<{
    outOfStock: number;
    lowStock: number;
    totalMaterials: number;
  }> {
    return this.http.get<{
      outOfStock: number;
      lowStock: number;
      totalMaterials: number;
    }>(`${this.apiUrl}/total-counts`);
  }

  // Create new material
  createMaterial(material: Partial<Material>): Observable<Material> {
    return this.http.post<Material>(this.apiUrl, material);
  }

  // Update existing material
  updateMaterial(
    id: string,
    material: Partial<Material>
  ): Observable<Material> {
    return this.http.put<Material>(`${this.apiUrl}/${id}`, material);
  }

  // Delete material
  deleteMaterial(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Get materials by category
  getMaterialsByCategory(category: string): Observable<Material[]> {
    return this.http.get<Material[]>(`${this.apiUrl}/category/${category}`);
  }

  // Get low stock materials
  getLowStockMaterials(): Observable<Material[]> {
    return this.http.get<Material[]>(`${this.apiUrl}/low-stock`);
  }

  // Get out of stock materials
  getOutOfStockMaterials(): Observable<Material[]> {
    return this.http.get<Material[]>(`${this.apiUrl}/out-of-stock`);
  }

  // Adjust material stock
  adjustStock(
    id: string,
    adjustment: {
      quantity: number;
      type: 'increase' | 'decrease' | 'set';
      notes?: string;
    }
  ): Observable<Material> {
    return this.http.post<Material>(
      `${this.apiUrl}/${id}/adjust-stock`,
      adjustment
    );
  }

  // Bulk update materials stock (used after a sale)
  bulkAdjustStock(
    adjustments: Array<{
      materialId: string;
      quantity: number;
      type: 'decrease';
    }>
  ): Observable<Material[]> {
    return this.http.post<Material[]>(`${this.apiUrl}/bulk-adjust`, {
      adjustments,
    });
  }

  // Get stock adjustment history for a material
  getStockAdjustmentHistory(materialId: string): Observable<StockAdjustment[]> {
    return this.http.get<StockAdjustment[]>(
      `${this.apiUrl}/${materialId}/adjustments`
    );
  }

  // Quick restock to minimum level
  restockToMinimum(id: string): Observable<Material> {
    return this.http.post<Material>(`${this.apiUrl}/${id}/restock-minimum`, {});
  }

  // Search materials
  searchMaterials(query: string): Observable<Material[]> {
    const params = new HttpParams().set('q', query);
    return this.http.get<Material[]>(`${this.apiUrl}/search`, { params });
  }

  // Get materials statistics for dashboard
  getMaterialsStatistics(): Observable<{
    totalMaterials: number;
    totalValue: number;
    lowStockCount: number;
    outOfStockCount: number;
    categoryCounts: { [key: string]: number };
  }> {
    return this.http.get<{
      totalMaterials: number;
      totalValue: number;
      lowStockCount: number;
      outOfStockCount: number;
      categoryCounts: { [key: string]: number };
    }>(`${this.apiUrl}/statistics`);
  }
}
