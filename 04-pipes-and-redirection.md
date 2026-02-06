# Lesson 04: Pipes and Redirection

**Time: ~30 minutes**

---

## The Big Idea

In Lesson 03, you used commands one at a time — run `grep`, see the output, run another command. That works, but the real power of bash comes from connecting commands together.

The Unix philosophy is: make each tool do one thing well, then combine them. `grep` searches. `sort` sorts. `wc` counts. Alone, they're useful. Chained together, they're a data processing pipeline that can rival a script in any language — written in a single line.

This lesson teaches you how to chain commands with pipes and control where output goes with redirection. Once you understand these two concepts, the terminal stops feeling like a one-trick tool and starts feeling like a workshop.

---

## Standard Streams

Every command in bash has three data streams:

- **stdin** (standard input) — where data comes in. Usually your keyboard.
- **stdout** (standard output) — where results go. Usually your terminal screen.
- **stderr** (standard error) — where error messages go. Also usually your terminal screen.

These streams are numbered: stdin is 0, stdout is 1, stderr is 2. These numbers matter when you want to redirect specific streams, which we'll get to shortly.

When you run `ls`, the list of files goes to stdout (your screen). If you `ls` a directory that doesn't exist, the error message goes to stderr (also your screen). They look the same, but bash treats them differently — and you can redirect them independently.

---

## Pipes: Connecting Commands

The pipe operator `|` takes the stdout of one command and sends it to the stdin of the next command.

```bash
ls -la | less
```

This runs `ls -la`, but instead of printing to the screen, it sends the output into `less` so you can scroll through it. The first command produces data; the second command receives it.

### Building a Pipeline

You can chain as many commands as you want:

```bash
cat server.log | grep "ERROR" | wc -l
```

What happens here, step by step:
1. `cat server.log` — outputs the entire log file
2. `grep "ERROR"` — receives that output, keeps only lines containing "ERROR"
3. `wc -l` — receives those filtered lines, counts them

The result is a single number: how many error lines are in the log.

### More Pipeline Examples

Find the 5 largest files in a directory:
```bash
ls -lS | head -6
```
(Head 6 because `ls -l` includes a "total" line at the top.)

Show unique error types in a log:
```bash
grep "ERROR" server.log | sort | uniq
```

Count how many times each error message appears:
```bash
grep "ERROR" server.log | sort | uniq -c | sort -rn
```

This is where it gets elegant. Four commands, each doing one thing, producing a frequency-sorted list of error messages. No temporary files, no scripting language needed.

Find the 10 most recently modified files:
```bash
ls -lt | head -11
```

See which processes are using the most memory:
```bash
ps aux | sort -k4 -rn | head -10
```

---

## Output Redirection

Pipes send output to another command. Redirection sends output to a file.

### `>` — Write to a File (Overwrite)

```bash
echo "Hello World" > output.txt
ls -la > filelist.txt
grep "ERROR" server.log > errors.txt
```

If the file exists, it gets replaced. If it doesn't exist, it gets created. The output no longer appears on screen — it goes into the file instead.

### `>>` — Append to a File

```bash
echo "First line" > log.txt
echo "Second line" >> log.txt
echo "Third line" >> log.txt
cat log.txt
```

The `>>` operator adds to the end of the file instead of overwriting. This is how you build up files incrementally, and it's essential for logging.

### The Overwrite Trap

This is a common mistake:

```bash
sort data.txt > data.txt    # DANGER — this empties the file!
```

Bash sets up the redirection (creating/emptying `data.txt`) *before* the command runs. So `sort` reads from an already-empty file. The result is an empty file. Always redirect to a different filename, then rename if needed:

```bash
sort data.txt > data-sorted.txt
mv data-sorted.txt data.txt
```

---

## Input Redirection

### `<` — Read from a File

Most commands can take a filename as an argument, so you don't use `<` as often. But it exists:

```bash
sort < unsorted.txt
wc -l < server.log
```

This is functionally the same as `sort unsorted.txt`, but the mechanism is different: with `<`, bash opens the file and feeds it to the command's stdin. With `sort unsorted.txt`, the sort command opens the file itself.

### Here Documents (`<<`) — Inline Multi-line Input

This lets you feed multiple lines of text to a command:

```bash
cat << EOF
Line one
Line two
Line three
EOF
```

The word after `<<` (here, `EOF`) is a delimiter. Everything between the first `EOF` and the last `EOF` becomes the input. You can use any word as the delimiter, but `EOF` is conventional.

This is extremely useful in scripts for creating files or feeding input to commands:

```bash
cat << EOF > config.ini
[database]
host=localhost
port=5432
EOF
```

---

## Redirecting stderr

By default, error messages go to your screen even when you redirect stdout. This is usually what you want — if something goes wrong, you want to see it. But sometimes you need to control error output separately.

