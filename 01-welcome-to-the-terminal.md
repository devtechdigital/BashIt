# Lesson 01: Welcome to the Terminal

**Time: ~30 minutes**

---

## What Is Bash?

Bash stands for "Bourne Again Shell." It's a program that takes commands you type and tells your computer what to do. That's it. Every time you open a terminal window, you're starting a bash session (or a similar shell like zsh — more on that shortly).

The terminal might look intimidating with its blinking cursor and blank screen, but here's the thing: it's just a different way to do what you already do with your mouse. Instead of clicking on a folder to open it, you type a command. Instead of dragging a file to the trash, you type a command. The difference is that typing commands is *faster*, *repeatable*, and *automatable* in ways that clicking around never will be.

### Bash vs Shell vs Terminal — Clearing Up the Confusion

These terms get used interchangeably, but they mean different things:

- **Terminal** (or terminal emulator) — the application window you type into. It's just a container.
- **Shell** — the program running *inside* the terminal that interprets your commands. Bash is one shell. Zsh is another. Fish is another.
- **Bash** — a specific shell, and the one we're learning. It's the default on most Linux systems and was the default on macOS until Catalina (which switched to zsh).

If you're on macOS and using zsh, don't worry. Everything in this course works in zsh too. The differences are minor and won't matter until you're much more advanced.

---

## Opening Your Terminal

**macOS:** Press `Cmd + Space`, type "Terminal", hit Enter. Or find it in Applications → Utilities → Terminal.

**Linux:** Press `Ctrl + Alt + T` on most distributions. Or find your terminal application in your app menu.

You should see something like this:

```
kevin@macbook ~ %
```

or

```
kevin@ubuntu:~$
```

