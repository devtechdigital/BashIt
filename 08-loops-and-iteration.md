# Lesson 08: Loops and Iteration

**Time: ~30 minutes**

---

## Why Loops Matter

You have 200 image files to rename. Or 50 servers to check. Or a log file you need to process line by line. Doing any of this manually would be tedious and error-prone. Loops let you say "do this thing for each item in this list" and walk away.

Loops are where scripting starts to save you real time. A task that would take 20 minutes by hand takes 3 seconds in a loop.

---

## The `for` Loop

The `for` loop iterates over a list of items:

```bash
for name in Alice Bob Charlie; do
    echo "Hello, $name!"
done
```

Output:
```
Hello, Alice!
Hello, Bob!
Hello, Charlie!
```

The variable `name` takes each value in turn. The code between `do` and `done` runs once per value.

### Looping Over Files

This is the most common use of `for` loops:

```bash
for file in *.txt; do
    echo "Processing: $file"
done
```

The `*.txt` glob expands to a list of all `.txt` files in the current directory. Each one gets assigned to `$file` in turn.

### Looping Over Command Output

```bash
for user in $(cat users.txt); do
    echo "Setting up account for: $user"
done
```

`$(cat users.txt)` expands to the contents of the file, split on whitespace. Each word becomes one iteration.

A word of caution: this splits on all whitespace, including spaces within lines. If your file has lines with spaces, use a `while read` loop instead (covered below).

### Looping Over a Range of Numbers

```bash
for i in {1..10}; do
    echo "Iteration $i"
done
```

Brace expansion generates the sequence. You can also specify a step:

```bash
for i in {0..100..5}; do
    echo "$i"
done
```

This counts from 0 to 100 in steps of 5.

### C-style `for` Loop

If you're coming from a C, Java, or JavaScript background, this syntax will feel familiar:

```bash
for (( i=1; i<=10; i++ )); do
    echo "Count: $i"
done
```

This is useful when you need precise control over the counter.

---

## The `while` Loop

A `while` loop runs as long as its condition is true:

```bash
count=1
while [ $count -le 5 ]; do
    echo "Count: $count"
    (( count++ ))
done
```

This counts from 1 to 5. The `(( count++ ))` increments the counter each time. Without it, you'd have an infinite loop.

### Reading Files Line by Line

This is the correct way to process a file line by line, preserving spaces and special characters:

```bash
while IFS= read -r line; do
    echo "Line: $line"
done < input.txt
```

Breaking this down:
- `IFS=` prevents leading/trailing whitespace from being stripped
- `read -r` reads one line, `-r` prevents backslash interpretation
- `done < input.txt` feeds the file into the loop's stdin

This is safer than `for line in $(cat file)` because it handles spaces, tabs, and special characters correctly.

### Processing a File with Line Numbers

```bash
line_number=0
while IFS= read -r line; do
    (( line_number++ ))
    echo "$line_number: $line"
done < data.txt
```

### Reading from a Pipe

```bash
grep "ERROR" server.log | while IFS= read -r line; do
    echo "Found error: $line"
done
```

A subtle gotcha: when you pipe into `while`, the loop runs in a subshell. Variables set inside the loop won't be available after the loop ends. If you need variables to persist, use process substitution instead:

```bash
count=0
while IFS= read -r line; do
    (( count++ ))
done < <(grep "ERROR" server.log)
echo "Found $count errors"   # this works because of < <(...)
```

---

## The `until` Loop

`until` is the inverse of `while` — it runs as long as the condition is *false*:

```bash
count=1
until [ $count -gt 5 ]; do
    echo "Count: $count"
    (( count++ ))
done
```

This produces the same output as the `while` example above. Use whichever reads more naturally for your situation. In practice, `while` is used far more often.

### Waiting for Something

`until` shines when you're waiting for a condition to become true:

```bash
echo "Waiting for server.lock to disappear..."
until [ ! -f "server.lock" ]; do
    sleep 1
done
echo "Lock file gone. Proceeding."
```

---

## Loop Control

### `break` — Exit the Loop Early

```bash
for file in *.log; do
    if [ ! -r "$file" ]; then
        echo "Cannot read $file — stopping."
        break
    fi
    echo "Processing $file"
done
```

`break` immediately exits the nearest enclosing loop.

### `continue` — Skip to the Next Iteration

```bash
for file in *; do
    if [ -d "$file" ]; then
        continue    # skip directories
    fi
    echo "File: $file"
done
```

`continue` skips the rest of the current iteration and moves to the next one.

---

## Practical Loop Patterns

