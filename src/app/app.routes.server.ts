import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: 'device/:id/nodes', renderMode: RenderMode.Server },
  { path: 'device/:id', renderMode: RenderMode.Server },
  { path: 'farmer/:id', renderMode: RenderMode.Server },
  { path: 'activitylogs/:farmerId', renderMode: RenderMode.Server },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
