#!/usr/bin/env ts-node
/**
 * Basic Inbound Call Testing Example - TypeScript
 * 
 * This example demonstrates how to:
 * 1. Create an inbound call test run
 * 2. Display phone numbers to call
 * 3. Monitor incoming calls and responses
 * 4. Retrieve and analyze results
 * 
 * Perfect for testing inbound voice agents.
 */

import * as fs from 'fs';
import { HammingClient, TestConfig, TestRun, TestResults } from '../../shared/typescript/hamming-client';

interface InboundTestConfig extends TestConfig {
  agent_config: {
    voice: string;
    personality: string;
    instructions: string;
    greeting: string;
  };
  test_scenarios: Array<{
    name: string;
    description: string;
    caller_profile: {
      name: string;
      issue_type: string;
      tone: string;
    };
    test_script: string[];
    expected_behaviors: string[];
  }>;
  telephony_config: {
    provider: string;
    number_count: number;
    region: string;
    features: string[];
  };
  settings: {
    max_duration: number;
    recording_enabled: boolean;
    analysis_enabled: boolean;
    auto_answer: boolean;
  };
}

interface PhoneNumber {
  number: string;
  region?: string;
  provider?: string;
}

interface InboundTestRun extends TestRun {
  phone_numbers?: PhoneNumber[];
  calls_completed?: number;
  calls_expected?: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
  console.log('📞 Starting Basic Inbound Call Test');
  console.log('='.repeat(50));

  try {
    // Initialize the Hamming AI client
    const client = new HammingClient();
    console.log('✅ Client initialized successfully');

    // Basic inbound test configuration
    const testConfig: InboundTestConfig = {
      name: 'Basic Inbound Test',
      description: 'Simple inbound call test to verify agent responses',
      agent_config: {
        voice: 'default',
        personality: 'helpful customer service representative',
        instructions: 'You are a customer service agent. Be helpful, professional, and solve customer issues efficiently.',
        greeting: 'Hello! Thank you for calling. How can I help you today?'
      },
      test_scenarios: [
        {
          name: 'Customer Service Inquiry',
          description: 'Test handling of general customer questions',
          caller_profile: {
            name: 'Test Customer',
            issue_type: 'general_inquiry',
            tone: 'neutral'
          },
          test_script: [
            'Hi, I have a question about my account',
            'Can you help me check my recent orders?',
            'Thank you for your help'
          ],
          expected_behaviors: [
            'Agent should greet professionally',
            'Agent should ask for account information',
            'Agent should provide helpful responses',
            'Agent should maintain professional tone'
          ]
        }
      ],
      telephony_config: {
        provider: 'twilio', // or 'livekit'
        number_count: 2,    // Request 2 phone numbers
        region: 'us',
        features: ['recording', 'transcription']
      },
      settings: {
        max_duration: 300,   // 5 minutes per call
        recording_enabled: true,
        analysis_enabled: true,
        auto_answer: true
      }
    };

    console.log(`🎯 Test scenarios: ${testConfig.test_scenarios.length}`);
    console.log(`📞 Requesting ${testConfig.telephony_config.number_count} phone numbers`);

    // Create the inbound test run
    console.log('\n🔄 Creating inbound test run...');
    const testRun: InboundTestRun = await client.createInboundTestRun(testConfig);
    const runId = testRun.run_id;

    console.log('✅ Test run created successfully!');
    console.log(`📊 Run ID: ${runId}`);
    console.log(`🔗 Status: ${testRun.status}`);

    // Display phone numbers to call
    if (testRun.phone_numbers && testRun.phone_numbers.length > 0) {
      console.log('\n📞 PHONE NUMBERS TO CALL:');
      console.log('='.repeat(30));
      testRun.phone_numbers.forEach((number, index) => {
        console.log(`  ${index + 1}. ${number.number}`);
        console.log(`     Region: ${number.region || 'N/A'}`);
        console.log(`     Provider: ${number.provider || 'N/A'}`);
        console.log('');
      });

      console.log('🎯 INSTRUCTIONS:');
      console.log('1. Call the numbers above to test your inbound agent');
      console.log('2. Follow the test scenarios or speak naturally');
      console.log('3. The system will record and analyze the conversations');
      console.log('4. This script will monitor for completed calls');
      console.log('');
    }

    // Monitor for incoming calls
    console.log('⏳ Monitoring for incoming calls...');
    console.log('💡 Tip: Call the numbers above to start testing!');

    // Wait for test completion or timeout
    const timeout = 600000; // 10 minutes
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      // Check test status
      const currentStatus: InboundTestRun = await client.getInboundTestRun(runId);
      const status = currentStatus.status || 'unknown';

      // Check for completed calls
      if (currentStatus.calls_completed !== undefined) {
        const completed = currentStatus.calls_completed;
        const total = currentStatus.calls_expected || testConfig.test_scenarios.length;
        console.log(`📊 Progress: ${completed}/${total} calls completed`);
      }

      // Check if test is done
      if (['completed', 'failed'].includes(status)) {
        break;
      }

      // Show periodic status
      if (Math.floor((Date.now() - startTime) / 1000) % 30 === 0) {
        console.log(`⏳ Still monitoring... (Status: ${status})`);
      }

      await sleep(5000);
    }

    // Get final results
    console.log('\n📊 Retrieving test results...');
    const finalStatus: InboundTestRun = await client.getInboundTestRun(runId);
    const results: TestResults = await client.getInboundTestResults(runId);

    // Display results summary
    console.log('\n' + '='.repeat(50));
    console.log('📋 TEST RESULTS SUMMARY');
    console.log('='.repeat(50));

    console.log(`Final Status: ${finalStatus.status || 'unknown'}`);
    console.log(`Total Calls Received: ${results.total_calls || 0}`);
    console.log(`Successful Calls: ${results.successful_calls || 0}`);
    console.log(`Failed Calls: ${results.failed_calls || 0}`);
    console.log(`Average Duration: ${(results.average_duration || 0).toFixed(1)}s`);

    // Show individual call results
    if (results.calls && results.calls.length > 0) {
      console.log('\n📞 CALL DETAILS:');
      results.calls.forEach((call, index) => {
        console.log(`\n  Call ${index + 1}:`);
        console.log(`    Caller: ${call.caller_number || 'N/A'}`);
        console.log(`    Called: ${call.called_number || 'N/A'}`);
        console.log(`    Status: ${call.status || 'N/A'}`);
        console.log(`    Duration: ${(call.duration || 0).toFixed(1)}s`);

        if (call.transcript) {
          console.log('    Transcript Preview:');
          console.log(`      ${call.transcript.substring(0, 150)}...`);
        }

        if (call.analysis) {
          console.log(`    Analysis Score: ${call.analysis.overall_score || 'N/A'}`);
          if (call.analysis.sentiment) {
            console.log(`    Sentiment: ${call.analysis.sentiment}`);
          }
          if (call.analysis.key_points) {
            console.log(`    Key Points: ${call.analysis.key_points.slice(0, 3).join(', ')}`);
          }
        }
      });
    } else {
      console.log('\n⚠️  No calls were received during the test period');
      console.log('   Make sure to call the provided numbers to generate test data');
    }

    // Save results to file
    const resultsFile = `inbound_test_results_${runId}.json`;
    fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));

    console.log(`\n💾 Full results saved to: ${resultsFile}`);
    console.log('\n🎉 Inbound test completed!');

  } catch (error) {
    console.error(`\n❌ Error: ${(error as Error).message}`);
    process.exit(1);
  }
}

// Run the example
if (require.main === module) {
  main().catch(console.error);
}