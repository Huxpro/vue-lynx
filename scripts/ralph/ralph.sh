#!/usr/bin/env bash
# Ralph Wiggum - Long-running AI agent loop
# Source of truth for repo-local copies in scripts/ralph/ralph.sh

set -euo pipefail

TOOL="amp"
MAX_ITERATIONS=10

print_usage() {
  cat <<'EOF'
Usage: ralph.sh [--tool amp|claude|codex|trae] [max_iterations]

Examples:
  ./scripts/ralph/ralph.sh --tool codex 20
  /Users/bytedance/bin/ralph --tool claude 5

Notes:
  - When run from a global install, Ralph discovers the target repo by searching
    upward from the current working directory for scripts/ralph/.
  - Passing 0 iterations validates arguments and resolved paths without running
    the selected tool.
EOF
}

find_ralph_dir_from_pwd() {
  local search_dir candidate
  search_dir="$PWD"

  while true; do
    candidate="$search_dir/scripts/ralph"
    if [ -d "$candidate" ] && {
      [ -f "$candidate/prd.json" ] ||
      [ -f "$candidate/CLAUDE.md" ] ||
      [ -f "$candidate/prompt.md" ];
    }; then
      printf '%s\n' "$candidate"
      return 0
    fi

    if [ "$search_dir" = "/" ]; then
      return 1
    fi

    search_dir="$(dirname "$search_dir")"
  done
}

resolve_ralph_dir() {
  local script_dir
  script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

  if [ -f "$script_dir/prd.json" ] || [ -f "$script_dir/CLAUDE.md" ] || [ -f "$script_dir/prompt.md" ]; then
    printf '%s\n' "$script_dir"
    return 0
  fi

  find_ralph_dir_from_pwd
}

resolve_prompt_file() {
  local tool="$1"
  local ralph_dir="$2"
  local -a candidates

  case "$tool" in
    amp)
      candidates=("prompt.md" "CLAUDE.md")
      ;;
    claude|codex|trae)
      candidates=("CLAUDE.md" "prompt.md")
      ;;
    *)
      echo "Error: Unsupported tool '$tool'." >&2
      exit 1
      ;;
  esac

  local candidate
  for candidate in "${candidates[@]}"; do
    if [ -f "$ralph_dir/$candidate" ]; then
      printf '%s\n' "$ralph_dir/$candidate"
      return 0
    fi
  done

  echo "Error: No prompt file found in $ralph_dir. Checked: ${candidates[*]}." >&2
  exit 1
}

run_selected_tool() {
  local output_file exit_code
  output_file="$(mktemp "${TMPDIR:-/tmp}/ralph-output.XXXXXX")"

  set +e
  case "$TOOL" in
    amp)
      amp --dangerously-allow-all < "$PROMPT_FILE" 2>&1 | tee "$output_file"
      exit_code=${PIPESTATUS[0]}
      ;;
    claude)
      claude --dangerously-skip-permissions --print < "$PROMPT_FILE" 2>&1 | tee "$output_file"
      exit_code=${PIPESTATUS[0]}
      ;;
    codex)
      codex exec --dangerously-bypass-approvals-and-sandbox -C "$REPO_DIR" - < "$PROMPT_FILE" 2>&1 | tee "$output_file"
      exit_code=${PIPESTATUS[0]}
      ;;
    trae)
      traecli -p -y "$(cat "$PROMPT_FILE")" 2>&1 | tee "$output_file"
      exit_code=${PIPESTATUS[0]}
      ;;
  esac
  set -e

  OUTPUT="$(cat "$output_file")"
  rm -f "$output_file"
  return "$exit_code"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --tool)
      if [[ $# -lt 2 ]]; then
        echo "Error: --tool requires a value." >&2
        exit 1
      fi
      TOOL="$2"
      shift 2
      ;;
    --tool=*)
      TOOL="${1#*=}"
      shift
      ;;
    -h|--help)
      print_usage
      exit 0
      ;;
    *)
      if [[ "$1" =~ ^[0-9]+$ ]]; then
        MAX_ITERATIONS="$1"
      else
        echo "Error: Unknown argument '$1'." >&2
        print_usage
        exit 1
      fi
      shift
      ;;
  esac
done

