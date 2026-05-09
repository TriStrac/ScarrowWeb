import { HttpInterceptorFn } from '@angular/common/http';

export const cacheBustingInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.includes('/api/')) {
    const noCacheReq = req.clone({
      setHeaders: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
    return next(noCacheReq);
  }
  return next(req);
};