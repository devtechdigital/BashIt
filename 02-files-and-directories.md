# Lesson 02: Files and Directories

**Time: ~30 minutes**

---

## The Building Blocks

Everything on your computer is either a file or a directory (folder). That sounds obvious, but in the terminal, understanding this deeply matters. Directories are just special files that contain references to other files. There's no magic — just a tree of names pointing to data on disk.

In this lesson, you'll learn to create, copy, move, rename, and delete files and directories — all from the command line. Once you're comfortable with these commands, you'll rarely need a graphical file manager again.

---

## Creating Directories with `mkdir`

```bash
cd ~/bash-lessons
mkdir projects
```

That creates a directory called `projects` inside your current location. Verify with `ls`.

### Creating Nested Directories

What if you want to create a directory several levels deep?

```bash
mkdir projects/web/frontend
```

This fails if `projects/web` doesn't exist yet. The `-p` flag fixes that — it creates all necessary parent directories:

```bash
mkdir -p projects/web/frontend
mkdir -p projects/web/backend
mkdir -p projects/scripts
```

The `-p` flag is also safe to use on directories that already exist — it won't throw an error or overwrite anything.

---

## Creating Files

There are several ways to create files. Each has its place.

### `touch` — Create an Empty File

```bash
touch notes.txt
```

If the file doesn't exist, it creates an empty one. If it already exists, it updates the file's modification timestamp without changing its contents. This makes `touch` safe to run repeatedly.

Create several files at once:

```bash
touch file1.txt file2.txt file3.txt
```

### `echo` with Redirection — Create a File with Content

```bash
echo "This is my first file" > hello.txt
```

The `>` operator redirects the output of `echo` into a file. If the file exists, it gets **overwritten**. We'll cover redirection in depth in Lesson 04.

### Text Editors — Create and Edit Files

For anything more than a line or two, you'll want a text editor:

```bash
nano notes.txt     # simple terminal editor, good for beginners
vim notes.txt      # powerful but has a learning curve
code notes.txt     # opens in VS Code (if installed)
```

If you're new to terminal editors, use `nano`. It shows keyboard shortcuts at the bottom of the screen. `Ctrl + O` saves, `Ctrl + X` exits.

---

## Copying Files and Directories with `cp`

### Copying a File

```bash
cp hello.txt hello-backup.txt
```

This creates a duplicate. The original is untouched.

### Copying a File to Another Directory

```bash
cp hello.txt projects/
```

This puts a copy of `hello.txt` inside the `projects` directory.

### Copying a File to Another Directory with a New Name

```bash
cp hello.txt projects/greeting.txt
```

### Copying Directories

To copy a directory and everything inside it, you need the `-r` (recursive) flag:

```bash
cp -r projects projects-backup
```

Without `-r`, bash will refuse to copy a directory. This is a safety measure — copying a directory means copying potentially thousands of files, and bash wants you to be explicit about that.

---

## Moving and Renaming with `mv`

In bash, moving and renaming are the same operation. The `mv` command changes where a file lives — or what it's called.

### Renaming a File

```bash
mv hello.txt greetings.txt
```

The file `hello.txt` no longer exists. It's now called `greetings.txt`.

### Moving a File to Another Directory

```bash
mv greetings.txt projects/
```

The file is now at `projects/greetings.txt`. It's no longer in the current directory.

### Moving and Renaming at the Same Time

```bash
mv projects/greetings.txt projects/web/welcome.txt
```

### Moving Directories

Unlike `cp`, `mv` doesn't need a `-r` flag for directories. It just works:

```bash
mv projects-backup old-projects
```

### A Useful Safety Flag

The `-i` flag makes `mv` ask for confirmation before overwriting an existing file:

```bash
mv -i newfile.txt existingfile.txt
```

If `existingfile.txt` already exists, bash will ask you before replacing it. Without `-i`, it overwrites silently. Consider using `-i` when you're moving files into directories where name collisions might occur.

---

## Deleting Files and Directories with `rm`

This is the one command you need to be careful with. **There is no trash bin in the terminal.** When you `rm` a file, it's gone. No undo, no recovery.

### Deleting a File

```bash
rm file1.txt
```

Gone. Immediately. No confirmation.

### Deleting Multiple Files

```bash
rm file2.txt file3.txt
```

