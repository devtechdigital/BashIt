# Lesson 03: Reading and Searching Files

**Time: ~30 minutes**

---

## Why This Matters

You'll spend more time *reading* files than writing them. Log files, configuration files, code, data exports, documentation — being able to quickly view, search, and navigate file contents from the terminal is one of the most practical skills you can develop.

This lesson covers the essential tools for looking at files and finding things inside them.

---

## Setting Up Practice Files

Before we start, let's create some files to work with:

```bash
cd ~/bash-lessons
mkdir -p lesson03
cd lesson03
```

Create a sample log file:

```bash
for i in $(seq 1 100); do
  echo "$(date '+%Y-%m-%d %H:%M:%S') [INFO] Processing record $i" >> server.log
done
echo "2025-01-15 10:23:45 [ERROR] Connection refused: database timeout" >> server.log
echo "2025-01-15 10:24:01 [WARN] Retrying connection (attempt 1)" >> server.log
echo "2025-01-15 10:24:15 [ERROR] Connection refused: database timeout" >> server.log
echo "2025-01-15 10:25:00 [INFO] Connection restored" >> server.log
```

Don't worry about the `for` loop syntax yet — that's in Lesson 08. Just run it and you'll have a realistic log file to practice with.

Create a sample configuration file:

```bash
cat > config.txt << 'EOF'
# Application Configuration
app_name=MyWebApp
version=2.4.1
debug=false

# Database Settings
db_host=localhost
db_port=5432
db_name=production
db_user=admin

# API Settings
api_key=sk-abc123def456
api_timeout=30
api_retries=3

# Feature Flags
enable_caching=true
enable_logging=true
enable_notifications=false
EOF
```

---

## Viewing Entire Files

### `cat` — Concatenate and Print

```bash
cat config.txt
```

`cat` dumps the entire file to your terminal. It's the simplest tool — and the right choice for short files. The name comes from "concatenate" because it can also join files together:

```bash
cat file1.txt file2.txt     # prints both files in sequence
```

### `cat` with Line Numbers

```bash
cat -n config.txt
```

The `-n` flag adds line numbers. Useful when you need to reference specific lines.

### When `cat` Is the Wrong Tool

If a file is hundreds or thousands of lines long, `cat` will flood your terminal. You'll see only the last screenful of output and lose everything above it. For large files, use `less`.

---

## Viewing Large Files with `less`

```bash
less server.log
```

`less` opens the file in a scrollable viewer. Unlike `cat`, it doesn't dump everything at once — it shows one screen at a time and lets you navigate.

### Navigation in `less`

| Key | Action |
|-----|--------|
| `Space` or `f` | Forward one page |
| `b` | Back one page |
| `d` | Forward half a page |
| `u` | Back half a page |
| `g` | Go to the beginning |
| `G` | Go to the end |
| `q` | Quit |
| `/pattern` | Search forward for "pattern" |
| `?pattern` | Search backward for "pattern" |
| `n` | Next search match |
| `N` | Previous search match |

The search function inside `less` is incredibly useful. Open your log file and try:

```
/ERROR
```

This jumps to the first occurrence of "ERROR". Press `n` to find the next one.

### Why `less` and Not `more`

You'll sometimes see the `more` command mentioned. `less` is the improved version of `more` (hence the joke: "less is more"). Use `less`. It does everything `more` does, plus backward scrolling, better searching, and more.

---

## Viewing Parts of Files

Sometimes you don't need the whole file — just the beginning or the end.

### `head` — View the Beginning

```bash
head server.log          # first 10 lines (default)
head -20 server.log      # first 20 lines
head -1 server.log       # just the first line
```

Useful for checking the structure of a file or seeing its headers.

### `tail` — View the End

```bash
tail server.log          # last 10 lines (default)
tail -20 server.log      # last 20 lines
tail -1 server.log       # just the last line
```

### `tail -f` — Follow a File in Real Time

This is one of the most used commands in development and operations:

```bash
tail -f server.log
```

This shows the last 10 lines and then *waits*. Whenever new lines are added to the file, they appear immediately. It's how you watch logs in real time while debugging a running application.

Press `Ctrl + C` to stop following.

---

## Searching Inside Files with `grep`

`grep` is one of the most powerful and frequently used tools in bash. It searches for patterns in files and prints every line that matches.

### Basic Usage

```bash
grep "ERROR" server.log
```

This prints every line in `server.log` that contains the text "ERROR".

### Useful `grep` Flags

```bash
grep -i "error" server.log       # case-insensitive search
grep -n "ERROR" server.log       # show line numbers
grep -c "ERROR" server.log       # count matching lines (just the number)
grep -v "INFO" server.log        # invert match — show lines that DON'T contain "INFO"
```

