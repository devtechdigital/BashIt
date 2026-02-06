# Lesson 06: Your First Bash Script

**Time: ~30 minutes**

---

## From Commands to Scripts

Up to now, you've been typing commands one at a time. That's fine for quick tasks, but as soon as you find yourself running the same sequence of commands more than twice, it's time to put them in a script.

A bash script is just a text file containing commands. When you run it, bash executes each line in order — exactly as if you'd typed them yourself. That's all a script is. No compilation, no special tooling. Write it, make it executable, run it.

---

## Anatomy of a Script

Create your first script:

```bash
cd ~/bash-lessons
mkdir -p lesson06
cd lesson06
```

Open a new file in your editor:

```bash
nano greet.sh
```

Type this:

```bash
#!/bin/bash

# A simple greeting script
echo "Hello! Today is $(date '+%A, %B %d, %Y')."
echo "You are logged in as: $USER"
echo "Your current directory is: $PWD"
```

Save and exit (`Ctrl + O`, then `Ctrl + X` in nano).

Now make it executable and run it:

```bash
chmod +x greet.sh
./greet.sh
```

Let's break down what's happening.

### The Shebang Line

```bash
#!/bin/bash
```

The first line of every bash script. The `#!` (called a "shebang" or "hashbang") tells the system which interpreter to use. `/bin/bash` means "run this file using bash." Without this line, the system might try to interpret your script with a different shell.

Some systems have bash at `/usr/bin/bash`. A more portable alternative is:

```bash
#!/usr/bin/env bash
```

This finds bash wherever it's installed. Use either one — both work. Just pick one and be consistent.

### Comments

```bash
# This is a comment
```

Lines starting with `#` (other than the shebang) are comments. Bash ignores them. Write comments to explain *why* you're doing something, not *what* you're doing — the code already shows the what.

### Running the Script

The `./` prefix tells bash to look for the script in the current directory. Without it, bash searches your PATH (a list of standard directories) and won't find your script.

Alternatively, you can run a script without making it executable:

```bash
bash greet.sh
```

This explicitly tells bash to interpret the file. It works, but making scripts executable with `chmod +x` is the standard practice.

---

## Variables

Variables store values. In bash, you create them with `=` and access them with `$`.

```bash
#!/bin/bash

name="Kevin"
project="Project 412"
count=42

echo "Name: $name"
echo "Project: $project"
echo "Count: $count"
```

### Critical Rules for Variables

**No spaces around the `=` sign.** This is the number one mistake beginners make.

```bash
name="Kevin"       # correct
name = "Kevin"     # WRONG — bash thinks "name" is a command with arguments "=" and "Kevin"
```

**Use quotes when the value contains spaces:**

```bash
greeting="Hello World"     # correct
greeting=Hello World       # WRONG — "World" becomes a separate command
```

**Use `$` to read a variable, nothing to set it:**

```bash
city="Perth"          # setting — no $
echo "$city"          # reading — use $
echo "I live in $city"
```

### Curly Braces for Clarity

When a variable name could be ambiguous, use `${variable}`:

```bash
file="report"
echo "${file}_final.txt"    # report_final.txt
echo "$file_final.txt"      # WRONG — looks for variable named "file_final"
```

The curly braces tell bash exactly where the variable name ends.

### Variable Naming Conventions

- Use lowercase for local variables in scripts: `filename`, `count`, `output_dir`
- Use UPPERCASE for environment variables and constants: `PATH`, `HOME`, `MAX_RETRIES`
- Use underscores to separate words: `log_file`, not `logfile` or `logFile`

---

## Environment Variables

Some variables are already set by the system. These are called environment variables:

```bash
echo "$HOME"        # your home directory
echo "$USER"        # your username
echo "$PATH"        # directories bash searches for commands
echo "$SHELL"       # your default shell
echo "$PWD"         # current working directory
echo "$HOSTNAME"    # your computer's name
```

You can create your own environment variables with `export`:

```bash
export API_KEY="sk-abc123"
```

The `export` keyword makes the variable available to child processes — programs you launch from this shell. Without `export`, the variable only exists in the current shell.

---

## Command Substitution

You can capture the output of a command and use it as a value:

```bash
current_date=$(date '+%Y-%m-%d')
file_count=$(ls | wc -l)
my_ip=$(curl -s ifconfig.me)

echo "Date: $current_date"
echo "Files in current directory: $file_count"
echo "My IP: $my_ip"
```

The `$(command)` syntax runs the command and substitutes its output. You'll see an older syntax using backticks `` `command` `` — it does the same thing but is harder to read and can't be nested. Use `$()`.

---

## Reading User Input

The `read` command waits for the user to type something:

```bash
#!/bin/bash

echo "What is your name?"
read name
echo "Hello, $name!"
```

### `read` with a Prompt

```bash
read -p "Enter your name: " name
echo "Hello, $name!"
```

The `-p` flag displays a prompt on the same line.

### `read` with a Default Value

