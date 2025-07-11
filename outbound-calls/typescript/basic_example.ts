#!/usr/bin/env ts-node
/**
 * Basic Outbound Call Testing Example - TypeScript
 * 
 * This example demonstrates how to:
 * 1. Create a simple outbound call test run
 * 2. Monitor the test execution  
 * 3. Retrieve and display results
 * 
 * Perfect for getting started with outbound call testing.
 */

import * as fs from 'fs';
import * as path from 'path';
import { HammingClient, TestConfig, TestRun, TestResults } from '../../shared/typescript/hamming-client';

interface OutboundTestConfig extends TestConfig {
  phone_numbers: string[];
  agent_config: {
    voice: string;
    personality: string;
    instructions: string;
  };
  test_cases: Array<{
    name: string;
    description: string;
    expected_behaviors: string[];
  }>;
  settings: {
    max_duration: number;
    recording_enabled: boolean;
    analysis_enabled: boolean;
  };
}

async function main(): Promise<void> {
  console.log('🚀 Starting Basic Outbound Call Test');
  console.log('='.repeat(50));

  try {
    // Initialize the Hamming AI client
    const client = new HammingClient();
    console.log('✅ Client initialized successfully');

    // Basic test configuration
    const testConfig: OutboundTestConfig = {
      name: 'Basic Outbound Test',
      description: 'Simple outbound call test to verify agent functionality',
      phone_numbers: [
        // Add your test phone numbers here
        // '+1234567890',
        // '+1987654321'
      ],
      agent_config: {
        voice: 'default',
        personality: 'helpful and friendly',
        instructions: 'You are a helpful assistant conducting a test call. Be brief and professional.'
      },
      test_cases: [
        {
          name: 'Basic Greeting Test',
          description: 'Test basic greeting and response',
          expected_behaviors: [
            'Agent should greet the caller politely',
            'Agent should identify the purpose of the call',
            'Agent should handle basic questions'
          ]
        }
      ],
      settings: {
        max_duration: 120, // 2 minutes
        recording_enabled: true,
        analysis_enabled: true
      }
    };

    // Add some test phone numbers if none provided
    if (testConfig.phone_numbers.length === 0) {
      console.log('⚠️  No phone numbers provided. This is a demo - add real numbers to testConfig.phone_numbers');
      testConfig.phone_numbers = ['+1234567890']; // Placeholder
    }

    console.log(`📞 Test will call ${testConfig.phone_numbers.length} number(s)`);
    console.log(`📋 Test cases: ${testConfig.test_cases.length}`);

    // Create the test run
    console.log('\n🔄 Creating test run...');
    const testRun: TestRun = await client.createOutboundTestRun(testConfig);
    const runId = testRun.run_id;

    console.log('✅ Test run created successfully!');
    console.log(`📊 Run ID: ${runId}`);
    console.log(`🔗 Status: ${testRun.status}`);

    // Monitor the test execution
    console.log('\n⏳ Monitoring test execution...');
    const finalStatus: TestRun = await client.waitForCompletion(runId, 'outbound');

    console.log('\n🎉 Test completed!');
    console.log(`📊 Final Status: ${finalStatus.status}`);

    // Get detailed results
    console.log('\n📊 Retrieving detailed results...');
    const results: TestResults = await client.getOutboundTestResults(runId);

    // Display results summary
    console.log('\n' + '='.repeat(50));
    console.log('📋 TEST RESULTS SUMMARY');
    console.log('='.repeat(50));

    console.log(`Total Calls: ${results.total_calls || 0}`);
    console.log(`Successful Calls: ${results.successful_calls || 0}`);
    console.log(`Failed Calls: ${results.failed_calls || 0}`);
    console.log(`Average Duration: ${(results.average_duration || 0).toFixed(1)}s`);

    // Show individual call results
    if (results.calls && results.calls.length > 0) {
      console.log('\n📞 INDIVIDUAL CALL RESULTS:');
      results.calls.forEach((call, index) => {
        console.log(`\n  Call ${index + 1}:`);
        console.log(`    Phone: ${call.phone_number || 'N/A'}`);
        console.log(`    Status: ${call.status || 'N/A'}`);
        console.log(`    Duration: ${(call.duration || 0).toFixed(1)}s`);

        if (call.transcript) {
          console.log(`    Transcript Preview: ${call.transcript.substring(0, 100)}...`);
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
    const resultsFile = `outbound_test_results_${runId}.json`;
    fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));

    console.log(`\n💾 Full results saved to: ${resultsFile}`);
    console.log('\n🎉 Test completed successfully!');

  } catch (error) {
    console.error(`\n❌ Error: ${(error as Error).message}`);
    process.exit(1);
  }
}

// Run the example
if (require.main === module) {
  main().catch(console.error);
}