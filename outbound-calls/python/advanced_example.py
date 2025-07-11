#!/usr/bin/env python3
"""
Advanced Outbound Call Testing Example

This example demonstrates how to:
1. Create a test run and get assigned phone numbers
2. Display the numbers to call
3. Wait for completion and show detailed results
4. Save results to file

Perfect for automated testing and CI/CD integration.
"""

import asyncio
import aiohttp
import json
import os
import time
from typing import Dict, Any, Optional, List

class HammingOutboundCallAPI:
    def __init__(self, api_key: str, base_url: str = "https://app.hamming.ai"):
        self.api_key = api_key
        self.base_url = base_url
        self.session: Optional[aiohttp.ClientSession] = None
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession(
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
        )
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def create_test_run(
        self,
        agent_id: str,
        test_name: Optional[str] = None,
        tag_ids: Optional[List[str]] = None,
        timeout_minutes: int = 10
    ) -> Dict[str, Any]:
        """Create a test run and get assigned phone numbers to call."""
        url = f"{self.base_url}/api/rest/test-runs/test-outbound-agent"
        payload = {
            "agentId": agent_id,
            "name": test_name or "API Test Run",
            "timeoutMinutes": timeout_minutes,
            "tagIds": tag_ids or ["default"]
        }
        
        async with self.session.post(url, json=payload) as response:
            if response.status != 200:
                error_text = await response.text()
                raise Exception(f"Failed to create test run: {response.status} - {error_text}")
            return await response.json()
    
    async def get_test_run_status(self, test_run_id: str) -> Dict[str, Any]:
        """Get current status of a test run."""
        url = f"{self.base_url}/api/rest/test-runs/{test_run_id}/status"
        async with self.session.get(url) as response:
            if response.status != 200:
                error_text = await response.text()
                raise Exception(f"Failed to get test run status: {response.status} - {error_text}")
            return await response.json()
    
    async def get_test_results(self, test_run_id: str) -> Dict[str, Any]:
        """Get detailed test results."""
        url = f"{self.base_url}/api/rest/test-runs/{test_run_id}/results"
        async with self.session.get(url) as response:
            if response.status != 200:
                error_text = await response.text()
                raise Exception(f"Failed to get test results: {response.status} - {error_text}")
            return await response.json()

def print_assigned_numbers(assigned_numbers: list):
    """Print formatted assigned phone numbers."""
    print(f"\n📞 ASSIGNED PHONE NUMBERS")
    print("="*60)
    print("Call these numbers to test your agent:")
    
    for i, assignment in enumerate(assigned_numbers, 1):
        phone_number = assignment.get('phoneNumber', 'N/A')
        test_case = assignment.get('testCaseTitle', 'Unknown Test')
        test_id = assignment.get('testCaseRunId', 'N/A')
        
        print(f"  {i}. {phone_number}")
        print(f"     Test Case: {test_case}")
        print(f"     Test ID: {test_id}")
        print()
    
    print("📋 Instructions:")
    print("  1. Call each number from your test phone")
    print("  2. Follow the test case scenario")
    print("  3. Wait for the test run to complete")
    print("  4. Review results in the dashboard")
    print("="*60)

def print_test_results(results: Dict[str, Any], test_run_id: str, dashboard_url: str):
    """Print formatted test results."""
    print("\n" + "="*60)
    print("VOICE AGENT TEST RESULTS")
    print("="*60)
    print(f"Test Run ID: {test_run_id}")
    print(f"View Results: {dashboard_url}")
    
    summary = results.get('summary', {})
    total_tests = summary.get('total', 0)
    completed_tests = summary.get('completed', 0)
    failed_tests = summary.get('failed', 0)
    pending_tests = summary.get('pending', 0)
    
    print(f"Total Tests: {total_tests}")
    print(f"Completed: {completed_tests}")
    print(f"Failed: {failed_tests}")
    print(f"Pending: {pending_tests}")
    
    if completed_tests > 0:
        success_rate = ((completed_tests - failed_tests) / completed_tests) * 100
        print(f"Success Rate: {success_rate:.1f}%")
    
    # Show individual test results
    test_results = results.get('results', [])
    if test_results:
        print(f"\nIndividual Test Results ({len(test_results)} tests):")
        for i, result in enumerate(test_results, 1):
            status = result.get('status', 'Unknown')
            duration = result.get('durationSeconds', 0)
            print(f"  {i}. Status: {status}, Duration: {duration}s")
            
            if result.get('recordingUrl'):
                print(f"     🎵 Recording: {result['recordingUrl']}")
            
            if result.get('transcriptionDataUrl'):
                print(f"     📝 Transcript: {result['transcriptionDataUrl']}")
    
    print("="*60)

async def wait_for_completion(api, test_run_id: str, max_wait_seconds: int = 600):
    """Wait for test completion and return results."""
    print(f"\n⏳ Waiting for test run {test_run_id} to complete...")
    print("💡 Tip: You can skip waiting and check results later in the dashboard")
    
    start_time = time.time()
    
    while True:
        if time.time() - start_time > max_wait_seconds:
            print(f"⏰ Timeout reached ({max_wait_seconds}s). Check dashboard for results.")
            return None
        
        status = await api.get_test_run_status(test_run_id)
        
        if status["status"] in ["COMPLETED", "FAILED"]:
            print(f"✅ Test run {status['status'].lower()}")
            break
        
        print(f"🔄 Status: {status['status']} - waiting...")
        await asyncio.sleep(10)
    
    return await api.get_test_results(test_run_id)

