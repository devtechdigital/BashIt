# Lesson 07: Conditionals and Logic

**Time: ~30 minutes**

---

## Making Decisions

So far, your scripts have been straight-line sequences: do this, then this, then this. Real scripts need to make decisions. Does a file exist before trying to read it? Did a command succeed or fail? Did the user provide the right number of arguments?

This lesson teaches you how to branch — how to make your scripts do different things based on conditions.

---

## The `if` Statement

The basic structure:

```bash
if [ condition ]; then
    # commands to run if condition is true
fi
```

A concrete example:

```bash
#!/bin/bash

if [ -f "config.txt" ]; then
    echo "Config file found."
fi
```

The `-f` test checks whether a file exists and is a regular file. The `[ ... ]` is actually a command (an alias for the `test` command), and the spaces inside the brackets are mandatory.

### `if`/`else`

```bash
if [ -f "config.txt" ]; then
    echo "Loading configuration..."
    source config.txt
else
    echo "No config file found. Using defaults."
fi
```

### `if`/`elif`/`else`

```bash
if [ "$1" = "start" ]; then
    echo "Starting service..."
elif [ "$1" = "stop" ]; then
    echo "Stopping service..."
elif [ "$1" = "status" ]; then
    echo "Checking status..."
else
    echo "Usage: $0 {start|stop|status}"
    exit 1
fi
```

Note: `elif` is bash's "else if." You can chain as many as you need.

---

## Test Expressions

The `[ ... ]` brackets support many different tests. Here are the ones you'll use constantly.

### File Tests

| Test | True when... |
|------|-------------|
| `-f file` | File exists and is a regular file |
| `-d dir` | Directory exists |
| `-e path` | Path exists (file or directory) |
| `-r file` | File is readable |
| `-w file` | File is writable |
| `-x file` | File is executable |
| `-s file` | File exists and is not empty |
| `-L file` | File is a symbolic link |

```bash
if [ -d "$HOME/projects" ]; then
    echo "Projects directory exists."
fi

if [ ! -f "output.log" ]; then
    echo "No log file yet."
fi
```

The `!` negates a test — "if NOT."

### String Comparisons

| Test | True when... |
|------|-------------|
| `"$a" = "$b"` | Strings are equal |
| `"$a" != "$b"` | Strings are not equal |
| `-z "$a"` | String is empty (zero length) |
| `-n "$a"` | String is not empty |

```bash
if [ "$USER" = "root" ]; then
    echo "Running as root — be careful!"
fi

if [ -z "$1" ]; then
    echo "No argument provided."
    exit 1
fi
```

Always quote your variables inside `[ ... ]`. Without quotes, an empty variable causes a syntax error:

```bash
name=""
[ $name = "Kevin" ]    # ERROR: [ = "Kevin" ] — bash is confused
[ "$name" = "Kevin" ]  # Works fine: [ "" = "Kevin" ] — evaluates to false
```

### Numeric Comparisons

Numbers use different operators than strings:

| Test | Meaning |
|------|---------|
| `$a -eq $b` | Equal |
| `$a -ne $b` | Not equal |
| `$a -lt $b` | Less than |
| `$a -le $b` | Less than or equal |
| `$a -gt $b` | Greater than |
| `$a -ge $b` | Greater than or equal |

```bash
count=$(ls | wc -l)

if [ "$count" -gt 100 ]; then
    echo "That's a lot of files: $count"
elif [ "$count" -gt 10 ]; then
    echo "Moderate number of files: $count"
else
    echo "Just a few files: $count"
fi
```

Why `-eq` instead of `=`? Because `=` does string comparison. The string "10" comes before "9" alphabetically, but numerically 10 is greater than 9. The `-eq` family does proper number comparison.

---

## Double Brackets: `[[ ... ]]`

Bash has an improved test syntax with double brackets. It's more forgiving and supports more features:

```bash
if [[ "$name" = "Kevin" ]]; then
    echo "Hello Kevin"
fi
```

### Advantages of `[[ ... ]]`

**Pattern matching:**
```bash
if [[ "$filename" == *.txt ]]; then
    echo "It's a text file."
fi
```

**Regex matching:**
```bash
if [[ "$email" =~ ^[a-zA-Z]+@[a-zA-Z]+\.[a-zA-Z]+$ ]]; then
    echo "Looks like a valid email."
fi
```

**No word-splitting issues:**
```bash
name=""
if [[ $name = "Kevin" ]]; then    # works even without quotes
    echo "Hi"
fi
```

**Logical operators inside the brackets:**
```bash
if [[ "$age" -ge 18 && "$age" -le 65 ]]; then
    echo "Working age."
fi
```

As a rule: use `[[ ... ]]` in bash scripts. Use `[ ... ]` only when you need strict POSIX compatibility (which is rare in practice).

---

## Logical Operators

### Inside `[[ ... ]]`

```bash
if [[ "$a" -gt 0 && "$a" -lt 100 ]]; then     # AND
    echo "Between 1 and 99"
fi

if [[ "$day" = "Saturday" || "$day" = "Sunday" ]]; then   # OR
    echo "Weekend!"
fi

if [[ ! -f "lock.file" ]]; then                # NOT
    echo "No lock file — safe to proceed."
fi
```

