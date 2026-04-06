export default {
  async fetch(request, env, ctx) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Load Balancer Paused</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #f8fafc;
            color: #1e293b;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
          }
          .card {
            background: white;
            padding: 2rem;
            border-radius: 0.75rem;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
            max-width: 400px;
            width: 90%;
            text-align: center;
          }
          h1 {
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 1rem;
            color: #d97706;
          }
          p {
            line-height: 1.5;
            color: #64748b;
          }
          .icon {
            font-size: 3rem;
            margin-bottom: 1rem;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">⏸️</div>
          <h1>Load Balancer Paused</h1>
          <p>This load balancer is currently in maintenance mode. Please check back later.</p>
        </div>
      </body>
      </html>
    `;

    return new Response(html, {
      status: 503,
      headers: {
        'Content-Type': 'text/html;charset=UTF-8',
        'Retry-After': '3600',
      },
    });
  },
};