async def main():
    """Run an advanced outbound call test with full workflow."""
    print("🚀 Starting Advanced Outbound Call Test")
    print("=" * 50)
    
    # Configuration - update these values
    api_key = os.getenv("HAMMING_API_KEY", "your-api-key-here")
    agent_id = os.getenv("HAMMING_AGENT_ID", "your-agent-id")
    tag_ids = ["default", "api-test"]  # Specify which test cases to run
    
    if api_key == "your-api-key-here" or agent_id == "your-agent-id":
        print("⚠️  Please set HAMMING_API_KEY and HAMMING_AGENT_ID environment variables")
        print("   Or update the values in the script")
        return
    
    try:
        async with HammingOutboundCallAPI(api_key) as api:
            print("✅ API client initialized")
            
            # Create test run
            print("\n🔄 Creating test run...")
            test_run_response = await api.create_test_run(
                agent_id=agent_id,
                test_name="Advanced Outbound API Test",
                tag_ids=tag_ids
            )
            
            test_run_id = test_run_response["testRunId"]
            assigned_numbers = test_run_response["assignedNumbers"]
            
            print(f"✅ Test run created successfully!")
            print(f"📊 Test Run ID: {test_run_id}")
            
            # Display assigned numbers
            print_assigned_numbers(assigned_numbers)
            
            # IMPORTANT: Now you need to call these numbers to trigger your agent
            # Uncomment the following section to see agent dispatch examples:
            
            # NEXT STEPS - HOW TO DISPATCH YOUR AGENT:
            # 1. Use your telephony system to call the assigned numbers above
            # 2. Your calls will connect to Hamming's test infrastructure  
            # 3. Hamming will then call your agent's webhook/phone number
            # 4. Your agent should handle the incoming call and respond appropriately
            
            # AGENT DISPATCH EXAMPLES:
            # • Twilio: client.calls.create(to=assigned_number, from_=your_number, webhook_url)
            # • Direct SIP: Configure your PBX to call the assigned numbers
            # • Manual: Call the numbers from your test phone
            # • Automated: Use your existing call dispatch system
            
            # TWILIO INTEGRATION EXAMPLE:
            # pip install twilio
            # from twilio.rest import Client
            # client = Client('your_account_sid', 'your_auth_token')
            # for assignment in assigned_numbers:
            #     call = client.calls.create(
            #         to=assignment['phoneNumber'],
            #         from_='+1234567890',  # Your Twilio number
            #         url='https://yourapp.com/voice'  # Your agent's webhook
            #     )
            
            # Ask user if they want to wait for completion
            print("\n🤔 Options:")
            print("  1. Wait for test completion (recommended for small tests)")
            print("  2. Exit now and check results later in dashboard")
            
            choice = input("\nEnter choice (1 or 2): ").strip()
            
            if choice == "1":
                # Monitor the test execution
                print("\n⏳ Monitoring test execution...")
                results = await wait_for_completion(api, test_run_id)
                if results:
                    print(f"\n🎉 Test completed!")
                    print(f"📊 Final Status: {results.get('status', 'Unknown')}")
                    
                    # Get detailed results
                    print("\n📊 Retrieving detailed results...")
                    
                    # Display results summary
                    print("\n" + "=" * 50)
                    print("📋 TEST RESULTS SUMMARY")
                    print("=" * 50)
                    
                    summary = results.get('summary', {})
                    stats = summary.get('stats', {})
                    
                    print(f"Total Calls: {stats.get('total', 0)}")
                    print(f"Successful Calls: {stats.get('completed', 0) - stats.get('failed', 0)}")
                    print(f"Failed Calls: {stats.get('failed', 0)}")
                    print(f"Pending Calls: {stats.get('pending', 0)}")
                    
                    # Show individual call results
                    call_results = results.get('results', [])
                    if call_results:
                        print(f"\n📞 INDIVIDUAL CALL RESULTS:")
                        for i, call in enumerate(call_results, 1):
                            print(f"\n  Call {i}:")
                            print(f"    Status: {call.get('status', 'N/A')}")
                            print(f"    Duration: {call.get('durationSeconds', 0):.1f}s")
                            
                            if call.get('recordingUrl'):
                                print(f"    🎵 Recording: {call['recordingUrl']}")
                            
                            if call.get('transcriptionDataUrl'):
                                print(f"    📝 Transcript: {call['transcriptionDataUrl']}")
                            
                            if call.get('analysis'):
                                analysis = call['analysis']
                                print(f"    Analysis Score: {analysis.get('overall_score', 'N/A')}")
                                if analysis.get('key_points'):
                                    print(f"    Key Points: {', '.join(analysis['key_points'][:3])}")
                    
                    # Save results to file
                    results_file = f"outbound_test_results_{test_run_id}.json"
                    with open(results_file, 'w') as f:
                        json.dump(results, f, indent=2)
                    
                    print(f"\n💾 Full results saved to: {results_file}")
                    print("\n🎉 Test completed successfully!")
            else:
                # Just show dashboard link
                dashboard_url = f"{api.base_url}/test-runs/{test_run_id}"
                print(f"\n✅ Test run created successfully!")
                print(f"📊 Dashboard URL: {dashboard_url}")
                print(f"📞 Call the numbers shown above to execute the tests")
                print(f"💡 Tip: Monitor progress in the dashboard")
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    exit(exit_code)