# Lesson 10: Text Processing Power Tools

**Time: ~30 minutes**

---

## Beyond `grep`

You already know `grep` for finding lines that match a pattern. But bash has an entire toolkit for transforming, extracting, and reshaping text. These tools date back to the 1970s, but they're still used daily by developers and sysadmins because they work, they're fast, and they compose beautifully with pipes.

This lesson covers `cut`, `tr`, `sort`, `uniq`, `sed`, and `awk` — the workhorses of text processing.

---

## Setup

Let's create some data to practice with:

```bash
cd ~/bash-lessons
mkdir -p lesson10
cd lesson10

cat > employees.csv << 'EOF'
id,name,department,salary,start_date
1,Alice Johnson,Engineering,95000,2021-03-15
2,Bob Smith,Marketing,72000,2020-07-01
3,Charlie Brown,Engineering,88000,2022-01-10
4,Diana Prince,Sales,78000,2019-11-20
5,Eve Williams,Engineering,102000,2018-05-01
6,Frank Castle,Marketing,68000,2023-02-14
7,Grace Hopper,Engineering,115000,2017-09-01
8,Henry Ford,Sales,82000,2021-06-15
9,Iris Chang,Marketing,75000,2022-08-01
10,Jack Ryan,Sales,91000,2020-01-10
EOF

cat > access.log << 'EOF'
192.168.1.10 - - [15/Jan/2025:10:23:45] "GET /index.html" 200 1024
192.168.1.15 - - [15/Jan/2025:10:23:46] "GET /about.html" 200 2048
192.168.1.10 - - [15/Jan/2025:10:23:47] "POST /api/login" 401 128
192.168.1.22 - - [15/Jan/2025:10:23:48] "GET /index.html" 200 1024
192.168.1.10 - - [15/Jan/2025:10:23:49] "POST /api/login" 200 256
192.168.1.15 - - [15/Jan/2025:10:23:50] "GET /dashboard" 200 4096
192.168.1.33 - - [15/Jan/2025:10:23:51] "GET /index.html" 404 512
192.168.1.22 - - [15/Jan/2025:10:23:52] "GET /style.css" 200 768
192.168.1.10 - - [15/Jan/2025:10:23:53] "GET /api/data" 200 8192
192.168.1.33 - - [15/Jan/2025:10:23:54] "GET /missing.html" 404 512
EOF
```

---

## `cut` — Extract Columns

`cut` pulls out specific fields from each line.

### By Delimiter and Field Number

```bash
cut -d',' -f2 employees.csv           # names only
cut -d',' -f2,4 employees.csv         # names and salaries
cut -d',' -f2-4 employees.csv         # names through salaries (range)
```

`-d','` sets the delimiter to comma. `-f2` selects field 2.

### By Character Position

```bash
cut -c1-10 access.log                 # first 10 characters of each line
```

### Practical Use

Pull IP addresses from the access log:
```bash
cut -d' ' -f1 access.log
```

Extract just the department column (skipping the header):
```bash
tail -n +2 employees.csv | cut -d',' -f3
```

`tail -n +2` starts from line 2, effectively skipping the header.

---

## `tr` — Translate Characters

`tr` replaces or deletes characters. It works on individual characters, not words or patterns.

### Replace Characters

```bash
echo "Hello World" | tr 'a-z' 'A-Z'      # HELLO WORLD
echo "Hello World" | tr 'A-Z' 'a-z'      # hello world
echo "hello-world" | tr '-' '_'           # hello_world
```

### Squeeze Repeated Characters

```bash
echo "too    many    spaces" | tr -s ' '  # too many spaces
```

`-s` squeezes consecutive identical characters into one.

### Delete Characters

```bash
echo "Price: $42.50" | tr -d '$'          # Price: 42.50
echo "Hello123World" | tr -d '0-9'        # HelloWorld
```

### Converting Line Endings

A common use — converting Windows line endings to Unix:
```bash
tr -d '\r' < windows_file.txt > unix_file.txt
```