### Redirect Only Errors to a File

```bash
ls /nonexistent 2> errors.txt
```

The `2>` redirects stream number 2 (stderr) to a file. Normal output still goes to the screen.

### Redirect stdout and stderr Separately

```bash
command > output.txt 2> errors.txt
```

Output goes to one file, errors go to another. This is useful in scripts where you want to log errors separately.

### Redirect Both to the Same File

```bash
command > all-output.txt 2>&1
```

The `2>&1` means "send stderr to the same place as stdout." The order matters here — the stdout redirect must come first.

There's also a shorthand:

```bash
command &> all-output.txt
```

This does the same thing and is easier to read.

### Discard Output Entirely

```bash
command > /dev/null 2>&1
```

`/dev/null` is a special file that discards everything written to it. This is how you silence a command completely. You'll see this in scripts when you care about a command's exit status but not its output.

---

## Combining Pipes and Redirection

Pipes and redirection work together. The pipe chains commands; the redirection at the end captures the final result:

```bash
grep "ERROR" server.log | sort | uniq -c | sort -rn > error-report.txt
```

This runs the entire pipeline and saves the final output to a file. The intermediate steps aren't saved anywhere — they flow through the pipe and are gone.

You can also redirect at different points in the pipeline, though this is less common:

```bash
grep "ERROR" server.log 2>/dev/null | sort | uniq -c > report.txt
```

Here, any errors from `grep` are silently discarded, while the successful output flows through the pipeline and into a file.

---

## The `tee` Command — Output to Screen AND File

Sometimes you want to see the output and save it. `tee` does exactly that:

```bash
grep "ERROR" server.log | tee errors.txt
```

This prints the matching lines to your screen and simultaneously writes them to `errors.txt`. It's like a T-junction for your data stream.

Use `tee -a` to append instead of overwrite:

```bash
echo "New error found" | tee -a errors.txt
```

`tee` is also useful mid-pipeline for debugging — you can see what's flowing through at a specific point:

```bash
cat server.log | grep "ERROR" | tee /dev/stderr | wc -l
```

This shows you the matching lines (via `tee` to stderr) and also gives you the count (via `wc -l` to stdout).

---

## Practical Pipeline Patterns

Here are some pipeline patterns you'll use repeatedly:

### Find and Count

```bash
# How many Python files are in this project?
find . -name "*.py" | wc -l

# How many unique IP addresses are in the access log?
awk '{print $1}' access.log | sort -u | wc -l
```

### Filter and Format

```bash
# Show only active config values (no comments, no blank lines), sorted
grep -v "^#" config.txt | grep -v "^$" | sort
```

### Extract and Aggregate

```bash
# Find the most common words in a file
cat document.txt | tr ' ' '\n' | sort | uniq -c | sort -rn | head -20
```

This pipeline: converts spaces to newlines (one word per line), sorts them, counts unique occurrences, sorts by count descending, and shows the top 20.

### Search Across Multiple Files

```bash
# Find all TODO comments in a project and list by file
grep -rn "TODO" ~/projects/ | sort -t: -k1,1
```

---

## Try It Yourself

First, make sure you're in the `lesson03` directory (or wherever your `server.log` and `config.txt` files are).

1. Use a pipe to count how many lines in `server.log` contain "INFO": `grep "INFO" server.log | wc -l`

2. Extract all the error and warning lines from `server.log`, sort them, and save to `problems.txt`.

3. Show only the configuration keys (not comments, not blank lines) from `config.txt`, sorted alphabetically. Save the result to `active-config.txt`.

4. Run `ls -la /etc` — if the output is too long, pipe it to `less`.

5. Run a command that produces an error (like `ls /nonexistent`) and redirect only the error to `oops.txt`. Verify the file contains the error message.

6. Use `echo` and `>>` to create a file with three lines, one command at a time. Verify with `cat`.

7. Use `tee` to both display and save the output of `grep "ERROR" server.log`.

8. Build a pipeline that finds all unique log levels in `server.log` (the words in square brackets like INFO, ERROR, WARN). Hint: `grep -oE '\[.*?\]'` or think about how to extract them with `cut`.

---

## Key Takeaways

- The pipe `|` sends the output of one command into the input of the next. This is the backbone of bash's power.
- `>` writes output to a file (overwriting). `>>` appends. Never redirect to the same file you're reading from.
- stderr (`2>`) and stdout (`>`) are separate streams. You can redirect them independently.
- `/dev/null` is the black hole — redirect there to discard output.
- `tee` splits output to both the screen and a file. Use it when you need to see and save simultaneously.
- Pipelines let you build complex data transformations from simple commands. Think of each command as a step in an assembly line.

---

*Next up: [Lesson 05 — Permissions and Ownership](05-permissions-and-ownership.md)*