### Searching Multiple Files

```bash
grep "database" *.txt            # search all .txt files
grep -r "TODO" ~/projects/       # search recursively through a directory
grep -rl "TODO" ~/projects/      # just list filenames that contain matches
```

The `-r` flag makes `grep` search through directories recursively. The `-l` flag shows only filenames, not the matching lines themselves.

### Combining Flags

Flags can be combined. This is common and encouraged:

```bash
grep -in "error" server.log      # case-insensitive with line numbers
grep -rn "TODO" ~/projects/      # recursive with line numbers
grep -cv "^#" config.txt         # count lines that aren't comments
```

### Context Around Matches

Sometimes you need to see what's around a match, not just the matching line:

```bash
grep -A 2 "ERROR" server.log    # show 2 lines After each match
grep -B 2 "ERROR" server.log    # show 2 lines Before each match
grep -C 2 "ERROR" server.log    # show 2 lines of Context (before and after)
```

This is invaluable when reading logs — the error itself often only makes sense with surrounding context.

---

## Basic Pattern Matching in `grep`

`grep` supports regular expressions — patterns that match text. You don't need to master regex right now, but a few basics go a long way.

### The Dot — Match Any Character

```bash
grep "db_...." config.txt     # matches "db_" followed by any 4 characters
```

### Start and End of Line

```bash
grep "^#" config.txt          # lines that start with #
grep "false$" config.txt      # lines that end with "false"
grep "^$" config.txt          # empty lines
```

The `^` means "start of line" and `$` means "end of line."

### Character Classes

```bash
grep "[0-9]" config.txt       # lines containing any digit
grep "^[^#]" config.txt       # lines that don't start with # (inside brackets, ^ means "not")
```

### Extended Regular Expressions with `-E`

The `-E` flag enables extended regex, which gives you more pattern options:

```bash
grep -E "ERROR|WARN" server.log        # matches ERROR or WARN
grep -E "attempt [0-9]+" server.log    # matches "attempt" followed by one or more digits
```

We'll revisit regex more in Lesson 10. For now, just knowing `^`, `$`, `.`, `[...]`, and `|` (with `-E`) covers most of what you'll need day to day.

---

## Other Useful Viewing Commands

### `sort` — Sort Lines

```bash
sort config.txt              # sort alphabetically
sort -r config.txt           # reverse sort
sort -n numbers.txt          # numeric sort (so 10 comes after 9, not after 1)
```

### `uniq` — Remove Duplicate Lines

```bash
sort config.txt | uniq       # remove duplicates (file must be sorted first)
sort config.txt | uniq -c    # show count of each unique line
```

`uniq` only removes *adjacent* duplicates, which is why you almost always pair it with `sort`.

### `diff` — Compare Two Files

```bash
cp config.txt config-new.txt
echo "debug=true" >> config-new.txt
diff config.txt config-new.txt
```

`diff` shows you the differences between two files. It's the foundation of how version control systems like Git track changes.

---

## Try It Yourself

1. Use `cat -n` to view `config.txt` with line numbers. What's on line 8?

2. Use `less` to open `server.log`. Search for "ERROR" using `/ERROR`. How many errors are there? (Use `n` to find each one, or exit and use `grep -c`.)

3. Use `head -5 server.log` to see the first 5 log entries.

4. Use `tail -5 server.log` to see the last 5 entries.

5. Use `grep` to find all lines in `config.txt` that contain "enable". How many are there?

6. Use `grep -v "^#" config.txt | grep -v "^$"` to show only the actual configuration values (no comments, no blank lines).

7. Use `grep -c "INFO" server.log` to count the number of INFO messages.

8. Use `grep -C 1 "ERROR" server.log` to see context around each error.

9. Create a copy of `config.txt`, change one value in it using `nano`, then use `diff` to see the difference.

10. Run `grep -E "ERROR|WARN" server.log` to find all problems in the log at once.

---

## Key Takeaways

- `cat` is for small files. `less` is for large files. Know when to use which.
- `head` and `tail` show the beginning and end of files. `tail -f` follows files in real time — essential for watching logs.
- `grep` is your search tool. Learn its flags: `-i` (case-insensitive), `-n` (line numbers), `-r` (recursive), `-v` (invert), `-c` (count), `-A`/`-B`/`-C` (context).
- Basic regex patterns (`^`, `$`, `.`, `[...]`, `|`) make your searches far more powerful.
- `sort`, `uniq`, and `diff` round out your text analysis toolkit.

---

*Next up: [Lesson 04 — Pipes and Redirection](04-pipes-and-redirection.md)*