---

## `sort` and `uniq` — Ordering and Deduplication

You've seen these before, but they have more depth than basic usage suggests.

### `sort` Options

```bash
sort employees.csv                         # alphabetical (default)
sort -t',' -k4 -n employees.csv           # sort by salary (field 4, numeric)
sort -t',' -k4 -rn employees.csv          # sort by salary, highest first
sort -t',' -k3,3 -k4,4rn employees.csv   # sort by department, then salary descending
```

`-t','` sets the field separator. `-k4` sorts by field 4. `-n` sorts numerically. `-r` reverses. You can chain `-k` options for multi-level sorting.

### `uniq` Requires Sorted Input

`uniq` only removes *adjacent* duplicates. Always sort first:

```bash
# Unique departments
tail -n +2 employees.csv | cut -d',' -f3 | sort | uniq

# Count employees per department
tail -n +2 employees.csv | cut -d',' -f3 | sort | uniq -c | sort -rn
```

`uniq -c` prefixes each line with a count. `uniq -d` shows only duplicates. `uniq -u` shows only unique lines.

Alternatively, `sort -u` combines sorting and deduplication in one step:
```bash
tail -n +2 employees.csv | cut -d',' -f3 | sort -u
```

---

## `sed` — Stream Editor

`sed` processes text line by line, applying transformations. It's a deep tool — we'll cover the essentials.

### Find and Replace

```bash
sed 's/Engineering/Eng/' employees.csv          # replace first occurrence per line
sed 's/Engineering/Eng/g' employees.csv         # replace ALL occurrences per line
```

The `s/old/new/` command is sed's bread and butter. The `g` flag means "global" — replace all matches on the line, not just the first.

### Case-Insensitive Replace

```bash
sed 's/alice/ALICE/Ig' employees.csv            # I flag for case-insensitive
```

(The `I` flag is a GNU sed extension — it works on Linux but not on default macOS sed.)

### Delete Lines

```bash
sed '1d' employees.csv                          # delete line 1 (the header)
sed '/^$/d' file.txt                            # delete empty lines
sed '/^#/d' config.txt                          # delete comment lines
```

### Print Specific Lines

```bash
sed -n '3p' employees.csv                       # print only line 3
sed -n '2,5p' employees.csv                     # print lines 2-5
sed -n '/Engineering/p' employees.csv           # print lines matching a pattern
```

`-n` suppresses default output. `p` explicitly prints matching lines. Without `-n`, sed prints every line *plus* the matched lines again.

### Multiple Operations

```bash
sed -e 's/Engineering/ENG/' -e 's/Marketing/MKT/' -e 's/Sales/SLS/' employees.csv
```

Or use a semicolon:
```bash
sed 's/Engineering/ENG/; s/Marketing/MKT/; s/Sales/SLS/' employees.csv
```

### In-Place Editing

```bash
sed -i 's/old/new/g' file.txt             # Linux: edits the file directly
sed -i '' 's/old/new/g' file.txt          # macOS: requires empty string after -i
```

Always back up before using `-i`, or use `-i.bak` to create an automatic backup:
```bash
sed -i.bak 's/old/new/g' file.txt        # edits file.txt, saves original as file.txt.bak
```

### Capture Groups

```bash
# Swap first and last names
echo "Johnson, Alice" | sed 's/\(.*\), \(.*\)/\2 \1/'
# Output: Alice Johnson
```

`\(...\)` captures a group. `\1`, `\2` reference captured groups.

---

## `awk` — Pattern Scanning and Processing

`awk` is the most powerful text processing tool in the standard toolkit. It's essentially a small programming language. We'll cover the most useful parts.

### Basic Structure

```bash
awk 'pattern { action }' file
```

For each line in the file: if it matches the pattern, execute the action. If no pattern is given, the action runs on every line.

### Fields

`awk` automatically splits each line into fields. By default, it splits on whitespace:

