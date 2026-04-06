import axios, { AxiosInstance } from 'axios';

class BackendClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async proxyRequest(
    method: string,
    path: string,
    data?: any,
    cookies?: string,
    signal?: AbortSignal,
    headers?: Record<string, string>
  ) {
    const config: any = {
      method,
      url: path,
      headers: {},
      signal,
    };

    if (cookies) {
      config.headers.Cookie = cookies;
    }

    if (headers) {
      config.headers = {
        ...config.headers,
        ...headers,
      };
    }

    if (data) {
      config.data = data;
    }

    const response = await this.client.request(config);
    return response;
  }
}

export const backendClient = new BackendClient();
