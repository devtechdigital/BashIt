# Lesson 12: Real-World Scripting

**Time: ~30 minutes**

---

## Putting It All Together

You've learned the individual tools. Now it's time to use them together the way professionals do — with error handling, debugging, good practices, and real-world patterns.

This final lesson covers the things that separate a quick hack from a reliable script: handling failure, making scripts debuggable, writing defensively, and building something complete.

---

## Error Handling

### The Problem with Ignoring Errors

By default, bash keeps running even when a command fails:

```bash
cd /nonexistent/directory       # fails silently
rm important_file.txt           # this still runs — in whatever directory you're actually in
```

This is dangerous. A failed `cd` means subsequent commands run in the wrong place. This has caused real-world data loss.

### `set -e` — Exit on Error

```bash
#!/bin/bash
set -e

cd /nonexistent/directory       # script stops here
echo "This never runs"
```

With `set -e`, the script exits immediately when any command returns a non-zero exit code. This is the single most important line you can add to a script.

### `set -u` — Error on Undefined Variables

```bash
#!/bin/bash
set -u

echo "$UNDEFINED_VARIABLE"     # script stops here with an error
```

Without `set -u`, undefined variables silently expand to empty strings. With it, you catch typos and missing configuration immediately.

### `set -o pipefail` — Catch Pipe Failures

Normally, a pipeline's exit code is the exit code of the *last* command. This hides failures:

```bash
false | true                    # exit code is 0 (true succeeded)
```

With `pipefail`:
```bash
set -o pipefail
false | true                    # exit code is 1 (false failed)
```

### The Standard Safety Header

Put this at the top of every serious script:

```bash
#!/bin/bash
set -euo pipefail
```

This single line catches the three most common classes of silent failures. Some people add `set -x` during development for debugging (covered next).

### Handling Expected Failures

`set -e` is aggressive — sometimes commands *should* be allowed to fail:

```bash
# Method 1: Use || true to explicitly allow failure
grep "PATTERN" file.txt || true

# Method 2: Use an if statement
if ! grep -q "PATTERN" file.txt; then
    echo "Pattern not found, continuing anyway."
fi

# Method 3: Temporarily disable set -e
set +e
risky_command
result=$?
set -e
if [ $result -ne 0 ]; then
    echo "Command failed with code $result"
fi
```

---

## Debugging

### `set -x` — Trace Execution

```bash
#!/bin/bash
set -x

name="Kevin"
echo "Hello, $name"
```

Output:
```
+ name=Kevin
+ echo 'Hello, Kevin'
Hello, Kevin
```

Lines prefixed with `+` show exactly what bash is executing, with all variables expanded. This is invaluable for understanding why a script isn't doing what you expect.

You can turn tracing on and off within a script:

```bash
set -x          # start tracing
problematic_section
set +x          # stop tracing
```

### Debug a Script Without Editing It

```bash
bash -x myscript.sh            # run with tracing without modifying the file
```

### Logging for Debugging

Build a simple logging function into your scripts:

```bash
readonly LOG_FILE="/tmp/myscript.log"

log() {
    local level="$1"
    shift
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [$level] $*" | tee -a "$LOG_FILE"
}

log "INFO" "Script started"
log "DEBUG" "Processing file: $filename"
log "ERROR" "Failed to connect to database"
```

`tee -a` prints to the screen and appends to the log file simultaneously.

---

## Defensive Scripting Patterns

### Trap — Cleanup on Exit

`trap` lets you run code when your script exits, whether normally or due to an error:

```bash
#!/bin/bash
set -euo pipefail

TEMP_DIR=$(mktemp -d)
trap 'rm -rf "$TEMP_DIR"' EXIT

# Use TEMP_DIR freely — it gets cleaned up no matter what
cp important_file.txt "$TEMP_DIR/"
cd "$TEMP_DIR"
# ... do work ...
```

The `trap '...' EXIT` ensures the cleanup command runs when the script exits for any reason — success, failure, or `Ctrl + C`. This prevents temp files from accumulating.

Other signals you can trap:

```bash
trap 'echo "Interrupted!"; exit 1' INT          # Ctrl+C
trap 'echo "Terminated!"; exit 1' TERM           # kill signal
trap 'cleanup_function' EXIT                      # any exit
```

### Checking Dependencies

```bash
require_command() {
    if ! command -v "$1" > /dev/null 2>&1; then
        echo "Error: Required command '$1' not found." >&2
        exit 1
    fi
}

require_command git
require_command docker
require_command jq
```

Put this near the top of scripts that depend on external tools.

### Safe Temporary Files

```bash
TEMP_FILE=$(mktemp)            # creates /tmp/tmp.XXXXXXXXXX
TEMP_DIR=$(mktemp -d)          # creates a temporary directory

trap 'rm -rf "$TEMP_FILE" "$TEMP_DIR"' EXIT
```

