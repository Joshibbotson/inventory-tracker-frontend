import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type Quote = {
  quote: string;
  author: string;
};

@Injectable({
  providedIn: 'root',
})
export class QuoteService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/quotes/today`;

  getTodaysApi(): Observable<Quote> {
    return this.http.get<Quote>(this.apiUrl);
  }
}
