const config = __CONFIG__;

export default {
  async fetch(request) {
    const isHealthCheck = request.headers.get("User-Agent")?.includes("health-check");
    
    if (isHealthCheck) {
      return new Response(
        JSON.stringify({
          status: "paused",
          message: "Load balancer is paused but domain is reserved"
        }),
        { 
          status: 503,
          headers: { 
            "Content-Type": "application/json",
            "Retry-After": "3600"
          }
        }
      );
    }

    return new Response(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Service Temporarily Paused</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      max-width: 500px;
      width: 100%;
      padding: 40px;
      text-align: center;
    }
    .icon {
      width: 80px;
      height: 80px;
      margin: 0 auto 20px;
      background: #f59e0b;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 40px;
    }
    h1 {
      font-size: 28px;
      color: #1f2937;
      margin-bottom: 16px;
    }
    p {
      font-size: 16px;
      color: #6b7280;
      line-height: 1.6;
      margin-bottom: 12px;
    }
    .status {
      display: inline-block;
      background: #fef3c7;
      color: #92400e;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      margin-top: 20px;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 14px;
      color: #9ca3af;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">⏸️</div>
    <h1>Service Temporarily Paused</h1>
    <p>This load balancer has been temporarily paused by the administrator.</p>
    <p>The service will resume shortly. Please check back later.</p>
    <div class="status">🔒 Domain Reserved</div>
    <div class="footer">
      Powered by EdgeBalancer
    </div>
  </div>
</body>
</html>
    `.trim(), {
      status: 503,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Retry-After": "3600",
        "Cache-Control": "no-cache, no-store, must-revalidate"
      }
    });
  }
};
