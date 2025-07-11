#!/usr/bin/env python3
"""
Hamming AI API Client - Shared utility for API interactions
"""

import os
import json
import time
import requests
from typing import Dict, Any, Optional, List
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class HammingClient:
    """
    A client for interacting with the Hamming AI API
    
    This client provides methods for both outbound and inbound call testing,
    with built-in error handling, retry logic, and logging.
    """
    
    def __init__(self, api_key: Optional[str] = None, base_url: Optional[str] = None):
        """
        Initialize the Hamming AI client
        
        Args:
            api_key: Your Hamming AI API key. If not provided, will try to load from HAMMING_API_KEY env var
            base_url: The base URL for the API. Defaults to production API
        """
        self.api_key = api_key or os.getenv('HAMMING_API_KEY')
        self.base_url = base_url or os.getenv('HAMMING_API_URL', 'https://app.hamming.ai/api/v1')
        
        if not self.api_key:
            raise ValueError("API key is required. Set HAMMING_API_KEY environment variable or pass api_key parameter")
        
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json',
            'User-Agent': 'hamming-ai-demo-client/1.0.0'
        })
        
        # Configuration
        self.timeout = int(os.getenv('HAMMING_TIMEOUT', 30))
        self.max_retries = int(os.getenv('HAMMING_MAX_RETRIES', 3))
        self.debug = os.getenv('HAMMING_DEBUG', 'false').lower() == 'true'
    
    def _make_request(self, method: str, endpoint: str, data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Make a request to the Hamming AI API with retry logic
        
        Args:
            method: HTTP method (GET, POST, etc.)
            endpoint: API endpoint
            data: Request payload
            
        Returns:
            API response as dictionary
            
        Raises:
            requests.exceptions.RequestException: If request fails after retries
        """
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        
        for attempt in range(self.max_retries + 1):
            try:
                if self.debug:
                    print(f"Making {method} request to {url}")
                    if data:
                        print(f"Payload: {json.dumps(data, indent=2)}")
                
                response = self.session.request(
                    method=method,
                    url=url,
                    json=data,
                    timeout=self.timeout
                )
                
                if self.debug:
                    print(f"Response status: {response.status_code}")
                    print(f"Response: {response.text}")
                
                response.raise_for_status()
                return response.json()
                
            except requests.exceptions.RequestException as e:
                if attempt < self.max_retries:
                    wait_time = 2 ** attempt  # Exponential backoff
                    print(f"Request failed (attempt {attempt + 1}/{self.max_retries + 1}): {e}")
                    print(f"Retrying in {wait_time} seconds...")
                    time.sleep(wait_time)
                else:
                    raise
    
    # Outbound Call Methods
    def create_outbound_test_run(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a new outbound call test run
        
        Args:
            config: Test configuration including phone numbers, test cases, etc.
            
        Returns:
            Test run details including run_id
        """
        return self._make_request('POST', '/outbound/test-runs', config)
    
    def get_outbound_test_run(self, run_id: str) -> Dict[str, Any]:
        """
        Get details of an outbound test run
        
        Args:
            run_id: The test run ID
            
        Returns:
            Test run details and status
        """
        return self._make_request('GET', f'/outbound/test-runs/{run_id}')
    
    def get_outbound_test_results(self, run_id: str) -> Dict[str, Any]:
        """
        Get results of an outbound test run
        
        Args:
            run_id: The test run ID
            
        Returns:
            Test results including transcripts and analysis
        """
        return self._make_request('GET', f'/outbound/test-runs/{run_id}/results')
    
    # Inbound Call Methods
    def create_inbound_test_run(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a new inbound call test run
        
        Args:
            config: Test configuration including agent settings, test cases, etc.
            
        Returns:
            Test run details including run_id and phone numbers to call
        """
        return self._make_request('POST', '/inbound/test-runs', config)
    
    def get_inbound_test_run(self, run_id: str) -> Dict[str, Any]:
        """
        Get details of an inbound test run
        
        Args:
            run_id: The test run ID
            
        Returns:
            Test run details and status
        """
        return self._make_request('GET', f'/inbound/test-runs/{run_id}')
    
    def get_inbound_test_results(self, run_id: str) -> Dict[str, Any]:
        """
        Get results of an inbound test run
        
        Args:
            run_id: The test run ID
            
        Returns:
            Test results including transcripts and analysis
        """
        return self._make_request('GET', f'/inbound/test-runs/{run_id}/results')
    
    # Utility Methods
    def wait_for_completion(self, run_id: str, call_type: str = 'outbound', timeout: int = 300) -> Dict[str, Any]:
        """
        Wait for a test run to complete
        
        Args:
            run_id: The test run ID
            call_type: 'outbound' or 'inbound'
            timeout: Maximum time to wait in seconds
            
        Returns:
            Final test run status
        """
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            if call_type == 'outbound':
                run_status = self.get_outbound_test_run(run_id)
            else:
                run_status = self.get_inbound_test_run(run_id)
            
            status = run_status.get('status', 'unknown')
            print(f"Test run {run_id} status: {status}")
            
            if status in ['completed', 'failed', 'cancelled']:
                return run_status
            
            time.sleep(5)  # Check every 5 seconds
        
        raise TimeoutError(f"Test run {run_id} did not complete within {timeout} seconds")
    
    def list_test_runs(self, call_type: str = 'outbound', limit: int = 10) -> List[Dict[str, Any]]:
        """
        List recent test runs
        
        Args:
            call_type: 'outbound' or 'inbound'
            limit: Number of test runs to return
            
        Returns:
            List of test run summaries
        """
        params = {'limit': limit}
        endpoint = f'/{call_type}/test-runs'
        
        return self._make_request('GET', endpoint)