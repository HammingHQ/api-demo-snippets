#!/usr/bin/env python3
"""
Basic Outbound Call Testing Example

This example demonstrates how to:
1. Create a simple outbound call test run
2. Monitor the test execution
3. Retrieve and display results

Perfect for getting started with outbound call testing.
"""

import sys
import os
import json
from pathlib import Path

# Add shared utilities to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent / 'shared' / 'python'))

from hamming_client import HammingClient

def main():
    """
    Run a basic outbound call test
    """
    print("🚀 Starting Basic Outbound Call Test")
    print("=" * 50)
    
    try:
        # Initialize the Hamming AI client
        client = HammingClient()
        print("✅ Client initialized successfully")
        
        # Basic test configuration
        test_config = {
            "name": "Basic Outbound Test",
            "description": "Simple outbound call test to verify agent functionality",
            "phone_numbers": [
                # Add your test phone numbers here
                # "+1234567890",
                # "+1987654321"
            ],
            "agent_config": {
                "voice": "default",
                "personality": "helpful and friendly",
                "instructions": "You are a helpful assistant conducting a test call. Be brief and professional."
            },
            "test_cases": [
                {
                    "name": "Basic Greeting Test",
                    "description": "Test basic greeting and response",
                    "expected_behaviors": [
                        "Agent should greet the caller politely",
                        "Agent should identify the purpose of the call",
                        "Agent should handle basic questions"
                    ]
                }
            ],
            "settings": {
                "max_duration": 120,  # 2 minutes
                "recording_enabled": True,
                "analysis_enabled": True
            }
        }
        
        # Add some test phone numbers if none provided
        if not test_config["phone_numbers"]:
            print("⚠️  No phone numbers provided. This is a demo - add real numbers to test_config['phone_numbers']")
            test_config["phone_numbers"] = ["+1234567890"]  # Placeholder
        
        print(f"📞 Test will call {len(test_config['phone_numbers'])} number(s)")
        print(f"📋 Test cases: {len(test_config['test_cases'])}")
        
        # Create the test run
        print("\n🔄 Creating test run...")
        test_run = client.create_outbound_test_run(test_config)
        run_id = test_run['run_id']
        
        print(f"✅ Test run created successfully!")
        print(f"📊 Run ID: {run_id}")
        print(f"🔗 Status: {test_run['status']}")
        
        # Monitor the test execution
        print("\n⏳ Monitoring test execution...")
        final_status = client.wait_for_completion(run_id, 'outbound')
        
        print(f"\n🎉 Test completed!")
        print(f"📊 Final Status: {final_status['status']}")
        
        # Get detailed results
        print("\n📊 Retrieving detailed results...")
        results = client.get_outbound_test_results(run_id)
        
        # Display results summary
        print("\n" + "=" * 50)
        print("📋 TEST RESULTS SUMMARY")
        print("=" * 50)
        
        print(f"Total Calls: {results.get('total_calls', 0)}")
        print(f"Successful Calls: {results.get('successful_calls', 0)}")
        print(f"Failed Calls: {results.get('failed_calls', 0)}")
        print(f"Average Duration: {results.get('average_duration', 0):.1f}s")
        
        # Show individual call results
        if 'calls' in results:
            print(f"\n📞 INDIVIDUAL CALL RESULTS:")
            for i, call in enumerate(results['calls'], 1):
                print(f"\n  Call {i}:")
                print(f"    Phone: {call.get('phone_number', 'N/A')}")
                print(f"    Status: {call.get('status', 'N/A')}")
                print(f"    Duration: {call.get('duration', 0):.1f}s")
                
                if 'transcript' in call:
                    print(f"    Transcript Preview: {call['transcript'][:100]}...")
                
                if 'analysis' in call:
                    analysis = call['analysis']
                    print(f"    Analysis Score: {analysis.get('overall_score', 'N/A')}")
                    if 'key_points' in analysis:
                        print(f"    Key Points: {', '.join(analysis['key_points'][:3])}")
        
        # Save results to file
        results_file = f"outbound_test_results_{run_id}.json"
        with open(results_file, 'w') as f:
            json.dump(results, f, indent=2)
        
        print(f"\n💾 Full results saved to: {results_file}")
        print("\n🎉 Test completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()