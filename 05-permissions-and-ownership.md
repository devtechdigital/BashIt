# Lesson 05: Permissions and Ownership

**Time: ~30 minutes**

---

## Why Permissions Exist

Every file and directory on your system has rules about who can do what with it. These rules exist for good reason: they prevent you from accidentally deleting system files, they keep other users out of your private data, and they control which programs can execute.

If you've ever seen "Permission denied" in your terminal, this lesson explains why — and how to fix it.

---

## Reading Permissions

Run `ls -la` in any directory:

```
drwxr-xr-x  5 kevin  staff   160 Jan 15 10:30 projects
-rw-r--r--  1 kevin  staff   425 Jan 15 09:15 config.txt
-rwxr-xr-x  1 kevin  staff  1024 Jan 14 14:22 deploy.sh
```

That first column is the permission string. Let's break it down using `-rw-r--r--` as an example:

```
-  rw-  r--  r--
│  │    │    │
│  │    │    └── Others (everyone else): read only
│  │    └─────── Group (staff): read only
│  └──────────── Owner (kevin): read and write
└─────────────── File type: - = file, d = directory, l = symlink
```

### The Three Permission Types

- **r** (read) — can view the file's contents, or list a directory's contents
- **w** (write) — can modify the file, or add/remove files in a directory
- **x** (execute) — can run the file as a program, or enter/traverse a directory

### The Three User Classes

Permissions are set for three groups of people:

- **Owner** (u) — the user who owns the file, usually whoever created it
- **Group** (g) — a group of users that the file belongs to
- **Others** (o) — everyone else on the system

### Reading the `ls -la` Output

The other columns tell you:

```
-rw-r--r--  1  kevin  staff  425  Jan 15 09:15  config.txt
│           │  │      │      │    │              │
│           │  │      │      │    │              └── filename
│           │  │      │      │    └── modification date
│           │  │      │      └── file size in bytes
│           │  │      └── group owner
│           │  └── user owner
│           └── number of hard links
└── permissions
```

---

## Directory Permissions

Permissions work slightly differently for directories:

- **r** on a directory means you can list its contents (`ls`)
- **w** on a directory means you can add or remove files inside it
- **x** on a directory means you can `cd` into it and access files within it

A directory with `r--` but no `x` is an odd case: you can see the names of files inside it, but you can't actually read or access them. You usually want `r` and `x` together for directories.

---

## Changing Permissions with `chmod`

There are two ways to use `chmod`: symbolic mode (letters) and numeric mode (numbers). Both do the same thing.

### Symbolic Mode

The format is: `chmod [who][operator][permission] file`

**Who:** `u` (owner), `g` (group), `o` (others), `a` (all three)
**Operator:** `+` (add), `-` (remove), `=` (set exactly)
**Permission:** `r`, `w`, `x`

```bash
chmod u+x script.sh        # give the owner execute permission
chmod g-w config.txt        # remove write permission from the group
chmod o-rwx private.txt     # remove all permissions from others
chmod a+r readme.txt        # give everyone read permission
chmod u=rwx,g=rx,o=r file   # set exact permissions for each class
```

### Numeric (Octal) Mode

Each permission has a numeric value:
- r = 4
- w = 2
- x = 1

You add these values together for each user class to get a three-digit number:

```
rwx = 4+2+1 = 7
rw- = 4+2+0 = 6
r-x = 4+0+1 = 5
r-- = 4+0+0 = 4
--- = 0+0+0 = 0
```

So a three-digit number represents owner, group, and others:

```bash
chmod 755 script.sh        # rwxr-xr-x — owner can do everything, others can read/execute
chmod 644 config.txt       # rw-r--r-- — owner can read/write, others can only read
chmod 700 private/         # rwx------ — only the owner can access
chmod 600 secrets.txt      # rw------- — only the owner can read/write
```

### Common Permission Patterns

| Numeric | Symbolic | Meaning | Typical Use |
|---------|----------|---------|-------------|
| 755 | rwxr-xr-x | Owner full, others read/execute | Scripts, programs, directories |
| 644 | rw-r--r-- | Owner read/write, others read | Regular files, configs |
| 700 | rwx------ | Owner only, full access | Private directories |
| 600 | rw------- | Owner only, read/write | SSH keys, sensitive files |
| 666 | rw-rw-rw- | Everyone read/write | Rarely a good idea |
| 777 | rwxrwxrwx | Everyone everything | Almost never use this |

### Making Scripts Executable

This is the most common `chmod` use case you'll encounter:

```bash
echo '#!/bin/bash' > myscript.sh
echo 'echo "It works!"' >> myscript.sh
./myscript.sh                # Permission denied
chmod +x myscript.sh         # shorthand for chmod a+x
./myscript.sh                # It works!
```

When you write `chmod +x`, it adds execute permission for everyone. This is what you'll do every time you create a new bash script.

### Recursive Permission Changes

