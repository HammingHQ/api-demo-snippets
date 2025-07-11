#!/usr/bin/env ts-node
/**
 * Basic Voice Agent Testing Example - TypeScript
 * 
 * This example demonstrates how to:
 * 1. Create a test run and get assigned phone numbers
 * 2. Display the numbers to call
 * 3. Show dashboard URL for monitoring
 * 
 * Perfect for getting started with voice agent testing.
 */

import axios, { AxiosInstance } from 'axios';

interface TestRunResponse {
  testRunId: string;
  assignedNumbers: Array<{
    phoneNumber: string;
    testCaseTitle: string;
    testCaseRunId?: string;
  }>;
  expiresAt: string;
}

class HammingVoiceAgentAPI {
  private client: AxiosInstance;
  public baseUrl: string;

  constructor(apiKey: string, baseUrl: string = 'https://app.hamming.ai') {
    this.baseUrl = baseUrl;
    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async createTestRun(
    agentId: string,
    testName?: string,
    tagIds?: string[],
    timeoutMinutes: number = 10
  ): Promise<TestRunResponse> {
    const response = await this.client.post('/api/rest/test-runs/test-outbound-agent', {
      agentId,
      name: testName || 'TypeScript API Test',
      timeoutMinutes,
      tagIds: tagIds || ['default']
    });
    
    return response.data;
  }
}

async function main(): Promise<number> {
  console.log('🚀 Starting Basic Voice Agent Test');
  console.log('='.repeat(50));
  
  // Configuration - update these values
  const apiKey = 'your-api-key-here';
  const agentId = 'your-agent-id';
  const tagIds = ['default', 'api-test']; // Specify which test cases to run
  
  try {
    const api = new HammingVoiceAgentAPI(apiKey);
    console.log('✅ API client initialized');
    
    // Create test run
    console.log('\n🔄 Creating test run...');
    const testRunResponse = await api.createTestRun(
      agentId,
      'Basic TypeScript API Test',
      tagIds
    );
    
    const testRunId = testRunResponse.testRunId;
    const assignedNumbers = testRunResponse.assignedNumbers;
    
    console.log('✅ Test run created successfully!');
    console.log(`📊 Test Run ID: ${testRunId}`);
    
    // Display assigned numbers
    console.log('\n📞 ASSIGNED PHONE NUMBERS');
    console.log('='.repeat(60));
    console.log('Call these numbers to test your agent:');
    
    assignedNumbers.forEach((assignment, index) => {
      console.log(`  ${index + 1}. ${assignment.phoneNumber}`);
      console.log(`     Test Case: ${assignment.testCaseTitle}`);
      console.log();
    });
    
    // Show dashboard link
    const dashboardUrl = `${api.baseUrl}/test-runs/${testRunId}`;
    console.log(`📊 Dashboard URL: ${dashboardUrl}`);
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error(`\n❌ Error: ${(error as Error).message}`);
    return 1;
  }
  
  return 0;
}

// Run the example
if (require.main === module) {
  main().then(process.exit).catch(console.error);
}