### Combining `[ ... ]` with External Operators

With single brackets, you can't use `&&` and `||` inside. Use `-a` and `-o` instead, or combine multiple bracket expressions:

```bash
# These two are equivalent:
if [ "$a" -gt 0 ] && [ "$a" -lt 100 ]; then
    echo "In range"
fi

# -a and -o work inside single brackets but are considered outdated:
if [ "$a" -gt 0 -a "$a" -lt 100 ]; then
    echo "In range"
fi
```

Another reason to prefer `[[ ... ]]`.

---

## Short-Circuit Evaluation

`&&` and `||` can be used outside of `if` statements for quick conditional execution:

```bash
# Run the second command only if the first succeeds
mkdir -p backups && echo "Backup directory ready."

# Run the second command only if the first fails
[ -f "config.txt" ] || echo "Warning: config not found!"

# A common pattern for validation
[ -z "$1" ] && echo "Usage: $0 filename" && exit 1
```

This is useful for one-liners but can get hard to read for complex logic. Use proper `if` statements when clarity matters.

---

## The `case` Statement

When you're comparing one variable against many possible values, `case` is cleaner than a chain of `elif`:

```bash
#!/bin/bash

case "$1" in
    start)
        echo "Starting the service..."
        ;;
    stop)
        echo "Stopping the service..."
        ;;
    restart)
        echo "Restarting..."
        ;;
    status)
        echo "Service is running."
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status}"
        exit 1
        ;;
esac
```

Each pattern ends with `)`. Each block ends with `;;`. The `*` pattern matches anything not matched above — it's the default case. The whole thing ends with `esac` ("case" backwards).

### Pattern Matching in `case`

```bash
case "$filename" in
    *.txt)
        echo "Text file"
        ;;
    *.jpg|*.png|*.gif)
        echo "Image file"
        ;;
    *.sh)
        echo "Shell script"
        ;;
    *)
        echo "Unknown type"
        ;;
esac
```

The `|` lets you match multiple patterns for the same block.

---

## Arithmetic with `(( ... ))`

For numeric operations and comparisons, double parentheses give you a more natural syntax:

```bash
x=10
y=3

if (( x > y )); then
    echo "$x is greater than $y"
fi

if (( x % 2 == 0 )); then
    echo "$x is even"
fi

(( count++ ))           # increment
(( total = x + y ))     # arithmetic assignment
echo "$total"           # 13
```

Inside `(( ... ))`, you don't need `$` before variable names (though it still works). You can use familiar operators: `>`, `<`, `>=`, `<=`, `==`, `!=`, `%`, `+`, `-`, `*`, `/`.

---

## Putting It Together: A Practical Script

```bash
#!/bin/bash

# deploy.sh — a simple deployment checker
# Usage: ./deploy.sh [environment]

environment="${1:-staging}"

echo "=== Deployment Check for: $environment ==="

# Validate environment
case "$environment" in
    staging|production|development)
        echo "Environment: $environment — valid."
        ;;
    *)
        echo "Error: Unknown environment '$environment'."
        echo "Valid options: staging, production, development"
        exit 1
        ;;
esac

# Check prerequisites
if [[ ! -f "app.conf" ]]; then
    echo "Error: app.conf not found. Cannot deploy."
    exit 1
fi

if [[ "$environment" = "production" ]]; then
    read -p "You're deploying to PRODUCTION. Are you sure? (yes/no): " confirm
    if [[ "$confirm" != "yes" ]]; then
        echo "Deployment cancelled."
        exit 0
    fi
fi

echo "All checks passed. Ready to deploy to $environment."
```

---

## Try It Yourself

1. Write a script called `filecheck.sh` that takes a filename as an argument and reports whether it exists, whether it's a file or directory, and whether it's readable, writable, and executable.

2. Write a script called `age.sh` that asks the user for their age and responds differently based on the value (under 18, 18-65, over 65). Handle non-numeric input gracefully.

3. Write a script called `extension.sh` that takes a filename as an argument and uses a `case` statement to print what type of file it is based on the extension (.txt, .sh, .py, .jpg, etc.).

4. Write a script that checks if a command-line tool is installed (like `git`, `python3`, or `docker`) using `command -v toolname` and reports whether it's available or not.

5. Modify one of your earlier scripts to validate its arguments properly — check that the right number of arguments were given and that any files referenced actually exist.

---

## Key Takeaways

- `if [ condition ]; then ... fi` is the basic branching structure. Add `elif` and `else` as needed.
- Use `[[ ... ]]` in bash scripts — it's safer and more powerful than `[ ... ]`.
- File tests (`-f`, `-d`, `-e`, `-r`, `-w`, `-x`) are how you check the filesystem.
- String comparison uses `=` and `!=`. Numeric comparison uses `-eq`, `-ne`, `-lt`, `-gt`, etc.
- Always quote variables inside tests: `[[ "$var" = "value" ]]`.
- `case` statements are cleaner than long `elif` chains when matching one variable against many values.
- `(( ... ))` gives you natural arithmetic syntax.
- `&&` and `||` let you do quick conditional execution without a full `if` statement.

---

*Next up: [Lesson 08 — Loops and Iteration](08-loops-and-iteration.md)*
