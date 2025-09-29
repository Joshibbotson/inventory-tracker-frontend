import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Sale } from '../models/Sale.model';
@Injectable({
  providedIn: 'root',
})
export class SalesService {
  private readonly apiUrl = `${environment.apiUrl}/sales`;
  private readonly http = inject(HttpClient);

  getSales(): Observable<Sale[]> {
    return this.http.get<Sale[]>(this.apiUrl);
  }

  getSale(id: string): Observable<Sale> {
    return this.http.get<Sale>(`${this.apiUrl}/${id}`);
  }

  createSale(sale: {
    product: string;
    quantity: number;
    totalPrice: number;
    notes?: string;
  }): Observable<Sale> {
    return this.http.post<Sale>(this.apiUrl, sale);
  }

  // Batch sale for multiple products
  createBatchSale(
    sales: Array<{
      product: string;
      quantity: number;
      totalPrice: number;
    }>
  ): Observable<Sale[]> {
    return this.http.post<Sale[]>(`${this.apiUrl}/batch`, { sales });
  }

  // Get sales by date range
  getSalesByDateRange(startDate: Date, endDate: Date): Observable<Sale[]> {
    const params = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };
    return this.http.get<Sale[]>(`${this.apiUrl}/range`, { params });
  }

  // Get today's sales
  getTodaysSales(): Observable<Sale[]> {
    return this.http.get<Sale[]>(`${this.apiUrl}/today`);
  }

  // Get sales summary for dashboard
  getSalesSummary(): Observable<{
    todaySales: number;
    todayRevenue: number;
    weekSales: number;
    weekRevenue: number;
    monthSales: number;
    monthRevenue: number;
    topProducts: Array<{
      product: any;
      quantity: number;
      revenue: number;
    }>;
  }> {
    return this.http.get<{
      todaySales: number;
      todayRevenue: number;
      weekSales: number;
      weekRevenue: number;
      monthSales: number;
      monthRevenue: number;
      topProducts: Array<{
        product: any;
        quantity: number;
        revenue: number;
      }>;
    }>(`${this.apiUrl}/summary`);
  }
}
