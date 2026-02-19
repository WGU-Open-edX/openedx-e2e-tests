#!/bin/bash

# Course Tests Execution Script
# This script runs course tests in the correct order to maintain dependencies

set -e  # Exit on any error

echo "🎯 Running Course Tests in Sequential Order..."
echo "================================================"

# Define test files in dependency order
TESTS=(
  "tests/courses/create-course.spec.ts"
  "tests/courses/add-section-course.spec.ts" 
  "tests/courses/add-unit.spec.ts"
  "tests/courses/checklist-course.spec.ts"
  "tests/courses/export-course.spec.ts"
  "tests/courses/import-course.spec.ts"
)

# Project to run tests on (you can modify this)
PROJECT=${1:-"chromium"}

echo "📋 Test execution plan:"
for i in "${!TESTS[@]}"; do
  echo "  $((i+1)). ${TESTS[$i]}"
done
echo ""

# Run each test in sequence
for i in "${!TESTS[@]}"; do
  test_file="${TESTS[$i]}"
  step_num=$((i+1))
  
  echo "🚀 Step $step_num: Running $test_file"
  echo "----------------------------------------"
  
  # Run the test
  if npx playwright test "$test_file" --project="$PROJECT"; then
    echo "✅ Step $step_num completed successfully"
  else
    echo "❌ Step $step_num failed"
    echo "💥 Course test workflow stopped due to failure in: $test_file"
    exit 1
  fi
  
  echo ""
done

echo "🎉 All course tests completed successfully!"
echo "==========================================="