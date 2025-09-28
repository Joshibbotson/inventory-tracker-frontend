import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Unit } from '../models/Unit.model';

@Injectable({
  providedIn: 'root',
})
export class UnitsService {
  private readonly apiUrl = `${environment.apiUrl}/units`;
  private readonly http = inject(HttpClient);

  // Cache units since they don't change often
  private unitsCache: Unit[] | null = null;

  // Get all units (with caching)
  getUnits(): Observable<Unit[]> {
    if (this.unitsCache) {
      return of(this.unitsCache);
    }

    return this.http
      .get<Unit[]>(this.apiUrl)
      .pipe(tap((units) => (this.unitsCache = units)));
  }

  // Get single unit by ID
  getUnit(id: string): Observable<Unit> {
    return this.http.get<Unit>(`${this.apiUrl}/${id}`);
  }

  // Create new unit
  createUnit(unit: Partial<Unit>): Observable<Unit> {
    this.unitsCache = null; // Clear cache
    return this.http.post<Unit>(this.apiUrl, unit);
  }

  // Update existing unit
  updateUnit(id: string, unit: Partial<Unit>): Observable<Unit> {
    this.unitsCache = null; // Clear cache
    return this.http.put<Unit>(`${this.apiUrl}/${id}`, unit);
  }

  // Delete unit
  deleteUnit(id: string): Observable<void> {
    this.unitsCache = null; // Clear cache
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Get units by type (discrete or continuous)
  getUnitsByType(type: 'discrete' | 'continuous'): Observable<Unit[]> {
    return this.http.get<Unit[]>(`${this.apiUrl}/type/${type}`);
  }

  // Seed default units (for initial setup)
  seedDefaultUnits(): Observable<Unit[]> {
    this.unitsCache = null; // Clear cache
    return this.http.post<Unit[]>(`${this.apiUrl}/seed`, {});
  }

  // Clear cache manually if needed
  clearCache(): void {
    this.unitsCache = null;
  }
}
