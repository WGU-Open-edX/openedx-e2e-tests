#!/bin/bash

# Script to delete visual baseline screenshots for a specific test file
# Usage: ./scripts/reset-visual-baselines.sh <test-file-path>
# Example: ./scripts/reset-visual-baselines.sh tests/auth/login.spec.ts
# Example: ./scripts/reset-visual-baselines.sh tests/instructor-dashboard.spec.ts

if [ -z "$1" ]; then
  echo "Usage: $0 <test-file-path>"
  echo "Example: $0 tests/auth/login.spec.ts"
  exit 1
fi

# Remove .ts extension and convert to baseline path
TEST_FILE="$1"
BASELINE_PATH=$(echo "$TEST_FILE" | sed 's/^tests\///' | sed 's/\.ts$//')

echo "Resetting visual baselines for: $TEST_FILE"
echo "Baseline path: $BASELINE_PATH"

# Delete baselines for all browsers
rm -rf "tests/__visual-baselines__/chromium/${BASELINE_PATH}"
rm -rf "tests/__visual-baselines__/firefox/${BASELINE_PATH}"
rm -rf "tests/__visual-baselines__/webkit/${BASELINE_PATH}"

# Delete artifacts for all browsers
rm -rf "artifacts/visual-regression/chromium/${BASELINE_PATH}"
rm -rf "artifacts/visual-regression/firefox/${BASELINE_PATH}"
rm -rf "artifacts/visual-regression/webkit/${BASELINE_PATH}"

echo "✓ Visual baselines reset for $TEST_FILE"
echo ""
echo "Run your tests to regenerate baselines:"
echo "  npm test -- $TEST_FILE"
