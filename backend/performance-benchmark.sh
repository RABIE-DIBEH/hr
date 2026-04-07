#!/bin/bash

# Performance Benchmark Script for HRMS Backend
# Tests API response times and identifies slow endpoints

set -e

API_BASE="http://localhost:8080/api"
LOG_FILE="performance-benchmark-$(date +%Y%m%d-%H%M%S).log"
WARMUP_REQUESTS=10
TEST_REQUESTS=100
SLOW_THRESHOLD_MS=200  # 200ms threshold for slow endpoints

echo "HRMS Backend Performance Benchmark" | tee "$LOG_FILE"
echo "===================================" | tee -a "$LOG_FILE"
echo "Date: $(date)" | tee -a "$LOG_FILE"
echo "Warmup requests: $WARMUP_REQUESTS" | tee -a "$LOG_FILE"
echo "Test requests: $TEST_REQUESTS" | tee -a "$LOG_FILE"
echo "Slow threshold: ${SLOW_THRESHOLD_MS}ms" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# Check if backend is running
echo "Checking if backend is running..." | tee -a "$LOG_FILE"
if ! curl -s --max-time 5 "$API_BASE/health" > /dev/null; then
    echo "ERROR: Backend is not running at $API_BASE" | tee -a "$LOG_FILE"
    echo "Start the backend with: cd backend && mvn spring-boot:run" | tee -a "$LOG_FILE"
    exit 1
fi

echo "Backend is running. Starting benchmarks..." | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# Function to benchmark an endpoint
benchmark_endpoint() {
    local endpoint=$1
    local method=${2:-GET}
    local data=${3:-""}
    
    echo "Benchmarking: $method $endpoint" | tee -a "$LOG_FILE"
    
    # Warmup
    for i in $(seq 1 $WARMUP_REQUESTS); do
        if [ "$method" = "POST" ] && [ -n "$data" ]; then
            curl -s -X POST -H "Content-Type: application/json" -d "$data" "$API_BASE$endpoint" > /dev/null
        else
            curl -s "$API_BASE$endpoint" > /dev/null
        fi
    done
    
    # Actual benchmark
    local total_time=0
    local min_time=999999
    local max_time=0
    local slow_count=0
    
    for i in $(seq 1 $TEST_REQUESTS); do
        local start_time=$(date +%s%3N)
        
        if [ "$method" = "POST" ] && [ -n "$data" ]; then
            curl -s -X POST -H "Content-Type: application/json" -d "$data" "$API_BASE$endpoint" > /dev/null
        else
            curl -s "$API_BASE$endpoint" > /dev/null
        fi
        
        local end_time=$(date +%s%3N)
        local duration=$((end_time - start_time))
        
        total_time=$((total_time + duration))
        
        if [ $duration -lt $min_time ]; then
            min_time=$duration
        fi
        
        if [ $duration -gt $max_time ]; then
            max_time=$duration
        fi
        
        if [ $duration -gt $SLOW_THRESHOLD_MS ]; then
            slow_count=$((slow_count + 1))
        fi
        
        # Small delay between requests
        sleep 0.01
    done
    
    local avg_time=$((total_time / TEST_REQUESTS))
    local slow_percentage=$((slow_count * 100 / TEST_REQUESTS))
    
    echo "  Average: ${avg_time}ms" | tee -a "$LOG_FILE"
    echo "  Min: ${min_time}ms, Max: ${max_time}ms" | tee -a "$LOG_FILE"
    echo "  Slow responses (>${SLOW_THRESHOLD_MS}ms): ${slow_count}/${TEST_REQUESTS} (${slow_percentage}%)" | tee -a "$LOG_FILE"
    
    if [ $slow_percentage -gt 10 ]; then
        echo "  ⚠️  WARNING: More than 10% of responses are slow!" | tee -a "$LOG_FILE"
    fi
    
    echo "" | tee -a "$LOG_FILE"
}

# Benchmark public endpoints
benchmark_endpoint "/health"

# Note: For authenticated endpoints, we would need to:
# 1. First login to get a JWT token
# 2. Use the token in Authorization header
# Since this is a simple benchmark script, we only test public endpoints

echo "Benchmark complete!" | tee -a "$LOG_FILE"
echo "Results saved to: $LOG_FILE" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# Summary
echo "Performance Summary:" | tee -a "$LOG_FILE"
echo "===================" | tee -a "$LOG_FILE"
grep -A3 "Benchmarking:" "$LOG_FILE" | tee -a "$LOG_FILE"

# Check for any warnings
if grep -q "WARNING" "$LOG_FILE"; then
    echo "" | tee -a "$LOG_FILE"
    echo "⚠️  Performance warnings detected!" | tee -a "$LOG_FILE"
    grep "WARNING" "$LOG_FILE" | tee -a "$LOG_FILE"
fi