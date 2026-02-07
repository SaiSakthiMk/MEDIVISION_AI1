#!/usr/bin/env python3

import requests
import sys
import json
import base64
import io
from datetime import datetime
from PIL import Image

class MediVisionAPITester:
    def __init__(self, base_url="https://medivision-ai.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'
        
        if files:
            # Remove Content-Type for multipart/form-data
            headers.pop('Content-Type', None)

        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                if files:
                    response = requests.post(url, data=data, files=files, headers=headers, timeout=60)
                else:
                    response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)

            print(f"   Status: {response.status_code}")
            
            success = response.status_code == expected_status
            response_data = {}
            
            if success:
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                except:
                    response_data = {"raw": response.text[:200]}
            else:
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text[:200]}")

            self.log_test(name, success, f"Status {response.status_code}, Expected {expected_status}")
            return success, response_data

        except Exception as e:
            print(f"   Exception: {str(e)}")
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, {}

    def create_test_image(self):
        """Create a test medical image (simulated X-ray)"""
        # Create a simple test image that looks like a medical scan
        img = Image.new('RGB', (512, 512), color='black')
        pixels = img.load()
        
        # Add some medical-like features
        for i in range(512):
            for j in range(512):
                # Create a chest-like outline
                center_x, center_y = 256, 256
                dist = ((i - center_x) ** 2 + (j - center_y) ** 2) ** 0.5
                
                if 100 < dist < 200:
                    # Rib-like structures
                    if (i + j) % 40 < 5:
                        pixels[i, j] = (200, 200, 200)
                    else:
                        pixels[i, j] = (50, 50, 50)
                elif dist < 100:
                    # Heart/lung area
                    pixels[i, j] = (80, 80, 80)
                else:
                    # Background
                    pixels[i, j] = (20, 20, 20)
        
        # Convert to bytes
        buffer = io.BytesIO()
        img.save(buffer, format='JPEG', quality=85)
        return buffer.getvalue()

    def test_health_check(self):
        """Test health endpoints"""
        self.run_test("Health Check", "GET", "", 200)
        self.run_test("Health Endpoint", "GET", "health", 200)

    def test_user_registration(self):
        """Test user registration"""
        timestamp = datetime.now().strftime("%H%M%S")
        test_user_data = {
            "name": f"Test Doctor {timestamp}",
            "email": f"testdoctor{timestamp}@example.com",
            "password": "TestPass123!"
        }
        self.test_email = test_user_data["email"]  # Store for login test
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=test_user_data
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_id = response['user']['id']
            print(f"   Token obtained: {self.token[:20]}...")
            return True
        return False

    def test_user_login(self):
        """Test user login with existing credentials"""
        if not hasattr(self, 'test_email'):
            print("⚠️  Skipping login test - no registered user")
            return False
            
        login_data = {
            "email": self.test_email,
            "password": "TestPass123!"
        }
        
        success, response = self.run_test(
            "User Login",
            "POST", 
            "auth/login",
            200,
            data=login_data
        )
        
        return success and 'access_token' in response

    def test_get_user_profile(self):
        """Test getting current user profile"""
        if not self.token:
            print("⚠️  Skipping profile test - no auth token")
            return False
            
        success, response = self.run_test(
            "Get User Profile",
            "GET",
            "auth/me", 
            200
        )
        
        return success and 'email' in response

    def test_medical_image_upload(self):
        """Test medical image upload and analysis"""
        if not self.token:
            print("⚠️  Skipping image upload test - no auth token")
            return False
        
        # Create test image
        image_bytes = self.create_test_image()
        
        # Prepare multipart form data
        files = {
            'file': ('test_xray.jpg', image_bytes, 'image/jpeg')
        }
        data = {
            'scan_type': 'xray'
        }
        
        success, response = self.run_test(
            "Medical Image Upload & Analysis",
            "POST",
            "process-medical-image",
            200,
            data=data,
            files=files
        )
        
        if success and 'id' in response:
            self.scan_id = response['id']
            print(f"   Scan ID: {self.scan_id}")
            
            # Check if analysis completed
            if response.get('status') == 'completed':
                print("   ✅ AI Analysis completed successfully")
                if response.get('doctor_view') and response.get('patient_view'):
                    print("   ✅ Both Doctor and Patient views generated")
                else:
                    print("   ⚠️  Missing doctor or patient view")
            elif response.get('status') == 'processing':
                print("   ⏳ Analysis still processing")
            else:
                print(f"   ❌ Analysis failed with status: {response.get('status')}")
            
            return True
        return False

    def test_scan_history(self):
        """Test getting scan history"""
        if not self.token:
            print("⚠️  Skipping scan history test - no auth token")
            return False
            
        success, response = self.run_test(
            "Get Scan History",
            "GET",
            "scans",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   Found {len(response)} scans")
            return True
        return False

    def test_scan_details(self):
        """Test getting individual scan details"""
        if not self.token or not hasattr(self, 'scan_id'):
            print("⚠️  Skipping scan details test - no scan ID")
            return False
            
        success, response = self.run_test(
            "Get Scan Details",
            "GET",
            f"scans/{self.scan_id}",
            200
        )
        
        return success and 'id' in response

    def test_user_stats(self):
        """Test getting user statistics"""
        if not self.token:
            print("⚠️  Skipping stats test - no auth token")
            return False
            
        success, response = self.run_test(
            "Get User Stats",
            "GET",
            "stats",
            200
        )
        
        return success and 'total_scans' in response

    def run_all_tests(self):
        """Run all backend tests"""
        print("🏥 Starting MediVision AI Backend Tests")
        print("=" * 50)
        
        # Test sequence
        self.test_health_check()
        
        if self.test_user_registration():
            self.test_get_user_profile()
            self.test_medical_image_upload()
            self.test_scan_history()
            self.test_scan_details()
            self.test_user_stats()
        
        # Print summary
        print("\n" + "=" * 50)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All backend tests passed!")
            return 0
        else:
            print("❌ Some backend tests failed")
            return 1

def main():
    tester = MediVisionAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())