Never hardcode temp file paths like `/tmp/myscript.tmp` — if two instances run simultaneously, they'll conflict. `mktemp` generates unique names.

### Confirming Dangerous Operations

```bash
confirm() {
    local message="${1:-Are you sure?}"
    read -p "$message [y/N]: " response
    [[ "$response" =~ ^[Yy]$ ]]
}

if confirm "Delete all log files?"; then
    rm -f *.log
    echo "Deleted."
else
    echo "Cancelled."
fi
```

The `[y/N]` convention means the default (if you just press Enter) is No. Capital letter indicates the default.

---

## Best Practices Checklist

These are habits that will serve you well in every script you write.

**Always include the safety header:**
```bash
#!/bin/bash
set -euo pipefail
```

**Quote all variable expansions:**
```bash
cp "$source" "$destination"    # always quote
```

**Use `readonly` for constants:**
```bash
readonly CONFIG_DIR="/etc/myapp"
readonly MAX_RETRIES=5
```

**Use `local` in functions:**
```bash
process_file() {
    local filename="$1"
    local output
    # ...
}
```

**Provide usage information:**
```bash
usage() {
    cat << EOF
Usage: $(basename "$0") [OPTIONS] <filename>

Options:
    -v, --verbose    Enable verbose output
    -d, --dry-run    Show what would be done without doing it
    -h, --help       Show this help message

Examples:
    $(basename "$0") data.csv
    $(basename "$0") -v --dry-run report.txt
EOF
    exit "${1:-0}"
}
```

**Parse options properly:**
```bash
VERBOSE=false
DRY_RUN=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        -v|--verbose) VERBOSE=true; shift ;;
        -d|--dry-run) DRY_RUN=true; shift ;;
        -h|--help) usage 0 ;;
        -*) echo "Unknown option: $1" >&2; usage 1 ;;
        *) break ;;
    esac
done

if [[ $# -eq 0 ]]; then
    echo "Error: filename required." >&2
    usage 1
fi

filename="$1"
```

---

## A Complete Project: Log Analyser

Let's build a real script that incorporates everything from this course. This script analyses a web server access log and produces a summary report.

```bash
#!/bin/bash
set -euo pipefail

#
# log-analyser.sh — Analyse web server access logs
# Usage: ./log-analyser.sh [-n TOP_N] [-o OUTPUT] <logfile>
#

# --- Configuration ---
readonly DEFAULT_TOP_N=10
readonly SCRIPT_NAME=$(basename "$0")

# --- Functions ---

usage() {
    cat << EOF
Usage: $SCRIPT_NAME [-n TOP_N] [-o OUTPUT] <logfile>

Analyse a web server access log and produce a summary report.

Options:
    -n NUM      Number of top results to show (default: $DEFAULT_TOP_N)
    -o FILE     Write report to file instead of stdout
    -h          Show this help message

Examples:
    $SCRIPT_NAME access.log
    $SCRIPT_NAME -n 5 -o report.txt access.log
EOF
    exit "${1:-0}"
}

log_info() {
    echo "[INFO] $*" >&2
}

check_file() {
    local file="$1"
    if [[ ! -f "$file" ]]; then
        echo "Error: File '$file' not found." >&2
        exit 1
    fi
    if [[ ! -r "$file" ]]; then
        echo "Error: File '$file' is not readable." >&2
        exit 1
    fi
}

generate_report() {
    local logfile="$1"
    local top_n="$2"
    local total_requests
    local unique_ips

    total_requests=$(wc -l < "$logfile")
    unique_ips=$(awk '{print $1}' "$logfile" | sort -u | wc -l)

    cat << EOF
============================================
  ACCESS LOG ANALYSIS REPORT
  Generated: $(date '+%Y-%m-%d %H:%M:%S')
  Log file:  $logfile
============================================

OVERVIEW
  Total requests:  $total_requests
  Unique IPs:      $unique_ips

TOP $top_n IP ADDRESSES BY REQUEST COUNT
$(awk '{print $1}' "$logfile" | sort | uniq -c | sort -rn | head -"$top_n" | awk '{printf "  %-18s %s requests\n", $2, $1}')

HTTP STATUS CODE BREAKDOWN
$(awk '{print $9}' "$logfile" | sort | uniq -c | sort -rn | awk '{printf "  %-6s %s responses\n", $2, $1}')

TOP $top_n REQUESTED PAGES
$(awk '{print $7}' "$logfile" | sort | uniq -c | sort -rn | head -"$top_n" | awk '{printf "  %-30s %s hits\n", $2, $1}')

ERRORS (4xx and 5xx responses)
$(awk '$9 >= 400 {printf "  %-18s %-8s %s\n", $1, $9, $7}' "$logfile" | head -20)

============================================
  End of report
============================================
EOF
}

# --- Main ---

main() {
    local top_n=$DEFAULT_TOP_N
    local output_file=""

    # Parse options
    while [[ $# -gt 0 ]]; do
        case "$1" in
            -n) top_n="$2"; shift 2 ;;
            -o) output_file="$2"; shift 2 ;;
            -h) usage 0 ;;
            -*) echo "Unknown option: $1" >&2; usage 1 ;;
            *)  break ;;
        esac
    done

    # Validate arguments
    if [[ $# -eq 0 ]]; then
        echo "Error: Log file required." >&2
        usage 1
    fi

    local logfile="$1"
    check_file "$logfile"

    log_info "Analysing $logfile (top $top_n results)..."

    # Generate report
    if [[ -n "$output_file" ]]; then
        generate_report "$logfile" "$top_n" > "$output_file"
        log_info "Report written to: $output_file"
    else
        generate_report "$logfile" "$top_n"
    fi

    log_info "Done."
}

main "$@"
```

