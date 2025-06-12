#!/usr/bin/env python3
"""Run the test suite with various options."""

import subprocess
import sys
import argparse
from pathlib import Path

# Add the project root to Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))


def run_tests(
    test_path: str = "tests/",
    verbose: bool = False,
    coverage: bool = False,
    unit_only: bool = False,
    integration_only: bool = False,
    performance: bool = False,
    security: bool = False
):
    """Run tests with specified options."""
    cmd = ["pytest"]
    
    # Add verbosity
    if verbose:
        cmd.append("-v")
    
    # Add coverage
    if coverage:
        cmd.extend(["--cov=app", "--cov-report=html", "--cov-report=term"])
    
    # Determine test path
    if unit_only:
        test_path = "tests/unit/"
    elif integration_only:
        test_path = "tests/integration/"
    elif performance:
        test_path = "tests/performance/"
    elif security:
        test_path = "tests/security/"
    
    cmd.append(test_path)
    
    try:
        print(f"Running command: {' '.join(cmd)}")
        result = subprocess.run(cmd, check=True)
        print("Tests completed successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"Tests failed with exit code: {e.returncode}")
        return False


def main():
    parser = argparse.ArgumentParser(description="Run HIVE backend tests")
    parser.add_argument("--verbose", "-v", action="store_true", help="Verbose output")
    parser.add_argument("--coverage", "-c", action="store_true", help="Run with coverage")
    parser.add_argument("--unit", action="store_true", help="Run only unit tests")
    parser.add_argument("--integration", action="store_true", help="Run only integration tests")
    parser.add_argument("--performance", action="store_true", help="Run performance tests")
    parser.add_argument("--security", action="store_true", help="Run security tests")
    parser.add_argument("path", nargs="?", default="tests/", help="Test path to run")
    
    args = parser.parse_args()
    
    success = run_tests(
        test_path=args.path,
        verbose=args.verbose,
        coverage=args.coverage,
        unit_only=args.unit,
        integration_only=args.integration,
        performance=args.performance,
        security=args.security
    )
    
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()