### Deleting with Confirmation

```bash
rm -i notes.txt
```

Bash will ask "remove notes.txt?" and wait for your `y` or `n`.

### Deleting Empty Directories

```bash
rmdir projects/scripts
```

`rmdir` only works on empty directories. This is a safety feature.

### Deleting Directories and Their Contents

```bash
rm -r old-projects
```

The `-r` (recursive) flag tells `rm` to delete the directory and everything inside it. Every file. Every subdirectory. All of it.

### The Dangerous Command

You'll see this in tutorials and Stack Overflow answers:

```bash
rm -rf something/
```

The `-f` (force) flag suppresses all confirmation prompts and ignores errors. Combined with `-r`, it deletes everything without asking. This is useful in scripts but dangerous when typed manually.

**Never run `rm -rf /` or `rm -rf ~`.** The first attempts to delete your entire filesystem. The second deletes your entire home directory. Modern systems have safeguards against the first one, but the second will ruin your day.

A good habit: always double-check the path before pressing Enter on any `rm -r` command. Read it twice.

---

## Wildcards and Globbing

Wildcards let you match multiple files with a pattern instead of naming each one individually.

### `*` — Matches Anything

```bash
ls *.txt           # all files ending in .txt
ls project*        # all files starting with "project"
cp *.txt projects/ # copy all .txt files into projects/
rm *.log           # delete all .log files
```

### `?` — Matches Exactly One Character

```bash
ls file?.txt       # matches file1.txt, file2.txt, but not file10.txt
```

### `[...]` — Matches Any Character in the Set

```bash
ls file[123].txt   # matches file1.txt, file2.txt, file3.txt
ls file[1-5].txt   # matches file1.txt through file5.txt
```

### Using Wildcards Safely

Before deleting with wildcards, preview what you're about to delete:

```bash
ls *.tmp           # see what matches
rm *.tmp           # then delete
```

Or use `rm -i *.tmp` to get confirmation for each file.

---

## Checking File Properties

### `file` — Determine File Type

```bash
file notes.txt          # "ASCII text"
file /usr/bin/bash      # "ELF 64-bit LSB executable..."
file photo.jpg          # "JPEG image data..."
```

The `file` command looks at the actual contents, not just the extension. A `.txt` file that contains binary data will be reported as binary.

### `stat` — Detailed File Information

```bash
stat notes.txt
```

This shows you everything: size, permissions, owner, creation date, modification date, inode number. It's more detail than you usually need, but it's there when you want it.

### `wc` — Word Count

```bash
wc notes.txt        # lines, words, characters
wc -l notes.txt     # just the line count
wc -w notes.txt     # just the word count
```

### `du` — Disk Usage

```bash
du -sh projects/     # total size of a directory, human-readable
du -sh */            # size of each subdirectory
```

---

## Try It Yourself

Work through these in your `~/bash-lessons` directory.

1. Create this directory structure in a single command:
   ```
   practice/
   ├── drafts/
   ├── final/
   └── archive/
   ```
   (Hint: `mkdir -p` can take multiple arguments.)

2. Create five files: `note1.txt` through `note5.txt` using `touch`.

3. Write "Draft version" into `note1.txt` using `echo` and `>`.

4. Copy `note1.txt` into the `practice/drafts/` directory.

5. Move `note2.txt` and `note3.txt` into `practice/drafts/`.

6. Rename `note4.txt` to `important.txt`.

7. Copy the entire `practice` directory to `practice-backup`.

8. Delete `note5.txt` and `important.txt`.

9. Use `ls *.txt` to see what `.txt` files remain in your current directory.

10. Use `du -sh practice/` to check the size of your practice directory.

---

## Key Takeaways

- `mkdir -p` creates directories and any missing parents. It's always safe to use.
- `touch` creates empty files or updates timestamps. `echo "text" > file` creates files with content.
- `cp` copies files. Add `-r` for directories.
- `mv` both moves and renames. It works on files and directories without any flags.
- `rm` deletes permanently. There is no undo. Use `rm -i` when you want confirmation. Use `rm -r` for directories.
- Wildcards (`*`, `?`, `[...]`) let you work with groups of files. Always preview with `ls` before deleting with wildcards.

---

*Next up: [Lesson 03 — Reading and Searching Files](03-reading-and-searching-files.md)*
