#!/usr/bin/env python3
"""
Αρχείο test_api.py - Script δοκιμής API
Test script for API endpoints

Αυτό το script δοκιμάζει όλα τα βασικά API endpoints.
This script tests all the basic API endpoints.

Χρήση / Usage:
    python3 test_api.py
"""

import requests
import json
import sys

BASE_URL = "http://127.0.0.1:8000/api"

def print_test(name, success):
    """Εκτύπωση αποτελέσματος test"""
    status = "✓" if success else "✗"
    print(f"{status} {name}")

def test_api_root():
    """Δοκιμή API root endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/")
        success = response.status_code == 200
        print_test("API Root Endpoint", success)
        return success
    except Exception as e:
        print_test(f"API Root Endpoint (Error: {e})", False)
        return False

def test_movies_list():
    """Δοκιμή λίστας ταινιών"""
    try:
        response = requests.get(f"{BASE_URL}/movies/")
        success = response.status_code == 200
        print_test("Movies List Endpoint", success)
        return success
    except Exception as e:
        print_test(f"Movies List Endpoint (Error: {e})", False)
        return False

def test_create_movie():
    """Δοκιμή δημιουργίας ταινίας"""
    try:
        movie_data = {
            "title": "Test Movie",
            "description": "Δοκιμαστική ταινία",
            "duration": 120,
            "genre": "Action",
            "director": "Test Director",
            "release_year": 2024,
            "rating": 8.5
        }
        response = requests.post(
            f"{BASE_URL}/movies/",
            json=movie_data,
            headers={"Content-Type": "application/json"}
        )
        success = response.status_code in [200, 201]
        print_test("Create Movie", success)
        if success:
            return response.json().get('id')
        return None
    except Exception as e:
        print_test(f"Create Movie (Error: {e})", False)
        return None

def test_screenings():
    """Δοκιμή screenings endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/screenings/")
        success = response.status_code == 200
        print_test("Screenings Endpoint", success)
        return success
    except Exception as e:
        print_test(f"Screenings Endpoint (Error: {e})", False)
        return False

def test_bookings():
    """Δοκιμή bookings endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/bookings/")
        success = response.status_code == 200
        print_test("Bookings Endpoint", success)
        return success
    except Exception as e:
        print_test(f"Bookings Endpoint (Error: {e})", False)
        return False

def main():
    """Κύρια συνάρτηση"""
    print("=" * 50)
    print("Cinema Django Backend - API Tests")
    print("=" * 50)
    print()
    
    # Check if server is running
    try:
        requests.get(f"{BASE_URL}/", timeout=2)
    except requests.exceptions.RequestException:
        print("✗ Server is not running!")
        print("\nΠαρακαλώ ξεκινήστε το server:")
        print("python manage.py runserver")
        sys.exit(1)
    
    # Run tests
    results = []
    results.append(test_api_root())
    results.append(test_movies_list())
    movie_id = test_create_movie()
    results.append(movie_id is not None)
    results.append(test_screenings())
    results.append(test_bookings())
    
    # Summary
    print()
    print("=" * 50)
    passed = sum(results)
    total = len(results)
    print(f"Tests Passed: {passed}/{total}")
    
    if passed == total:
        print("✓ Όλα τα tests πέρασαν επιτυχώς!")
        print("✓ All tests passed successfully!")
    else:
        print("✗ Κάποια tests απέτυχαν")
        print("✗ Some tests failed")
    
    print("=" * 50)

if __name__ == "__main__":
    main()
