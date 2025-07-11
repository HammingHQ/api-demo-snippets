#!/usr/bin/env python3
"""
Basic Outbound Call Testing Example

This example demonstrates how to:
1. Create a test run and get assigned phone numbers
2. Display the numbers to call
3. Optionally wait for completion and show results

Perfect for getting started with voice agent testing.
"""

import asyncio
import aiohttp
import json
import os
from typing import Dict, Any, Optional, List

class HammingOutboundCallAPI:
    def __init__(self, api_key: str, base_url: str = "http://localhost:3000"):
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

async def main():
    """Run a basic outbound call test."""
    print("🚀 Starting Basic Outbound Call Test")
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
                test_name="Basic Outbound API Test",
                tag_ids=tag_ids
            )
            
            test_run_id = test_run_response["testRunId"]
            assigned_numbers = test_run_response["assignedNumbers"]
            
            print(f"✅ Test run created successfully!")
            print(f"📊 Test Run ID: {test_run_id}")
            
            # Display assigned numbers
            print(f"\n📞 ASSIGNED PHONE NUMBERS")
            print("="*60)
            print("Call these numbers to test your agent:")
            
            for i, assignment in enumerate(assigned_numbers, 1):
                phone_number = assignment.get('phoneNumber', 'N/A')
                test_case = assignment.get('testCaseTitle', 'Unknown Test')
                print(f"  {i}. {phone_number}")
                print(f"     Test Case: {test_case}")
                print()
            
            # Show dashboard link
            dashboard_url = f"{api.base_url}/test-runs/{test_run_id}"
            print(f"📊 Dashboard URL: {dashboard_url}")
            print("="*60)
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    exit(exit_code)