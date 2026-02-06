# Lesson 09: Functions and Script Organisation

**Time: ~30 minutes**

---

## Why Functions?

As your scripts grow, they get harder to read, harder to debug, and harder to maintain. Functions solve this by letting you name a block of code and reuse it. Instead of a 200-line script that does everything in sequence, you get small, named pieces that each do one thing.

Functions also make your scripts self-documenting. When the main body of your script reads `validate_input`, `create_backup`, `deploy_files`, you can understand what it does without reading every line.

---

## Defining and Calling Functions

The basic syntax:

```bash
greet() {
    echo "Hello, World!"
}

# Call it
greet
```

That's it. Define the function (name, parentheses, curly braces), then call it by name. The parentheses in the definition are always empty — they're just syntax, not a parameter list.

You can also write it with the `function` keyword:

```bash
function greet {
    echo "Hello, World!"
}
```

Both forms work. The first (without `function`) is more portable and more common. Pick one and be consistent.

**Important:** Functions must be defined before they're called. Bash reads scripts top to bottom, so define your functions at the top.

---

## Function Arguments

Functions receive arguments the same way scripts do — through positional parameters `$1`, `$2`, etc.:

```bash
greet() {
    local name="$1"
    echo "Hello, $name!"
}

greet "Kevin"
greet "Alice"
```

Inside the function, `$1` refers to the first argument passed to *the function*, not to the script. `$@` is all arguments, `$#` is the count.

```bash
log_message() {
    local level="$1"
    shift                  # remove the first argument
    local message="$@"     # everything remaining
    echo "[$(date '+%H:%M:%S')] [$level] $message"
}

log_message "INFO" "Server started successfully"
log_message "ERROR" "Connection to database failed"
```

The `shift` command removes the first positional parameter and shifts the rest down — `$2` becomes `$1`, `$3` becomes `$2`, and so on. It's useful when the first argument is a flag or category and the rest is variable-length data.

---

## Local Variables

By default, variables in bash are **global** — they're visible everywhere in the script. Inside functions, this causes problems:

```bash
set_name() {
    name="Alice"       # this modifies the global "name"
}

name="Kevin"
set_name
echo "$name"           # prints "Alice" — the function changed it!
```

The `local` keyword restricts a variable to the function:

```bash
set_name() {
    local name="Alice"   # only exists inside this function
    echo "Inside: $name"
}

name="Kevin"
set_name
echo "Outside: $name"   # prints "Kevin" — unchanged
```

**Rule of thumb:** Always use `local` for variables inside functions. The only exception is when you *intentionally* want to modify a global variable.

---

## Return Values

Functions can return an exit code (a number from 0 to 255):

```bash
is_even() {
    local num="$1"
    if (( num % 2 == 0 )); then
        return 0     # success = true
    else
        return 1     # failure = false
    fi
}

if is_even 4; then
    echo "4 is even"
fi

if ! is_even 7; then
    echo "7 is odd"
fi
```

`return 0` means success (true). `return 1` means failure (false). This mirrors how all Unix commands work — 0 is success, non-zero is failure.

### Returning Data (Not Just Status)

Since `return` only handles numbers 0-255, you can't use it to return strings or large numbers. Instead, use `echo` and capture the output:

```bash
get_extension() {
    local filename="$1"
    echo "${filename##*.}"
}

ext=$(get_extension "report.pdf")
echo "Extension is: $ext"    # pdf
```

The function's `echo` output gets captured by `$(...)`. This is the standard pattern for functions that produce data.

You can also use a global variable, though it's less clean:

```bash
get_extension() {
    RESULT="${1##*.}"
}

get_extension "report.pdf"
echo "Extension is: $RESULT"
```

Prefer the `echo`-and-capture pattern. It's more explicit and doesn't rely on side effects.

---

## Parameter Validation

Good functions check their inputs:

```bash
create_backup() {
    local source="$1"
    local dest_dir="$2"
    
    if [[ -z "$source" || -z "$dest_dir" ]]; then
        echo "Error: create_backup requires source and destination" >&2
        return 1
    fi
    
    if [[ ! -f "$source" ]]; then
        echo "Error: Source file '$source' not found" >&2
        return 1
    fi
    
    if [[ ! -d "$dest_dir" ]]; then
        mkdir -p "$dest_dir"
    fi
    
    local timestamp=$(date '+%Y%m%d_%H%M%S')
    local basename=$(basename "$source")
    cp "$source" "$dest_dir/${basename}.${timestamp}.bak"
    echo "Backed up: $source → $dest_dir/${basename}.${timestamp}.bak"
}
```

Notice the `>&2` on error messages — this sends them to stderr instead of stdout, so they don't interfere with output that might be captured.

---

## Organising a Script

Here's a structure that works well for scripts of any size:

