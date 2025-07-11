#!/usr/bin/env ts-node
/**
 * Advanced Voice Agent Testing Example - TypeScript
 * 
 * This example demonstrates how to:
 * 1. Create a test run and get assigned phone numbers
 * 2. Display the numbers to call
 * 3. Wait for completion and show detailed results
 * 4. Save results to file
 * 
 * Perfect for automated testing and CI/CD integration.
 */

import axios, { AxiosInstance } from 'axios';
import * as readline from 'readline';
import * as fs from 'fs';

interface TestRunResponse {
  testRunId: string;
  assignedNumbers: Array<{
    phoneNumber: string;
    testCaseTitle: string;
    testCaseRunId?: string;
  }>;
  expiresAt: string;
}

interface TestResults {
  summary: {
    id: string;
    status: string;
    stats: {
      total: number;
      completed: number;
      failed: number;
      pending: number;
      inProgress: number;
    };
  };
  results: Array<{
    id: string;
    testCaseId: string;
    status: string;
    durationSeconds?: number;
    recordingUrl?: string;
    transcriptionDataUrl?: string;
    analysis?: {
      overall_score?: number;
      key_points?: string[];
    };
  }>;
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

  async getTestRunStatus(testRunId: string): Promise<any> {
    const response = await this.client.get(`/api/rest/test-runs/${testRunId}/status`);
    return response.data;
  }

  async getTestResults(testRunId: string): Promise<TestResults> {
    const response = await this.client.get(`/api/rest/test-runs/${testRunId}/results`);
    return response.data;
  }
}

function printAssignedNumbers(assignedNumbers: TestRunResponse['assignedNumbers']): void {
  console.log('\n📞 ASSIGNED PHONE NUMBERS');
  console.log('='.repeat(60));
  console.log('Call these numbers to test your agent:');
  
  assignedNumbers.forEach((assignment, index) => {
    console.log(`  ${index + 1}. ${assignment.phoneNumber}`);
    console.log(`     Test Case: ${assignment.testCaseTitle}`);
    console.log(`     Test ID: ${assignment.testCaseRunId || 'N/A'}`);
    console.log();
  });
  
  console.log('📋 Instructions:');
  console.log('  1. Call each number from your test phone');
  console.log('  2. Follow the test case scenario');
  console.log('  3. Wait for the test run to complete');
  console.log('  4. Review results in the dashboard');
  console.log('='.repeat(60));
}

