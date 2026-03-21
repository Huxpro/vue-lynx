#!/bin/bash
# Ralph Watchdog V2 - ensures Ralph keeps running until all stories complete

RALPH_DIR=~/github/vue-lynx-vant/scripts/ralph
PRD_FILE="$RALPH_DIR/prd.json"
PROGRESS_FILE="$RALPH_DIR/progress.txt"
LOG_FILE="$RALPH_DIR/watchdog.log"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

check_and_restart() {
  # Check if all stories complete
  DONE=$(jq '[.userStories[] | select(.passes == true)] | length' "$PRD_FILE" 2>/dev/null || echo "0")
  TOTAL=$(jq '.userStories | length' "$PRD_FILE" 2>/dev/null || echo "80")
  
  if [ "$DONE" -eq "$TOTAL" ]; then
    log "✅ ALL STORIES COMPLETE ($DONE/$TOTAL)"
    exit 0
  fi
  
  # Check if Ralph is running
  if ! pgrep -f "claude.*vue-lynx-vant" > /dev/null; then
    log "⚠️ Ralph not running. Progress: $DONE/$TOTAL. Restarting..."
    
    cd ~/github/vue-lynx-vant
    nohup claude -p --dangerously-skip-permissions "
Read scripts/ralph/prd.json and scripts/ralph/CLAUDE.md for context.

This is V2 OPTIMIZATION PASS. Execute stories where passes: false, in priority order.

For EACH review story, you MUST:
1. Fetch Vant source files from GitHub (curl the .tsx and .less)
2. Create a detailed comparison table: Props, Events, Slots, States
3. Check CSS: variables, transitions, pseudo-elements, dark mode
4. Check interactions: click feedback, loading states, animations
5. Check sub-component usage: Loading, Icon integration
6. Document ALL gaps in a comment block at top of component
7. Fix critical gaps
8. Verify via browser and DevTool

Mark passes: true and commit only after ALL criteria are met.

Use lynxbase skill to query Lynx APIs.
Use Lynx DevTool CLI for iPhone Simulator testing.
Use browser tool to compare with Vant demo.
" >> "$PROGRESS_FILE" 2>&1 &
    
    log "🔄 Ralph V2 restarted (PID: $!)"
  else
    log "✓ Ralph running. Progress: $DONE/$TOTAL"
  fi
}

log "🐕 Watchdog V2 started"
while true; do
  check_and_restart
  sleep 300  # Check every 5 minutes
done