### Batch Rename Files

```bash
for file in *.jpeg; do
    mv "$file" "${file%.jpeg}.jpg"
done
```

The `${file%.jpeg}` syntax removes `.jpeg` from the end of the variable. So `photo.jpeg` becomes `photo`, and then `.jpg` is appended to get `photo.jpg`.

### Process CSV Data

```bash
while IFS=',' read -r name email role; do
    echo "Name: $name, Email: $email, Role: $role"
done < employees.csv
```

Setting `IFS=','` tells `read` to split on commas instead of whitespace. Each comma-separated value goes into its own variable.

### Create Multiple Directories

```bash
for month in {01..12}; do
    mkdir -p "2025/$month"
done
```

### Check Multiple Servers

```bash
for server in web1 web2 web3 db1 db2; do
    if ping -c 1 -W 2 "$server" > /dev/null 2>&1; then
        echo "$server: UP"
    else
        echo "$server: DOWN"
    fi
done
```

### Find and Process Specific Files

```bash
find . -name "*.tmp" -mtime +7 | while IFS= read -r file; do
    echo "Deleting old temp file: $file"
    rm "$file"
done
```

This finds all `.tmp` files older than 7 days and deletes them.

### Retry Logic

```bash
max_attempts=5
attempt=1

while [ $attempt -le $max_attempts ]; do
    echo "Attempt $attempt of $max_attempts..."
    
    if curl -s -o /dev/null -w "%{http_code}" https://example.com | grep -q "200"; then
        echo "Success!"
        break
    fi
    
    echo "Failed. Waiting 5 seconds..."
    sleep 5
    (( attempt++ ))
done

if [ $attempt -gt $max_attempts ]; then
    echo "All $max_attempts attempts failed."
    exit 1
fi
```

---

## Nested Loops

Loops can contain other loops:

```bash
for dir in project1 project2 project3; do
    echo "=== $dir ==="
    for file in "$dir"/*.txt; do
        echo "  Found: $file"
    done
done
```

Use nested loops sparingly. If you're going more than two levels deep, consider whether there's a simpler approach (like `find`).

---

## The `select` Loop — Simple Menus

`select` creates an interactive numbered menu:

```bash
echo "Choose an environment:"
select env in development staging production quit; do
    case "$env" in
        development|staging|production)
            echo "Deploying to $env..."
            break
            ;;
        quit)
            echo "Goodbye."
            exit 0
            ;;
        *)
            echo "Invalid option. Try again."
            ;;
    esac
done
```

This displays a numbered list and waits for input. It loops until `break` or `exit` is called.

---

## Common Mistakes

**Forgetting quotes around variables with spaces:**
```bash
# WRONG — breaks on filenames with spaces
for file in $(ls); do ...

# RIGHT
for file in *; do ...
```

**Modifying a list while iterating over it:**
Don't delete files from a directory while looping over that directory's contents with a glob. Collect the filenames first, then delete.

**Infinite loops without an exit:**
Always make sure your `while` condition will eventually become false, or include a `break`.

**Using `for` to read lines from a file:**
```bash
# WRONG — splits on all whitespace, not just newlines
for line in $(cat file.txt); do ...

# RIGHT
while IFS= read -r line; do ... done < file.txt
```

---

## Try It Yourself

1. Write a loop that creates files `day01.txt` through `day31.txt`.

2. Write a script that takes a directory as an argument and counts how many files vs directories are inside it (one level only, not recursive).

3. Write a script that reads a file of names (one per line) and prints a greeting for each one.

4. Write a retry loop that tries to create a directory and retries up to 3 times with a 2-second delay between attempts (simulate failure by trying to create a directory in a location that doesn't exist).

5. Write a script that loops through all `.sh` files in a directory and reports which ones are executable and which aren't.

6. Use a `select` menu to let the user choose between three options and display a different message for each.

---

## Key Takeaways

- `for item in list` iterates over a list. Use it for files (`*.txt`), sequences (`{1..10}`), and explicit lists.
- `while [ condition ]` loops as long as the condition is true. Use it for counters, retries, and reading files.
- `while IFS= read -r line; do ... done < file` is the correct way to read a file line by line.
- `break` exits a loop. `continue` skips to the next iteration.
- Always quote your variables in loops: `"$file"` not `$file`.
- The `${variable%pattern}` syntax strips text from the end of a variable — essential for renaming.
- Don't use `for line in $(cat file)` — it breaks on spaces. Use `while read` instead.

---

*Next up: [Lesson 09 — Functions and Script Organisation](09-functions-and-script-organisation.md)*