Test it with the access log from Lesson 10:

```bash
chmod +x log-analyser.sh
./log-analyser.sh ../lesson10/access.log
./log-analyser.sh -n 3 -o report.txt ../lesson10/access.log
```

---

## Where to Go from Here

You now have a solid foundation. Here's how to keep building:

**Practice daily.** Use the terminal for things you'd normally do with a GUI. The more you use it, the faster you get.

**Read other people's scripts.** Look at the scripts in `/etc/init.d/` on a Linux system, or browse shell scripts on GitHub. Reading good code teaches you patterns you won't learn from tutorials.

**Build tools for yourself.** Automate your own workflows: project setup scripts, deployment helpers, backup routines, data processing pipelines. The best way to learn is to solve your own problems.

**Explore deeper topics when you need them:**
- **Regular expressions** — more powerful pattern matching
- **`jq`** — command-line JSON processor (essential for working with APIs)
- **`curl` and `wget`** — HTTP requests from the command line
- **`ssh` and `scp`** — remote server management
- **`make`** — build automation
- **`docker`** — containerisation (heavily uses bash)

**Know when bash isn't the right tool.** Bash is excellent for gluing commands together, automating system tasks, and quick data processing. For complex data structures, serious error handling, or anything over a few hundred lines, consider Python. The best developers know when to use each tool.

---

## Try It Yourself — Final Exercises

1. Take the log analyser script above, save it, and run it. Read through the code and make sure you understand every line. Modify it to add a new section — perhaps showing requests by hour of day.

2. Write a project initialisation script that creates a directory structure, initialises a git repo, creates a `.gitignore`, and generates a `README.md` with the project name and current date. Accept the project name as an argument.

3. Write a system health check script that reports: disk usage, memory usage, top 5 CPU-consuming processes, and network connectivity (ping a known host). Format the output as a clean report. Add an option to save to a file or send to stdout.

4. Write a file organiser script that takes a directory of mixed files and sorts them into subdirectories by extension (e.g., all `.pdf` files into `pdf/`, all `.jpg` files into `images/`). Include a `--dry-run` flag that shows what would happen without actually moving files.

5. Revisit the first script you wrote in Lesson 06. Refactor it using everything you've learned: add the safety header, use functions, handle errors, parse arguments, add a usage message. Compare the before and after.

---

## Key Takeaways

- `set -euo pipefail` should be in every serious script. It catches silent failures.
- `set -x` traces execution — essential for debugging. `bash -x script.sh` does the same without editing.
- `trap '...' EXIT` ensures cleanup runs no matter how the script exits.
- `mktemp` creates safe temporary files. Never hardcode temp paths.
- Quote everything. Use `local` in functions. Use `readonly` for constants.
- Parse options with a `while/case` loop. Always provide a `usage` function.
- Build scripts incrementally: get the basic logic working, then add error handling, then add options and polish.

---

## Course Summary

Over 12 lessons, you've gone from opening a terminal to writing production-quality scripts. Here's what you've covered:

| Lesson | Topic | Core Skills |
|--------|-------|-------------|
| 01 | Welcome to the Terminal | Navigation, pwd, ls, cd, tab completion |
| 02 | Files and Directories | mkdir, touch, cp, mv, rm, wildcards |
| 03 | Reading and Searching | cat, less, head, tail, grep |
| 04 | Pipes and Redirection | \|, >, >>, 2>, /dev/null, tee |
| 05 | Permissions | chmod, chown, rwx, sudo |
| 06 | First Scripts | Shebang, variables, read, arguments, quoting |
| 07 | Conditionals | if/elif/else, [[ ]], case, test expressions |
| 08 | Loops | for, while, until, break, continue, while read |
| 09 | Functions | local, return, source, script structure |
| 10 | Text Processing | cut, tr, sort, uniq, sed, awk |
| 11 | Process Management | ps, kill, jobs, bg/fg, cron, xargs |
| 12 | Real-World Scripting | Error handling, debugging, best practices |

The terminal is now a tool you can think in. Keep using it.

---

*Congratulations on completing Bashing through Bash.*