```bash
#!/bin/bash
#
# deploy.sh — Deploy the application to a target environment
# Usage: ./deploy.sh <environment> [version]
#

# --- Configuration ---
readonly APP_NAME="myapp"
readonly LOG_DIR="/var/log/$APP_NAME"
readonly DEFAULT_VERSION="latest"

# --- Functions ---

usage() {
    echo "Usage: $0 <environment> [version]"
    echo ""
    echo "Environments: development, staging, production"
    echo "Version defaults to '$DEFAULT_VERSION' if not specified."
    exit 1
}

log() {
    local level="$1"
    shift
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [$level] $*"
}

validate_environment() {
    local env="$1"
    case "$env" in
        development|staging|production) return 0 ;;
        *) return 1 ;;
    esac
}

check_prerequisites() {
    local missing=0
    
    for cmd in git docker curl; do
        if ! command -v "$cmd" > /dev/null 2>&1; then
            log "ERROR" "Required command not found: $cmd"
            (( missing++ ))
        fi
    done
    
    return "$missing"
}

deploy() {
    local env="$1"
    local version="$2"
    
    log "INFO" "Deploying $APP_NAME version $version to $env"
    log "INFO" "Deployment complete."
}

# --- Main ---

main() {
    local environment="${1:-}"
    local version="${2:-$DEFAULT_VERSION}"
    
    if [[ -z "$environment" ]]; then
        usage
    fi
    
    if ! validate_environment "$environment"; then
        log "ERROR" "Invalid environment: $environment"
        usage
    fi
    
    if ! check_prerequisites; then
        log "ERROR" "Missing prerequisites. Aborting."
        exit 1
    fi
    
    deploy "$environment" "$version"
}

main "$@"
```

### The Pattern Explained

1. **Header comment** — script name, purpose, and usage
2. **Configuration** — constants at the top, using `readonly`
3. **Functions** — each one does one thing, defined before use
4. **`main` function** — the entry point, contains the script's logic flow
5. **`main "$@"`** — the only line at the top level, passing all script arguments to `main`

This pattern is used by professionals for a reason: it's readable, testable, and maintainable. The `main` function isn't strictly necessary for small scripts, but it becomes valuable as scripts grow.

---

## Sourcing Files

As scripts get larger, you can split functions into separate files and include them:

```bash
# utils.sh
log() {
    echo "[$(date '+%H:%M:%S')] $*"
}

validate_file() {
    [[ -f "$1" ]]
}
```

```bash
# main.sh
#!/bin/bash
source ./utils.sh    # or: . ./utils.sh

log "Starting up"
if validate_file "config.txt"; then
    log "Config found"
fi
```

`source` (or its shorthand `.`) executes the contents of a file in the current shell. Functions and variables defined in the sourced file become available immediately.

This is how you build a library of reusable functions across multiple scripts.

---

## Useful String Manipulations for Functions

You'll use these inside functions constantly:

### Extracting Parts of Strings

```bash
filepath="/home/kevin/documents/report.pdf"

echo "${filepath##*/}"       # report.pdf   (basename — everything after last /)
echo "${filepath%/*}"        # /home/kevin/documents  (dirname — everything before last /)
echo "${filepath##*.}"       # pdf           (extension — everything after last .)
echo "${filepath%.pdf}"      # /home/kevin/documents/report  (remove extension)
```

The `##` removes the longest match from the front. The `%` removes the shortest match from the end. `%%` removes the longest match from the end. `#` removes the shortest match from the front.

### Replacing Text in Variables

```bash
text="Hello World"
echo "${text/World/Bash}"     # Hello Bash  (replace first occurrence)
echo "${text//l/L}"           # HeLLo WorLd (replace all occurrences)
```

### Uppercasing and Lowercasing

```bash
name="kevin"
echo "${name^}"       # Kevin   (capitalise first letter)
echo "${name^^}"      # KEVIN   (all uppercase)

SHOUT="HELLO"
echo "${SHOUT,,}"     # hello   (all lowercase)
```

### Default Values

```bash
echo "${name:-Anonymous}"     # use "Anonymous" if name is unset or empty
echo "${name:=Anonymous}"     # same, but also assigns the default to name
echo "${name:+Found}"         # prints "Found" if name IS set (otherwise nothing)
```

---

## Try It Yourself

1. Write a function `file_info` that takes a filename and prints its size, line count, and permissions on separate lines. Call it on several files.

2. Write a logging library: create a file called `logger.sh` with functions `log_info`, `log_warn`, and `log_error` that print timestamped, levelled messages. Source it from another script and use it.

3. Write a function `confirm` that asks the user a yes/no question and returns 0 for yes, 1 for no. Use it like: `if confirm "Deploy to production?"; then ...`.

4. Refactor one of your earlier scripts (from any previous lesson) to use functions. Extract repeated logic, add a `usage` function, and structure it with the pattern shown above.

5. Write a function `sanitise_filename` that takes a string and replaces spaces with underscores, removes special characters, and converts to lowercase. Test it with various inputs.

---

## Key Takeaways

- Functions are defined with `name() { ... }` and called by name. They must be defined before they're called.
- Functions receive arguments via `$1`, `$2`, etc. — the same as scripts.
- Always use `local` for variables inside functions to avoid polluting the global scope.
- `return` sets an exit status (0-255). To return data, `echo` it and capture with `$(function_name)`.
- Send error messages to stderr with `>&2`.
- The standard script structure is: header, constants, functions, `main` function, `main "$@"`.
- `source` includes other files, letting you build reusable function libraries.
- Bash has built-in string manipulation (`${var##pattern}`, `${var%pattern}`, `${var/old/new}`) that's faster than calling external tools.

---

*Next up: [Lesson 10 — Text Processing Power Tools](10-text-processing-power-tools.md)*