```bash
echo "Alice 95000 Engineering" | awk '{ print $1 }'          # Alice
echo "Alice 95000 Engineering" | awk '{ print $3, $1 }'      # Engineering Alice
```

`$1` is the first field, `$2` the second, etc. `$0` is the entire line. `$NF` is the last field.

### Setting the Field Separator

For CSV data:
```bash
awk -F',' '{ print $2 }' employees.csv                       # print names
awk -F',' '{ print $2, $4 }' employees.csv                   # names and salaries
```

### Filtering Rows

```bash
awk -F',' '$3 == "Engineering"' employees.csv                 # engineering only
awk -F',' '$4 > 90000' employees.csv                          # salary > 90000
awk -F',' '$4 > 90000 { print $2, $4 }' employees.csv        # names and salaries > 90k
```

### Built-in Variables

| Variable | Meaning |
|----------|---------|
| `NR` | Current line number (row count) |
| `NF` | Number of fields in current line |
| `FS` | Field separator (same as -F) |
| `$0` | Entire current line |

```bash
awk -F',' 'NR > 1 { print NR-1, $2 }' employees.csv         # skip header, number rows
awk '{ print NF, $0 }' access.log                             # show field count per line
```

### Calculations

```bash
# Average salary
awk -F',' 'NR > 1 { sum += $4; count++ } END { print "Average:", sum/count }' employees.csv

# Total salary by department
awk -F',' 'NR > 1 { dept[$3] += $4 } END { for (d in dept) print d, dept[d] }' employees.csv
```

The `END` block runs after all lines have been processed. Arrays in `awk` are associative (like dictionaries/hash maps).

### Formatted Output

```bash
awk -F',' 'NR > 1 { printf "%-20s %s %10s\n", $2, $3, "$"$4 }' employees.csv
```

`printf` gives you control over column widths and alignment — same syntax as C's `printf`.

---

## Combining the Tools

The real power comes from combining these tools in pipelines.

### Top 3 Most Active IPs in the Access Log

```bash
cut -d' ' -f1 access.log | sort | uniq -c | sort -rn | head -3
```

### List Engineering Employees Sorted by Salary

```bash
awk -F',' '$3 == "Engineering" { print $4, $2 }' employees.csv | sort -rn
```

### Find All 404 Errors and the Requested URLs

```bash
awk '$9 == "404" { print $7 }' access.log | sort -u
```

(Field numbers differ here because the access log uses spaces as separators.)

### Replace Department Names and Create a New File

```bash
sed '1d' employees.csv | awk -F',' '{ gsub(/Engineering/, "ENG", $3); print }' OFS=','
```

---

## Try It Yourself

1. Extract all unique IP addresses from `access.log` and count how many requests each made. Sort by count, highest first.

2. Calculate the average salary per department from `employees.csv` using `awk`.

3. Use `sed` to remove the header from `employees.csv` and replace all commas with tabs. Save to `employees.tsv`.

4. Find employees who started in 2021 or later (compare the start_date field) using `awk`.

5. From `access.log`, extract just the HTTP status codes (200, 401, 404) and count how many of each occurred.

6. Create a pipeline that produces a formatted report showing each department, the number of employees, and the total salary spend, sorted by total salary.

---

## Key Takeaways

- `cut` extracts columns by delimiter (`-d`) and field number (`-f`). Quick and simple.
- `tr` transforms individual characters — case conversion, character deletion, squeeze repeats.
- `sort` + `uniq` is the standard pattern for counting and deduplication. Always sort before uniq.
- `sed` does find-and-replace (`s/old/new/g`), line deletion, and line extraction. Use `-i` for in-place editing.
- `awk` is a mini-language for field-based processing. It handles filtering, calculations, and formatted output in one tool.
- These tools combine through pipes to form powerful data processing pipelines with zero setup.

---

*Next up: [Lesson 11 — Process Management and Job Control](11-process-management-and-job-control.md)*
