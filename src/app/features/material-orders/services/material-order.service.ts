import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Material } from '../../materials/models/material.model';

export interface MaterialOrder {
  _id?: string;
  material: Material;
  quantity: number;
  totalCost: number;
  unitCost?: number;
  supplier?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root',
})
export class MaterialOrderService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/material-orders`;

  getOrders(materialId?: string): Observable<MaterialOrder[]> {
    return this.http.get<MaterialOrder[]>(this.apiUrl, {
      params: materialId ? { materialId } : {},
    });
  }

  getOrder(materialId?: string): Observable<MaterialOrder> {
    return this.http.get<MaterialOrder>(`${this.apiUrl}/${materialId}`);
  }

  createOrder(order: Partial<MaterialOrder>): Observable<MaterialOrder> {
    return this.http.post<MaterialOrder>(this.apiUrl, order);
  }

  updateOrder(
    id: string,
    order: Partial<MaterialOrder>
  ): Observable<MaterialOrder> {
    return this.http.put<MaterialOrder>(`${this.apiUrl}/${id}`, order);
  }

  deleteOrder(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getStats(materialId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/stats/${materialId}`);
  }
}
