#!/usr/bin/env python3
"""Basic API performance benchmarks for HIVE Backend Alpha."""

import asyncio
import time
import statistics
from typing import List, Dict, Any
import httpx


class APIBenchmark:
    """Simple API benchmark runner."""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.results: Dict[str, List[float]] = {}
    
    async def benchmark_endpoint(
        self, 
        method: str, 
        endpoint: str, 
        iterations: int = 10,
        headers: Dict[str, str] = None,
        json_data: Dict[str, Any] = None
    ) -> List[float]:
        """Benchmark a single endpoint."""
        times = []
        
        async with httpx.AsyncClient() as client:
            for _ in range(iterations):
                start_time = time.time()
                
                try:
                    if method.upper() == "GET":
                        response = await client.get(
                            f"{self.base_url}{endpoint}", 
                            headers=headers
                        )
                    elif method.upper() == "POST":
                        response = await client.post(
                            f"{self.base_url}{endpoint}", 
                            headers=headers, 
                            json=json_data
                        )
                    elif method.upper() == "PUT":
                        response = await client.put(
                            f"{self.base_url}{endpoint}", 
                            headers=headers, 
                            json=json_data
                        )
                    else:
                        raise ValueError(f"Unsupported method: {method}")
                    
                    end_time = time.time()
                    
                    # Only record successful requests
                    if response.status_code < 400:
                        times.append((end_time - start_time) * 1000)  # Convert to ms
                    
                except Exception as e:
                    print(f"Request failed: {e}")
                    continue
        
        return times
    
    async def run_health_check_benchmark(self, iterations: int = 50):
        """Benchmark the health check endpoint."""
        print("Benchmarking health check endpoint...")
        times = await self.benchmark_endpoint("GET", "/health", iterations)
        self.results["health_check"] = times
        return times
    
    async def run_auth_benchmark(self, iterations: int = 20):
        """Benchmark authentication endpoints."""
        print("Benchmarking authentication endpoints...")
        
        # Register benchmark
        register_data = {
            "email": f"benchmark_user_{int(time.time())}@example.com",
            "password": "benchmarkpassword123"
        }
        
        register_times = await self.benchmark_endpoint(
            "POST", 
            "/api/v1/auth/register", 
            iterations=5,  # Fewer iterations for registration
            json_data=register_data
        )
        self.results["auth_register"] = register_times
        
        # Login benchmark (using the registered user)
        login_times = await self.benchmark_endpoint(
            "POST", 
            "/api/v1/auth/login", 
            iterations=iterations,
            json_data=register_data
        )
        self.results["auth_login"] = login_times
        
        return register_times, login_times
    
    def print_results(self):
        """Print benchmark results in a readable format."""
        print("\n" + "="*60)
        print("API BENCHMARK RESULTS")
        print("="*60)
        
        for endpoint, times in self.results.items():
            if not times:
                print(f"\n{endpoint.upper()}: No successful requests")
                continue
            
            avg_time = statistics.mean(times)
            min_time = min(times)
            max_time = max(times)
            median_time = statistics.median(times)
            
            print(f"\n{endpoint.upper()}:")
            print(f"  Requests: {len(times)}")
            print(f"  Average: {avg_time:.2f}ms")
            print(f"  Median:  {median_time:.2f}ms")
            print(f"  Min:     {min_time:.2f}ms")
            print(f"  Max:     {max_time:.2f}ms")
            
            # Performance assessment
            if avg_time < 100:
                assessment = "EXCELLENT"
            elif avg_time < 300:
                assessment = "GOOD"
            elif avg_time < 500:
                assessment = "ACCEPTABLE"
            else:
                assessment = "NEEDS IMPROVEMENT"
            
            print(f"  Assessment: {assessment}")
    
    def check_performance_targets(self) -> bool:
        """Check if performance targets are met."""
        targets = {
            "health_check": 50,  # 50ms target
            "auth_login": 300,   # 300ms target
            "auth_register": 500  # 500ms target
        }
        
        all_passed = True
        print("\n" + "="*60)
        print("PERFORMANCE TARGET VALIDATION")
        print("="*60)
        
        for endpoint, target in targets.items():
            if endpoint in self.results and self.results[endpoint]:
                avg_time = statistics.mean(self.results[endpoint])
                passed = avg_time <= target
                status = "PASS" if passed else "FAIL"
                
                print(f"{endpoint}: {avg_time:.2f}ms (target: {target}ms) - {status}")
                
                if not passed:
                    all_passed = False
            else:
                print(f"{endpoint}: NO DATA - FAIL")
                all_passed = False
        
        return all_passed


async def main():
    """Run the benchmark suite."""
    print("Starting HIVE Backend Alpha API Benchmarks...")
    print("Make sure the server is running on http://localhost:8000")
    print()
    
    benchmark = APIBenchmark()
    
    try:
        # Run benchmarks
        await benchmark.run_health_check_benchmark()
        await benchmark.run_auth_benchmark()
        
        # Print results
        benchmark.print_results()
        
        # Check performance targets
        targets_met = benchmark.check_performance_targets()
        
        print("\n" + "="*60)
        if targets_met:
            print("✅ ALL PERFORMANCE TARGETS MET")
        else:
            print("❌ SOME PERFORMANCE TARGETS NOT MET")
        print("="*60)
        
    except Exception as e:
        print(f"Benchmark failed: {e}")
        print("Make sure the HIVE backend server is running")


if __name__ == "__main__":
    asyncio.run(main())