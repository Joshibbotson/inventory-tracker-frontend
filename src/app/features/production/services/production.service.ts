import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface ProductionBatch {
  _id: string;
  product: any;
  quantity: number;
  batchNumber: string;
  materialCosts: {
    material: any;
    quantity: number;
    unitCostAtTime: number;
    totalCost: number;
  }[];
  unitCost: number;
  totalCost: number;
  producedBy: string;
  notes?: string;
  createdAt: string;
  isReversed?: boolean;
  reversedQuantity: number;
  reversalReason?: string;
  reversedBy?: string;
  reversedAt?: string;
  isWasted?: boolean;
  wasteQuantity: number;
  wasteReason?: string;
  wasteBy?: string;
  wasteAt?: string;
}

export interface ReversalCheck {
  canReverse: boolean;
  reason?: string;
}

export interface ProductionStats {
  totalProduced: number;
  averageBatchSize: number;
  averageUnitCost: number;
  totalBatches: number;
  recentBatches: ProductionBatch[];
}

@Injectable({
  providedIn: 'root',
})
export class ProductionService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/production`;

  createProductionBatch(
    productId: string,
    quantity: number,
    notes?: string
  ): Observable<ProductionBatch> {
    return this.http.post<ProductionBatch>(`${this.apiUrl}/batch`, {
      productId,
      quantity,
      notes,
    });
  }

  getProductionHistory(
    productId?: string,
    startDate?: string,
    endDate?: string
  ): Observable<ProductionBatch[]> {
    let params = new HttpParams();
    if (productId) params = params.set('productId', productId);
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);

    return this.http.get<ProductionBatch[]>(`${this.apiUrl}/history`, {
      params,
    });
  }

  getProductionStats(productId: string): Observable<ProductionStats> {
    return this.http.get<ProductionStats>(`${this.apiUrl}/stats/${productId}`);
  }

  checkCanReverse(batchId: string): Observable<ReversalCheck> {
    return this.http.get<ReversalCheck>(
      `${this.apiUrl}/batch/${batchId}/can-reverse`
    );
  }

  reverseBatch(
    batchId: string,
    reason: string,
    quantity: number
  ): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.apiUrl}/batch/${batchId}/reverse`,
      { reason, quantity }
    );
  }

  wasteBatch(
    batchId: string,
    reason: string,
    quantity: number
  ): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.apiUrl}/batch/${batchId}/waste`,
      { reason, quantity }
    );
  }
}
