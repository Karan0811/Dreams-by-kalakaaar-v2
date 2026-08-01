import { NextResponse } from 'next/server';

/**
 * Swagger UI, served as a plain HTML Route Handler response rather than a
 * Next.js page (10-backend-architecture.md's `app/api/v1/` convention keeps
 * `app/api/` for Route Handlers; this just isn't JSON). Loads `swagger-ui-dist`
 * from cdnjs instead of adding it as an npm dependency — it's a
 * documentation-only, unauthenticated page with no business logic, so
 * pulling in and bundling the full Swagger UI React/JS package into the
 * Next.js build would cost more than it's worth for what's rendered here.
 * Points at `/api/openapi.json`, which is generated from the same
 * `openapi/v1.yaml` this page's sibling `/api/openapi.yaml` route serves
 * raw — one source of truth, three ways to consume it.
 */
const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Dreams by Kalakaaar API Docs</title>
    <link
      rel="stylesheet"
      href="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.17.14/swagger-ui.min.css"
    />
    <style>
      body { margin: 0; background: #fafafa; }
      .topbar { display: none; }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.17.14/swagger-ui-bundle.min.js"></script>
    <script>
      window.onload = () => {
        window.ui = SwaggerUIBundle({
          url: '/api/openapi.json',
          dom_id: '#swagger-ui',
          presets: [SwaggerUIBundle.presets.apis],
          layout: 'BaseLayout',
          deepLinking: true,
          filter: true,
          persistAuthorization: true,
          tagsSorter: 'alpha',
        });
      };
    </script>
  </body>
</html>`;

export const GET = () =>
  new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