This is your **prompt**. It's telling you the shell is ready and waiting for you to type something. The `~` means you're in your home directory (we'll cover that next). The `$` or `%` is just the prompt character — it's not something you type.

---

## Your First Commands

Type each of these and press Enter. Watch what happens.

### `pwd` — Print Working Directory

```bash
pwd
```

This tells you where you are in the filesystem right now. You should see something like `/Users/kevin` (macOS) or `/home/kevin` (Linux). This is your **home directory** — your personal space on the computer.

### `ls` — List

```bash
ls
```

This shows you what's in the current directory. You should recognise these — they're the same folders you see in Finder or your file manager: Desktop, Documents, Downloads, etc.

### `echo` — Print Text

```bash
echo "Hello from the terminal"
```

This just prints whatever you give it. Simple, but you'll use it constantly — for debugging, for displaying information, for writing to files.

---

## Navigating the Filesystem

Your computer's filesystem is a tree. At the top is the **root**, written as `/`. Everything lives below it. Your home directory is a branch on that tree.

Here's a simplified view:

```
/                       ← root
├── Users/              ← (macOS) or /home/ (Linux)
│   └── kevin/          ← your home directory (~)
│       ├── Desktop/
│       ├── Documents/
│       └── Downloads/
├── usr/
│   ├── bin/            ← where many commands live
│   └── local/
├── etc/                ← system configuration files
├── tmp/                ← temporary files
└── var/                ← variable data (logs, etc.)
```

### `cd` — Change Directory

This is how you move around.

```bash
cd Documents
```

You just moved into your Documents folder. Run `pwd` to confirm — it should show `/Users/kevin/Documents` or similar.

Now go back:

```bash
cd ..
```

The `..` means "one level up" — the parent directory. You're back in your home directory.

Some important shortcuts:

```bash
cd ~          # go to your home directory (from anywhere)
cd            # same thing — cd with no argument goes home
cd -          # go back to the previous directory you were in
cd /          # go to the root of the filesystem
cd ../..      # go up two levels
```

### Path Types: Absolute vs Relative

There are two ways to specify a location:

**Absolute paths** start from the root `/` and spell out the full location:
```bash
cd /Users/kevin/Documents/Projects
```

**Relative paths** start from where you are now:
```bash
cd Documents/Projects
```

Both get you to the same place. Use whichever makes sense. If you're already close to where you want to be, a relative path is shorter. If you want to be unambiguous, use absolute.

---

## Getting Help

Almost every command has built-in documentation. There are two ways to access it:

### `man` — Manual Pages

```bash
man ls
```

This opens the full manual for `ls`. It tells you every option, every flag, every behaviour. Use arrow keys to scroll, press `q` to quit.

Manual pages can be dense. That's OK. You don't need to read the whole thing — just scan for what you need.

### `--help` Flag

Most commands support a shorter help summary:

```bash
ls --help
```

(On macOS, some built-in commands don't support `--help`. Use `man` instead.)

### `type` and `which` — Finding Commands

Want to know where a command lives or what it is?

```bash
type ls        # tells you what kind of command ls is
which python   # tells you the full path to the python executable
```

---

## Useful `ls` Options

Plain `ls` gives you the basics. These flags give you more:

```bash
ls -l          # long format — shows permissions, size, date
ls -a          # show hidden files (files starting with .)
ls -la         # combine both — this is the one you'll use most
ls -lh         # human-readable file sizes (KB, MB instead of bytes)
ls -lt         # sort by modification time (newest first)
ls -lS         # sort by file size (largest first)
```

Hidden files are files whose names start with a dot, like `.bashrc` or `.gitconfig`. They're hidden by default to reduce clutter, but they're often important configuration files. The `-a` flag reveals them.

---

## Setting Up Your Practice Space

Let's create a folder for these lessons. We'll learn `mkdir` properly in the next lesson, but for now, just type:

```bash
cd ~
mkdir -p bash-lessons
cd bash-lessons
pwd
```

You should see something like `/Users/kevin/bash-lessons`. This is where you'll do all your practice work for the rest of the course.

---

## Tab Completion — Your New Best Friend

This is possibly the most useful thing you'll learn today. Start typing a command or filename and press `Tab`:

```bash
cd Docu<Tab>
```

Bash will auto-complete to `cd Documents/` (assuming that's the only match). If there are multiple matches, press `Tab` twice to see all options.

This saves you an enormous amount of typing and prevents typos. Use it constantly. If you take one habit away from this lesson, let it be this.

---

## Command History

Bash remembers everything you type.

- Press the **Up arrow** to cycle through previous commands
- Press the **Down arrow** to go forward
- Type `history` to see a numbered list of recent commands
- Press `Ctrl + R` and start typing to **search** your history — this is incredibly useful

```bash
history          # see your command history
history | tail   # see just the last 10 commands
```

---

## Try It Yourself

Complete these exercises in your terminal. Don't copy and paste — type them out.

1. Open your terminal and run `pwd`. Note your home directory path.
2. Run `ls -la` in your home directory. Find three hidden files (starting with `.`).
3. Navigate to `/tmp` using an absolute path. Run `pwd` to confirm. Navigate back home with `cd ~`.
4. Navigate to your Documents folder. Then use `cd -` to jump back. Use `cd -` again. Notice how it toggles between two locations.
5. Use `ls -lt` in your home directory to find the most recently modified file or folder.
6. Navigate to your `bash-lessons` folder. Run `ls -la`. It should be empty (except for `.` and `..`).
7. Use `man ls` to find out what the `-R` flag does. Try it out.
8. Use `Ctrl + R` and search your history for "pwd". Press Enter to re-run it.

---

## Key Takeaways

- The terminal is just a text-based way to interact with your computer. Nothing magical, nothing scary.
- `pwd` tells you where you are. `ls` shows what's here. `cd` moves you around.
- Absolute paths start with `/`. Relative paths start from your current location.
- `..` means the parent directory. `~` means your home directory.
- Use `Tab` for auto-completion. Use `Up arrow` and `Ctrl + R` for history. These save you enormous time.
- Use `man` or `--help` when you're not sure what a command does.

---

*Next up: [Lesson 02 — Files and Directories](02-files-and-directories.md)*
