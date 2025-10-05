import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PaginatedResponse } from '../../../core/types/PaginatedResponse';

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
  wastedQuantity: number;
  wasteReason?: string;
  wasteBy?: string;
  wasteAt?: string;
}
export interface BatchSummary {
  summary: {
    activeUnits: number;
    reversedUnits: number;
    activeCost: number;
    reversedCost: number;
  };
}

export interface ReversalCheck {
  canReverse: boolean;
  reason?: string;
}

export interface IndividualProductionStats {
  totalProduced: number;
  averageBatchSize: number;
  averageUnitCost: number;
  totalBatches: number;
  recentBatches: ProductionBatch[];
}

export interface ProductionStats {
  totalBatches: number;
  totalProductsProduced: number;
  totalProductionCost: number;
  averageBatchSize: number;
}

export interface FullProductionStats extends ProductionStats {
  timeline: { date: string; totalQuantity: number; batchCount: number }[];
  productTotals: {
    productName: string;
    totalQuantity: number;
    batchCount: number;
  }[];
}

export type StatPeriod = 'week' | 'month' | 'quarter' | '6months' | 'year';

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
    page = 1,
    pageSize = 10,
    opts?: {
      searchTerm?: string;
      startDate?: string;
      endDate?: string;
    }
  ): Observable<PaginatedResponse<ProductionBatch> & BatchSummary> {
    return this.http.post<PaginatedResponse<ProductionBatch> & BatchSummary>(
      `${this.apiUrl}/history/?page=${page}&pageSize=${pageSize}`,
      opts
    );
  }

  getFullProductionStats(
    selectedPeriod: StatPeriod
  ): Observable<FullProductionStats> {
    return this.http.get<FullProductionStats>(
      `${this.apiUrl}/full-stats?period=${selectedPeriod}`
    );
  }

  getProductionStats(): Observable<ProductionStats> {
    return this.http.get<ProductionStats>(`${this.apiUrl}/stats`);
  }

  getProductionStatsByProductId(
    productId: string
  ): Observable<IndividualProductionStats> {
    return this.http.get<IndividualProductionStats>(
      `${this.apiUrl}/stats/${productId}`
    );
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