```bash
read -p "Enter port (default 8080): " port
port=${port:-8080}
echo "Using port: $port"
```

The `${variable:-default}` syntax means "use the variable's value, but if it's empty, use this default instead." This is one of the most useful patterns in bash scripting.

### Reading Sensitive Input

```bash
read -sp "Enter password: " password
echo    # print a newline since -s suppresses it
echo "Password is ${#password} characters long."
```

The `-s` flag hides what the user types (for passwords). `${#variable}` gives the length of a string.

---

## Script Arguments

Instead of asking for input interactively, you can pass arguments when running the script:

```bash
./myscript.sh arg1 arg2 arg3
```

Inside the script, these are accessed with special variables:

```bash
#!/bin/bash

echo "Script name: $0"
echo "First argument: $1"
echo "Second argument: $2"
echo "All arguments: $@"
echo "Number of arguments: $#"
```

Save this as `args.sh`, make it executable, and try:

```bash
./args.sh hello world
```

### A Practical Example

```bash
#!/bin/bash

# backup.sh — create a timestamped backup of a file
# Usage: ./backup.sh filename

if [ $# -eq 0 ]; then
    echo "Usage: $0 filename"
    echo "Creates a timestamped backup of the specified file."
    exit 1
fi

source_file="$1"
timestamp=$(date '+%Y%m%d_%H%M%S')
backup_file="${source_file}.backup_${timestamp}"

cp "$source_file" "$backup_file"
echo "Backed up: $source_file → $backup_file"
```

Don't worry about the `if` statement — that's next lesson. Just note the pattern: check that arguments were provided, use them as variables, do the work.

---

## Quoting: Singles, Doubles, and None

Quoting in bash is a source of subtle bugs. Here are the rules:

### Double Quotes — Variable Expansion

```bash
name="Kevin"
echo "Hello, $name"       # Hello, Kevin — variables are expanded
echo "Path is $HOME"      # Path is /Users/kevin
echo "Date: $(date)"      # Date: Thu Jan 15... — command substitution works
```

Double quotes preserve spaces and expand variables. **Use double quotes around variables as a default habit:**

```bash
filename="my file.txt"
cat "$filename"            # correct — treats "my file.txt" as one argument
cat $filename              # WRONG — bash sees two arguments: "my" and "file.txt"
```

### Single Quotes — Literal Text

```bash
echo 'Hello, $name'       # Hello, $name — the literal text, no expansion
echo 'Cost is $5.00'      # Cost is $5.00 — useful when you want literal dollar signs
```

Single quotes prevent all expansion. What you type is exactly what you get.

### No Quotes — Word Splitting

```bash
files="file1.txt file2.txt"
ls $files                  # works — bash splits into two arguments
ls "$files"                # fails — bash treats the whole string as one filename
```

Without quotes, bash splits on whitespace and expands wildcards. This is sometimes useful but usually a source of bugs. The safe default is to **always quote your variables** unless you specifically want word splitting.

---

## Exit Codes

Every command returns a number when it finishes: 0 means success, anything else means failure.

```bash
ls /tmp
echo $?        # 0 — success

ls /nonexistent
echo $?        # 2 (or non-zero) — failure
```

The `$?` variable holds the exit code of the last command. You can set your own in scripts:

```bash
#!/bin/bash

if [ -f "$1" ]; then
    echo "File exists."
    exit 0
else
    echo "File not found."
    exit 1
fi
```

Exit codes matter because they let other tools and scripts check whether your script succeeded.

---

## Try It Yourself

1. Create a script called `sysinfo.sh` that prints:
   - Your username
   - Your home directory
   - The current date and time
   - The number of files in your home directory
   Make it executable and run it.

2. Create a script called `greet.sh` that takes a name as an argument and prints "Hello, [name]! Welcome." If no name is given, print a usage message and exit with code 1.

3. Create a script called `mkproject.sh` that:
   - Takes a project name as an argument
   - Creates a directory with that name
   - Creates `README.md`, `notes.txt`, and a `src/` subdirectory inside it
   - Prints a confirmation message

4. Create a script that uses `read -p` to ask for a city name, then prints "You chose [city]!" Use a default of "Perth" if nothing is entered.

5. Experiment with quoting. Create a variable containing a filename with spaces. Try accessing it with and without double quotes to see the difference.

---

## Key Takeaways

- A bash script is a text file with a `#!/bin/bash` shebang, made executable with `chmod +x`.
- Variables are set with `name=value` (no spaces!) and read with `$name`.
- Always quote your variables: `"$variable"`. This prevents word-splitting bugs.
- `$(command)` captures command output. Use it to store dates, counts, or any dynamic value.
- `$1`, `$2`, etc. are script arguments. `$#` is the argument count. `$@` is all arguments.
- `read -p` gets user input. `${var:-default}` provides fallback values.
- Exit codes (`exit 0` for success, `exit 1` for failure) let other tools know if your script worked.

---

*Next up: [Lesson 07 — Conditionals and Logic](07-conditionals-and-logic.md)*