if [[ "$TOOL" != "amp" && "$TOOL" != "claude" && "$TOOL" != "codex" && "$TOOL" != "trae" ]]; then
  echo "Error: Invalid tool '$TOOL'. Must be 'amp', 'claude', 'codex', or 'trae'." >&2
  exit 1
fi

RALPH_DIR="$(resolve_ralph_dir)" || {
  echo "Error: Could not locate scripts/ralph from $(pwd)." >&2
  exit 1
}
REPO_DIR="$(cd "$RALPH_DIR/../.." && pwd)"
PRD_FILE="$RALPH_DIR/prd.json"
PROGRESS_FILE="$RALPH_DIR/progress.txt"
ARCHIVE_DIR="$RALPH_DIR/archive"
LAST_BRANCH_FILE="$RALPH_DIR/.last-branch"
PROMPT_FILE="$(resolve_prompt_file "$TOOL" "$RALPH_DIR")"

if [ ! -f "$PRD_FILE" ]; then
  echo "Error: Missing PRD file at $PRD_FILE." >&2
  exit 1
fi

# Archive previous run if branch changed.
if [ -f "$LAST_BRANCH_FILE" ]; then
  CURRENT_BRANCH="$(jq -r '.branchName // empty' "$PRD_FILE" 2>/dev/null || echo "")"
  LAST_BRANCH="$(cat "$LAST_BRANCH_FILE" 2>/dev/null || echo "")"

  if [ -n "$CURRENT_BRANCH" ] && [ -n "$LAST_BRANCH" ] && [ "$CURRENT_BRANCH" != "$LAST_BRANCH" ]; then
    DATE="$(date +%Y-%m-%d)"
    FOLDER_NAME="$(echo "$LAST_BRANCH" | sed 's|^ralph/||')"
    ARCHIVE_FOLDER="$ARCHIVE_DIR/$DATE-$FOLDER_NAME"

    echo "Archiving previous run: $LAST_BRANCH"
    mkdir -p "$ARCHIVE_FOLDER"
    [ -f "$PRD_FILE" ] && cp "$PRD_FILE" "$ARCHIVE_FOLDER/"
    [ -f "$PROGRESS_FILE" ] && cp "$PROGRESS_FILE" "$ARCHIVE_FOLDER/"
    echo "   Archived to: $ARCHIVE_FOLDER"

    echo "# Ralph Progress Log" > "$PROGRESS_FILE"
    echo "Started: $(date)" >> "$PROGRESS_FILE"
    echo "---" >> "$PROGRESS_FILE"
  fi
fi

# Track current branch.
CURRENT_BRANCH="$(jq -r '.branchName // empty' "$PRD_FILE" 2>/dev/null || echo "")"
if [ -n "$CURRENT_BRANCH" ]; then
  echo "$CURRENT_BRANCH" > "$LAST_BRANCH_FILE"
fi

# Initialize progress file if it doesn't exist.
if [ ! -f "$PROGRESS_FILE" ]; then
  echo "# Ralph Progress Log" > "$PROGRESS_FILE"
  echo "Started: $(date)" >> "$PROGRESS_FILE"
  echo "---" >> "$PROGRESS_FILE"
fi

cd "$REPO_DIR"

echo "Starting Ralph - Repo: $REPO_DIR - Tool: $TOOL - Max iterations: $MAX_ITERATIONS"
echo "Using Ralph dir: $RALPH_DIR"
echo "Using prompt file: $PROMPT_FILE"

if [ "$MAX_ITERATIONS" -eq 0 ]; then
  echo "Argument validation successful."
  exit 0
fi

for ((i = 1; i <= MAX_ITERATIONS; i++)); do
  echo ""
  echo "==============================================================="
  echo "  Ralph Iteration $i of $MAX_ITERATIONS ($TOOL)"
  echo "==============================================================="

  OUTPUT=""
  run_selected_tool || true

  if echo "$OUTPUT" | grep -q "<promise>COMPLETE</promise>"; then
    echo ""
    echo "Ralph completed all tasks!"
    echo "Completed at iteration $i of $MAX_ITERATIONS"
    exit 0
  fi

  echo "Iteration $i complete. Continuing..."
  sleep 2
done

echo ""
echo "Ralph reached max iterations ($MAX_ITERATIONS) without completing all tasks."
echo "Check $PROGRESS_FILE for status."
exit 1