function printTestResults(results: TestResults, testRunId: string, dashboardUrl: string): void {
  console.log('\n' + '='.repeat(60));
  console.log('VOICE AGENT TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`Test Run ID: ${testRunId}`);
  console.log(`View Results: ${dashboardUrl}`);
  
  const { stats } = results.summary;
  console.log(`Total Tests: ${stats.total}`);
  console.log(`Completed: ${stats.completed}`);
  console.log(`Failed: ${stats.failed}`);
  console.log(`Pending: ${stats.pending}`);
  
  if (stats.completed > 0) {
    const successRate = ((stats.completed - stats.failed) / stats.completed) * 100;
    console.log(`Success Rate: ${successRate.toFixed(1)}%`);
  }
  
  // Show individual test results
  if (results.results.length > 0) {
    console.log(`\nIndividual Test Results (${results.results.length} tests):`);
    results.results.forEach((result, index) => {
      console.log(`  ${index + 1}. Status: ${result.status}, Duration: ${result.durationSeconds || 0}s`);
      
      if (result.recordingUrl) {
        console.log(`     🎵 Recording: ${result.recordingUrl}`);
      }
      
      if (result.transcriptionDataUrl) {
        console.log(`     📝 Transcript: ${result.transcriptionDataUrl}`);
      }
      
      if (result.analysis) {
        console.log(`     Analysis Score: ${result.analysis.overall_score || 'N/A'}`);
        if (result.analysis.key_points) {
          console.log(`     Key Points: ${result.analysis.key_points.slice(0, 3).join(', ')}`);
        }
      }
    });
  }
  
  console.log('='.repeat(60));
}

async function waitForCompletion(api: HammingVoiceAgentAPI, testRunId: string, maxWaitSeconds: number = 600): Promise<TestResults | null> {
  console.log(`\n⏳ Waiting for test run ${testRunId} to complete...`);
  console.log('💡 Tip: You can skip waiting and check results later in the dashboard');
  
  const startTime = Date.now();
  
  while (true) {
    if (Date.now() - startTime > maxWaitSeconds * 1000) {
      console.log(`⏰ Timeout reached (${maxWaitSeconds}s). Check dashboard for results.`);
      return null;
    }
    
    const status = await api.getTestRunStatus(testRunId);
    
    if (['COMPLETED', 'FAILED'].includes(status.status)) {
      console.log(`✅ Test run ${status.status.toLowerCase()}`);
      break;
    }
    
    console.log(`🔄 Status: ${status.status} - waiting...`);
    await new Promise(resolve => setTimeout(resolve, 10000));
  }
  
  return await api.getTestResults(testRunId);
}

function askQuestion(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main(): Promise<number> {
  console.log('🚀 Starting Advanced Voice Agent Test');
  console.log('='.repeat(50));
  
  // Configuration - update these values
  const apiKey = process.env.HAMMING_API_KEY || 'your-api-key-here';
  const agentId = process.env.HAMMING_AGENT_ID || 'your-agent-id';
  const tagIds = ['default', 'api-test']; // Specify which test cases to run
  
  if (apiKey === 'your-api-key-here' || agentId === 'your-agent-id') {
    console.log('⚠️  Please set HAMMING_API_KEY and HAMMING_AGENT_ID environment variables');
    console.log('   Or update the values in the script');
    return 1;
  }
  
  try {
    const api = new HammingVoiceAgentAPI(apiKey);
    console.log('✅ API client initialized');
    
    // Create test run
    console.log('\n🔄 Creating test run...');
    const testRunResponse = await api.createTestRun(
      agentId,
      'Advanced TypeScript API Test',
      tagIds
    );
    
    const testRunId = testRunResponse.testRunId;
    const assignedNumbers = testRunResponse.assignedNumbers;
    
    console.log('✅ Test run created successfully!');
    console.log(`📊 Test Run ID: ${testRunId}`);
    
    // Display assigned numbers
    printAssignedNumbers(assignedNumbers);
    
    // Ask user if they want to wait for completion
    console.log('\n🤔 Options:');
    console.log('  1. Wait for test completion (recommended for small tests)');
    console.log('  2. Exit now and check results later in dashboard');
    
    const choice = await askQuestion('\nEnter choice (1 or 2): ');
    
    if (choice === '1') {
      // Monitor the test execution
      console.log('\n⏳ Monitoring test execution...');
      const results = await waitForCompletion(api, testRunId);
      if (results) {
        console.log('\n🎉 Test completed!');
        console.log(`📊 Final Status: ${results.summary?.status || 'Unknown'}`);
        
        // Get detailed results
        console.log('\n📊 Retrieving detailed results...');
        
        // Display results summary
        console.log('\n' + '='.repeat(50));
        console.log('📋 TEST RESULTS SUMMARY');
        console.log('='.repeat(50));
        
        const stats = results.summary?.stats || {};
        
        console.log(`Total Calls: ${stats.total || 0}`);
        console.log(`Successful Calls: ${(stats.completed || 0) - (stats.failed || 0)}`);
        console.log(`Failed Calls: ${stats.failed || 0}`);
        console.log(`Pending Calls: ${stats.pending || 0}`);
        
        // Show individual call results
        const callResults = results.results || [];
        if (callResults.length > 0) {
          console.log('\n📞 INDIVIDUAL CALL RESULTS:');
          callResults.forEach((call, index) => {
            console.log(`\n  Call ${index + 1}:`);
            console.log(`    Status: ${call.status || 'N/A'}`);
            console.log(`    Duration: ${(call.durationSeconds || 0).toFixed(1)}s`);
            
            if (call.recordingUrl) {
              console.log(`    🎵 Recording: ${call.recordingUrl}`);
            }
            
            if (call.transcriptionDataUrl) {
              console.log(`    📝 Transcript: ${call.transcriptionDataUrl}`);
            }
            
            if (call.analysis) {
              console.log(`    Analysis Score: ${call.analysis.overall_score || 'N/A'}`);
              if (call.analysis.key_points) {
                console.log(`    Key Points: ${call.analysis.key_points.slice(0, 3).join(', ')}`);
              }
            }
          });
        }
        
        // Save results to file
        const resultsFile = `outbound_test_results_${testRunId}.json`;
        fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
        
        console.log(`\n💾 Full results saved to: ${resultsFile}`);
        console.log('\n🎉 Test completed successfully!');
      }
    } else {
      // Just show dashboard link
      const dashboardUrl = `${api.baseUrl}/test-runs/${testRunId}`;
      console.log('\n✅ Test run created successfully!');
      console.log(`📊 Dashboard URL: ${dashboardUrl}`);
      console.log('📞 Call the numbers shown above to execute the tests');
      console.log('💡 Tip: Monitor progress in the dashboard');
    }
    
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