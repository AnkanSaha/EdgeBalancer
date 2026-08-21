import axios, { AxiosInstance } from 'axios';
import { retryWithBackoff } from '../utils/retry';

const CLOUDFLARE_API_BASE = 'https://api.cloudflare.com/client/v4';

export class CloudflareClient {
  private client: AxiosInstance;

  constructor(apiToken: string) {
    this.client = axios.create({
      baseURL: CLOUDFLARE_API_BASE,
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 second timeout
    });
  }

  async testWorkerScriptsPermission(accountId: string): Promise<boolean> {
    try {
      await retryWithBackoff(
        () => this.client.get(`/accounts/${accountId}/workers/scripts`),
        { maxRetries: 2 }
      );
      return true;
    } catch (error) {
      return false;
    }
  }

  async testZoneReadPermission(accountId: string): Promise<boolean> {
    try {
      await retryWithBackoff(
        () => this.client.get(`/zones?account.id=${accountId}`),
        { maxRetries: 2 }
      );
      return true;
    } catch (error) {
      return false;
    }
  }

  async getZones(accountId: string): Promise<any> {
    const response = await retryWithBackoff(
      () => this.client.get(`/zones?account.id=${accountId}`),
      { maxRetries: 3 }
    );
    return response.data;
  }

  async getWorkerScriptByName(accountId: string, scriptName: string): Promise<{ id: string; script_name: string } | null> {
    const response = await retryWithBackoff(
      () => this.client.get(`/accounts/${accountId}/workers/scripts`),
      { maxRetries: 3 }
    );

    const scripts = response.data?.result ?? [];
    const script = scripts.find((item: any) => (
      item?.id === scriptName ||
      item?.script_name === scriptName ||
      item?.name === scriptName
    ));

    if (!script?.id) {
      return null;
    }

    return {
      id: script.id,
      script_name: script.script_name || script.name || scriptName,
    };
  }

  async workerNameExists(accountId: string, scriptName: string): Promise<boolean> {
    const script = await this.getWorkerScriptByName(accountId, scriptName);
    return !!script;
  }

  async testDnsEditPermission(accountId: string, zoneId?: string): Promise<boolean> {
    try {
      let testZoneId = zoneId;
      if (!testZoneId) {
        const zones = await this.getZones(accountId);
        const firstZone = zones?.result?.[0];
        if (!firstZone?.id) return true; // no zones available to test against — skip
        testZoneId = firstZone.id;
      }
      // Test actual WRITE permission by creating a throwaway TXT record
      const testRecordName = `_edgebalancer-dnstest-${Date.now()}`;
      const createRes = await retryWithBackoff(
        () => this.client.post(`/zones/${testZoneId}/dns_records`, {
          type: 'TXT',
          name: testRecordName,
          content: 'edgebalancer-permission-check',
          ttl: 60,
        }),
        { maxRetries: 2 }
      );
      // Clean up the test record
      if (createRes.data?.result?.id) {
        await this.client.delete(`/zones/${testZoneId}/dns_records/${createRes.data.result.id}`).catch(() => {});
      }
      return true;
    } catch {
      return false;
    }
  }

  async getWorkerDomains(accountId: string): Promise<any[]> {
    const response = await retryWithBackoff(
      () => this.client.get(`/accounts/${accountId}/workers/domains`),
      { maxRetries: 3 }
    );

    return response.data?.result ?? [];
  }

  /**
   * Worker Routes are a separate binding from Custom Domains and are not listed by
   * `getWorkerDomains`, yet a route can already be serving the hostname we are about to claim.
   */
  async getWorkerRoutes(zoneId: string): Promise<any[]> {
    const response = await retryWithBackoff(
      () => this.client.get(`/zones/${zoneId}/workers/routes`),
      { maxRetries: 3 }
    );

    return response.data?.result ?? [];
  }
}