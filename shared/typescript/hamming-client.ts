/**
 * Hamming AI API Client - TypeScript implementation
 * 
 * A comprehensive client for interacting with the Hamming AI API
 * with full TypeScript support, error handling, and retry logic.
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Type definitions
export interface ApiConfig {
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
  debug?: boolean;
}

export interface TestConfig {
  name: string;
  description: string;
  [key: string]: any;
}

export interface TestRun {
  run_id: string;
  status: string;
  created_at: string;
  [key: string]: any;
}

export interface TestResults {
  total_calls: number;
  successful_calls: number;
  failed_calls: number;
  average_duration: number;
  calls: CallResult[];
  [key: string]: any;
}

export interface CallResult {
  phone_number?: string;
  caller_number?: string;
  called_number?: string;
  status: string;
  duration: number;
  transcript?: string;
  analysis?: {
    overall_score: number;
    sentiment?: string;
    key_points?: string[];
    [key: string]: any;
  };
  [key: string]: any;
}

export class HammingClient {
  private client: AxiosInstance;
  private maxRetries: number;
  private debug: boolean;

  constructor(config: ApiConfig = {}) {
    const apiKey = config.apiKey || process.env.HAMMING_API_KEY;
    const baseUrl = config.baseUrl || process.env.HAMMING_API_URL || 'https://app.hamming.ai/api/v1';
    
    if (!apiKey) {
      throw new Error('API key is required. Set HAMMING_API_KEY environment variable or pass apiKey in config');
    }
    
    this.maxRetries = config.maxRetries || parseInt(process.env.HAMMING_MAX_RETRIES || '3');
    this.debug = config.debug || process.env.HAMMING_DEBUG === 'true';
    
    // Configure axios client
    this.client = axios.create({
      baseURL: baseUrl,
      timeout: config.timeout || parseInt(process.env.HAMMING_TIMEOUT || '30000'),
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'hamming-ai-demo-client-ts/1.0.0'
      }
    });
    
    // Add request/response interceptors for debugging
    if (this.debug) {
      this.client.interceptors.request.use(request => {
        console.log(`Making ${request.method?.toUpperCase()} request to ${request.url}`);
        if (request.data) {
          console.log('Payload:', JSON.stringify(request.data, null, 2));
        }
        return request;
      });
      
      this.client.interceptors.response.use(
        response => {
          console.log(`Response status: ${response.status}`);
          console.log('Response data:', JSON.stringify(response.data, null, 2));
          return response;
        },
        error => {
          console.error(`Response error: ${error.response?.status}`, error.response?.data);
          return Promise.reject(error);
        }
      );
    }
  }

  /**
   * Make a request to the Hamming AI API with retry logic
   */
  private async makeRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any
  ): Promise<T> {
    const config = {
      method: method.toLowerCase(),
      url: endpoint.startsWith('/') ? endpoint : `/${endpoint}`,
      ...(data && { data })
    };

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const response: AxiosResponse<T> = await this.client.request(config);
        return response.data;
      } catch (error) {
        if (attempt < this.maxRetries) {
          const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.log(`Request failed (attempt ${attempt + 1}/${this.maxRetries + 1}):`, (error as Error).message);
          console.log(`Retrying in ${waitTime}ms...`);
          await this.sleep(waitTime);
        } else {
          throw error;
        }
      }
    }
    
    throw new Error('Max retries exceeded');
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Outbound Call Methods

  /**
   * Create a new outbound call test run
   */
  async createOutboundTestRun(config: TestConfig): Promise<TestRun> {
    return this.makeRequest<TestRun>('POST', '/outbound/test-runs', config);
  }

  /**
   * Get details of an outbound test run
   */
  async getOutboundTestRun(runId: string): Promise<TestRun> {
    return this.makeRequest<TestRun>('GET', `/outbound/test-runs/${runId}`);
  }

  /**
   * Get results of an outbound test run
   */
  async getOutboundTestResults(runId: string): Promise<TestResults> {
    return this.makeRequest<TestResults>('GET', `/outbound/test-runs/${runId}/results`);
  }

  // Inbound Call Methods

  /**
   * Create a new inbound call test run
   */
  async createInboundTestRun(config: TestConfig): Promise<TestRun> {
    return this.makeRequest<TestRun>('POST', '/inbound/test-runs', config);
  }

  /**
   * Get details of an inbound test run
   */
  async getInboundTestRun(runId: string): Promise<TestRun> {
    return this.makeRequest<TestRun>('GET', `/inbound/test-runs/${runId}`);
  }

  /**
   * Get results of an inbound test run
   */
  async getInboundTestResults(runId: string): Promise<TestResults> {
    return this.makeRequest<TestResults>('GET', `/inbound/test-runs/${runId}/results`);
  }

  // Utility Methods

  /**
   * Wait for a test run to complete
   */
  async waitForCompletion(
    runId: string,
    callType: 'outbound' | 'inbound' = 'outbound',
    timeout: number = 300000
  ): Promise<TestRun> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      let runStatus: TestRun;

      if (callType === 'outbound') {
        runStatus = await this.getOutboundTestRun(runId);
      } else {
        runStatus = await this.getInboundTestRun(runId);
      }

      const status = runStatus.status || 'unknown';
      console.log(`Test run ${runId} status: ${status}`);

      if (['completed', 'failed', 'cancelled'].includes(status)) {
        return runStatus;
      }

      await this.sleep(5000); // Check every 5 seconds
    }

    throw new Error(`Test run ${runId} did not complete within ${timeout}ms`);
  }

  /**
   * List recent test runs
   */
  async listTestRuns(callType: 'outbound' | 'inbound' = 'outbound', limit: number = 10): Promise<TestRun[]> {
    const params = new URLSearchParams({ limit: limit.toString() });
    const endpoint = `/${callType}/test-runs?${params}`;

    return this.makeRequest<TestRun[]>('GET', endpoint);
  }
}

export default HammingClient;