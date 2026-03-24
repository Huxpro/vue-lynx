#!/bin/bash
# Install dependencies quickly
pnpm install --no-frozen-lockfile > /dev/null 2>&1

cd examples/vant-lynx
# Start dev server
pnpm dev:web > dev.log 2>&1 &
DEV_PID=$!

# Wait for dev server to be ready
echo "Waiting for build..."
for i in {1..30}; do
  if grep -q "ready.*built" dev.log; then
    break
  fi
  sleep 1
done

# Run preview test
echo "Running preview test..."
node ../../test-preview.cjs > output.log 2>&1

# Stop dev server
kill -9 $DEV_PID || true
pkill -f rspeedy || true
kill -9 $(lsof -t -i:3000) 2>/dev/null || true

if grep -q "RESULT: OK" output.log; then
  echo "Commit is GOOD"
  exit 0
else
  echo "Commit is BAD"
  cat output.log
  exit 1
fi
