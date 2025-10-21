#!/usr/bin/env python3
"""
Simple test runner script for CampusEats application
"""
import subprocess
import sys
import os
from pathlib import Path

def run_tests():
    """Run all tests with coverage reporting"""
    print("🧪 Running CampusEats Test Suite")
    print("=" * 50)
    
    # Change to project directory (go up one level from scripts/)
    project_dir = Path(__file__).parent.parent
    os.chdir(project_dir)
    
    # Test commands
    test_commands = [
        # Run all tests with coverage
        ["python", "-m", "pytest", "src/tests/", "-v", "--cov=src/app", "--cov-report=html", "--cov-report=term-missing"],
        
        # Run tests by scenario (without markers)
        ["python", "-m", "pytest", "src/tests/test_scenario_1.py", "-v"],
        ["python", "-m", "pytest", "src/tests/test_scenario_2.py", "-v"],
        ["python", "-m", "pytest", "src/tests/test_scenario_3.py", "-v"],
        ["python", "-m", "pytest", "src/tests/test_scenario_4.py", "-v"],
    ]
    
    results = []
    
    for i, cmd in enumerate(test_commands):
        print(f"\n📋 Running Test Command {i+1}: {' '.join(cmd)}")
        print("-" * 50)
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
            results.append({
                'command': ' '.join(cmd),
                'returncode': result.returncode,
                'stdout': result.stdout,
                'stderr': result.stderr
            })
            
            if result.returncode == 0:
                print("✅ Test passed successfully!")
            else:
                print("❌ Test failed!")
                print(f"STDOUT: {result.stdout}")
                print(f"STDERR: {result.stderr}")
                
        except subprocess.TimeoutExpired:
            print("⏰ Test timed out!")
            results.append({
                'command': ' '.join(cmd),
                'returncode': -1,
                'stdout': '',
                'stderr': 'Test timed out'
            })
        except Exception as e:
            print(f"💥 Error running test: {e}")
            results.append({
                'command': ' '.join(cmd),
                'returncode': -1,
                'stdout': '',
                'stderr': str(e)
            })
    
    # Summary
    print("\n📊 Test Results Summary")
    print("=" * 50)
    
    passed = sum(1 for r in results if r['returncode'] == 0)
    total = len(results)
    
    print(f"Total Tests: {total}")
    print(f"Passed: {passed}")
    print(f"Failed: {total - passed}")
    print(f"Success Rate: {(passed/total)*100:.1f}%")
    
    # Show coverage report if available
    coverage_file = project_dir / "htmlcov" / "index.html"
    if coverage_file.exists():
        print(f"\n📈 Coverage Report: {coverage_file}")
    
    return passed == total

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