```bash
chmod -R 755 projects/      # apply 755 to the directory and everything inside it
```

Be careful with `-R`. It applies the same permissions to files and directories, which isn't always what you want. Files usually don't need execute permission. A safer approach:

```bash
find projects/ -type d -exec chmod 755 {} \;    # directories get 755
find projects/ -type f -exec chmod 644 {} \;    # files get 644
```

Don't worry about the `find -exec` syntax yet — we'll cover it later. Just know this pattern exists for when you need it.

---

## Ownership with `chown`

Every file has an owner and a group. You can change these with `chown`:

```bash
chown kevin file.txt           # change the owner to kevin
chown kevin:staff file.txt     # change owner and group
chown :staff file.txt          # change only the group
chown -R kevin:staff projects/ # change recursively
```

You generally need `sudo` (superuser privileges) to change ownership:

```bash
sudo chown kevin:staff file.txt
```

### What Is `sudo`?

`sudo` means "superuser do." It runs a single command with administrator privileges. The system will ask for your password.

```bash
sudo ls /root                  # view a protected directory
sudo chmod 644 /etc/somefile   # change permissions on a system file
```

Use `sudo` only when necessary. If a command works without it, don't add it. Running everything as superuser is a bad habit that can lead to accidentally modifying system files.

---

## Understanding "Permission Denied"

When you see this error, work through this checklist:

1. **Check the permissions:** `ls -la file.txt` — do you have the permission you need?
2. **Check the owner:** Is the file owned by you? If not, do you have group or other permissions?
3. **Check the parent directory:** Do you have `x` permission on every directory in the path?
4. **Try the fix:**
   - Need to read a file? `chmod u+r file.txt`
   - Need to run a script? `chmod u+x script.sh`
   - Need to write to a directory? `chmod u+w directory/`
   - File owned by root? `sudo` may be needed.

---

## The `umask` — Default Permissions

When you create a new file or directory, it gets default permissions. The `umask` controls what those defaults are.

```bash
umask           # shows current umask (usually 022)
```

The umask is *subtracted* from the maximum permissions:
- Files max: 666 (rw-rw-rw-) — files don't get execute by default
- Directories max: 777 (rwxrwxrwx)

With a umask of 022:
- New files: 666 - 022 = 644 (rw-r--r--)
- New directories: 777 - 022 = 755 (rwxr-xr-x)

You rarely need to change the umask, but understanding it explains why your files get the permissions they do.

---

## Special Permissions (Brief Overview)

You'll occasionally encounter these. You don't need to memorise them now, but knowing they exist helps when you see unfamiliar permission strings.

**Setuid (s in owner execute):** When a setuid program runs, it executes with the permissions of the file's owner, not the person running it. `passwd` uses this to modify system files.

**Setgid (s in group execute):** Similar to setuid but for the group. On directories, new files inherit the directory's group.

**Sticky bit (t in others execute):** On directories, prevents users from deleting files they don't own. The `/tmp` directory uses this — everyone can create files there, but only the owner can delete their own.

```
-rwsr-xr-x   ← setuid (note the s in owner execute)
drwxrwsr-x   ← setgid on a directory
drwxrwxrwt   ← sticky bit (note the t)
```

---

## Try It Yourself

```bash
cd ~/bash-lessons
mkdir -p lesson05
cd lesson05
```

1. Create a file called `public.txt` with some content. Set its permissions so everyone can read it but only you can write to it. Verify with `ls -la`.

2. Create a script called `hello.sh` that contains `#!/bin/bash` and `echo "Hello!"`. Try to run it with `./hello.sh`. Fix the permission error and run it again.

3. Create a directory called `private`. Set its permissions to 700. Verify that `ls -la` shows `rwx------`.

4. Create a file called `readonly.txt`. Remove your own write permission with `chmod u-w readonly.txt`. Try to append to it with `echo "test" >> readonly.txt`. What happens? Restore write permission.

5. Check the permissions on `/etc/passwd` and `/etc/shadow` using `ls -la`. Notice the difference — one is world-readable, the other is not. This is by design.

6. Run `umask` to see your current default. Create a new file and directory and verify their permissions match what you'd expect from the umask.

---

## Key Takeaways

- Every file has three sets of permissions (owner, group, others) with three types each (read, write, execute).
- `chmod` changes permissions. Use symbolic mode (`chmod u+x`) for quick changes, numeric mode (`chmod 755`) when you want to set everything at once.
- `chmod +x script.sh` is what you'll use most often — making scripts executable.
- `chown` changes ownership. Usually requires `sudo`.
- "Permission denied" means you lack a specific permission. Check with `ls -la` and fix with `chmod`.
- Use `sudo` sparingly and intentionally. Don't make it a habit.
- 755 for directories and scripts, 644 for regular files, 600 for sensitive files — these three patterns cover most situations.

---

*Next up: [Lesson 06 — Your First Bash Script](06-your-first-bash-script.md)*
