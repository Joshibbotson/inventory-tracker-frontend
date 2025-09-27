import { HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';

export function credentialsInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> {
  const tokenItem = localStorage.getItem('token');

  if (tokenItem) {
    const token = JSON.parse(tokenItem);
    const newReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`),
    });
    return next(newReq);
  }

  return next(req);
}
