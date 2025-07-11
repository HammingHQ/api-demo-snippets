#!/usr/bin/env python3
"""
Basic Inbound Call Testing Example

This example demonstrates how to:
1. Create an inbound call test run
2. Display phone numbers to call
3. Monitor incoming calls and responses
4. Retrieve and analyze results

Perfect for testing inbound voice agents.
"""

import sys
import os
import json
import time
from pathlib import Path

# Add shared utilities to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent / 'shared' / 'python'))

from hamming_client import HammingClient

def main():
    """
    Run a basic inbound call test
    """
    print("📞 Starting Basic Inbound Call Test")
    print("=" * 50)
    
    try:
        # Initialize the Hamming AI client
        client = HammingClient()
        print("✅ Client initialized successfully")
        
        # Basic inbound test configuration
        test_config = {
            "name": "Basic Inbound Test",
            "description": "Simple inbound call test to verify agent responses",
            "agent_config": {
                "voice": "default",
                "personality": "helpful customer service representative",
                "instructions": "You are a customer service agent. Be helpful, professional, and solve customer issues efficiently.",
                "greeting": "Hello! Thank you for calling. How can I help you today?"
            },
            "test_scenarios": [
                {
                    "name": "Customer Service Inquiry",
                    "description": "Test handling of general customer questions",
                    "caller_profile": {
                        "name": "Test Customer",
                        "issue_type": "general_inquiry",
                        "tone": "neutral"
                    },
                    "test_script": [
                        "Hi, I have a question about my account",
                        "Can you help me check my recent orders?",
                        "Thank you for your help"
                    ],
                    "expected_behaviors": [
                        "Agent should greet professionally",
                        "Agent should ask for account information",
                        "Agent should provide helpful responses",
                        "Agent should maintain professional tone"
                    ]
                }
            ],
            "telephony_config": {
                "provider": "twilio",  # or "livekit"
                "number_count": 2,     # Request 2 phone numbers
                "region": "us",
                "features": ["recording", "transcription"]
            },
            "settings": {
                "max_duration": 300,   # 5 minutes per call
                "recording_enabled": True,
                "analysis_enabled": True,
                "auto_answer": True
            }
        }
        
        print(f"🎯 Test scenarios: {len(test_config['test_scenarios'])}")
        print(f"📞 Requesting {test_config['telephony_config']['number_count']} phone numbers")
        
        # Create the inbound test run
        print("\n🔄 Creating inbound test run...")
        test_run = client.create_inbound_test_run(test_config)
        run_id = test_run['run_id']
        
        print(f"✅ Test run created successfully!")
        print(f"📊 Run ID: {run_id}")
        print(f"🔗 Status: {test_run['status']}")
        
        # Display phone numbers to call
        if 'phone_numbers' in test_run:
            print(f"\n📞 PHONE NUMBERS TO CALL:")
            print("=" * 30)
            for i, number in enumerate(test_run['phone_numbers'], 1):
                print(f"  {i}. {number['number']}")
                print(f"     Region: {number.get('region', 'N/A')}")
                print(f"     Provider: {number.get('provider', 'N/A')}")
                print()
            
            print("🎯 INSTRUCTIONS:")
            print("1. Call the numbers above to test your inbound agent")
            print("2. Follow the test scenarios or speak naturally")
            print("3. The system will record and analyze the conversations")
            print("4. This script will monitor for completed calls")
            print()
        
        # Monitor for incoming calls
        print("⏳ Monitoring for incoming calls...")
        print("💡 Tip: Call the numbers above to start testing!")
        
        # Wait for test completion or timeout
        timeout = 600  # 10 minutes
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            # Check test status
            current_status = client.get_inbound_test_run(run_id)
            status = current_status.get('status', 'unknown')
            
            # Check for completed calls
            if 'calls_completed' in current_status:
                completed = current_status['calls_completed']
                total = current_status.get('calls_expected', len(test_config['test_scenarios']))
                print(f"📊 Progress: {completed}/{total} calls completed")
            
            # Check if test is done
            if status in ['completed', 'failed']:
                break
            
            # Show periodic status
            if int(time.time() - start_time) % 30 == 0:  # Every 30 seconds
                print(f"⏳ Still monitoring... (Status: {status})")
            
            time.sleep(5)
        
        # Get final results
        print("\n📊 Retrieving test results...")
        final_status = client.get_inbound_test_run(run_id)
        results = client.get_inbound_test_results(run_id)
        
        # Display results summary
        print("\n" + "=" * 50)
        print("📋 TEST RESULTS SUMMARY")
        print("=" * 50)
        
        print(f"Final Status: {final_status.get('status', 'unknown')}")
        print(f"Total Calls Received: {results.get('total_calls', 0)}")
        print(f"Successful Calls: {results.get('successful_calls', 0)}")
        print(f"Failed Calls: {results.get('failed_calls', 0)}")
        print(f"Average Duration: {results.get('average_duration', 0):.1f}s")
        
        # Show individual call results
        if 'calls' in results and results['calls']:
            print(f"\n📞 CALL DETAILS:")
            for i, call in enumerate(results['calls'], 1):
                print(f"\n  Call {i}:")
                print(f"    Caller: {call.get('caller_number', 'N/A')}")
                print(f"    Called: {call.get('called_number', 'N/A')}")
                print(f"    Status: {call.get('status', 'N/A')}")
                print(f"    Duration: {call.get('duration', 0):.1f}s")
                
                if 'transcript' in call:
                    print(f"    Transcript Preview:")
                    print(f"      {call['transcript'][:150]}...")
                
                if 'analysis' in call:
                    analysis = call['analysis']
                    print(f"    Analysis Score: {analysis.get('overall_score', 'N/A')}")
                    if 'sentiment' in analysis:
                        print(f"    Sentiment: {analysis['sentiment']}")
                    if 'key_points' in analysis:
                        print(f"    Key Points: {', '.join(analysis['key_points'][:3])}")
        else:
            print("\n⚠️  No calls were received during the test period")
            print("   Make sure to call the provided numbers to generate test data")
        
        # Save results to file
        results_file = f"inbound_test_results_{run_id}.json"
        with open(results_file, 'w') as f:
            json.dump(results, f, indent=2)
        
        print(f"\n💾 Full results saved to: {results_file}")
        print("\n🎉 Inbound test completed!")
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()