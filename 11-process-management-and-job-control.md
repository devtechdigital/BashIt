# Lesson 11: Process Management and Job Control

**Time: ~30 minutes**

---

## Everything Is a Process

Every time you run a command, your system creates a process — a running instance of a program. When you type `ls`, a process starts, does its work, and exits. When you start a web server, that process stays running until you stop it. Your terminal itself is a process. Your shell is a process running inside it.

Understanding processes lets you see what's running, stop things that are stuck, run tasks in the background, and schedule scripts to run automatically.

---

## Viewing Processes

### `ps` — Process Status

```bash
ps                   # your processes in this terminal session
ps aux               # all processes on the system (detailed)
```

The `aux` flags mean: `a` = all users, `u` = user-oriented format, `x` = include processes without a terminal.

The output looks like:

```
USER       PID  %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
kevin     1234  0.0  0.1  12345  6789 pts/0    Ss   10:30   0:00 bash
kevin     5678  2.5  1.2  98765 43210 pts/0    Sl   10:31   0:15 node server.js
root         1  0.0  0.1   1234   567 ?        Ss   09:00   0:02 /sbin/init
```

Key columns:
- **PID** — Process ID. Every process has a unique number.
- **%CPU / %MEM** — resource usage
- **STAT** — state (S = sleeping, R = running, Z = zombie, T = stopped)
- **COMMAND** — what's running

### Finding Specific Processes

```bash
ps aux | grep node              # find Node.js processes
ps aux | grep -v grep | grep node   # same, but exclude the grep itself
```

The second version is a common pattern — `grep` matches its own process too, and `-v grep` filters that out.

A cleaner alternative:

```bash
pgrep -la node                  # find processes by name
```

### `top` and `htop` — Live Process Monitor

```bash
top                             # built-in, always available
htop                            # better interface (install with: sudo apt install htop)
```

`top` shows processes sorted by CPU usage, updating in real time. Press `q` to quit, `M` to sort by memory, `P` to sort by CPU.

`htop` is the same idea with a nicer interface, colour coding, and mouse support. If it's not installed, it's worth installing.

---

## Stopping Processes

### `kill` — Send Signals to Processes

```bash
kill 5678                       # send SIGTERM (polite "please stop") to PID 5678
kill -9 5678                    # send SIGKILL (forced stop, no cleanup)
```

`SIGTERM` (the default) asks the process to shut down gracefully — it can save state, close connections, and clean up. `SIGKILL` (-9) forces immediate termination with no cleanup. Always try `SIGTERM` first.

### Common Signals

| Signal | Number | Meaning |
|--------|--------|---------|
| SIGTERM | 15 | Terminate gracefully (default) |
| SIGKILL | 9 | Force kill immediately |
| SIGHUP | 1 | Hang up (often used to reload config) |
| SIGINT | 2 | Interrupt (same as Ctrl+C) |
| SIGSTOP | 19 | Pause the process |
| SIGCONT | 18 | Resume a paused process |

### Killing by Name

```bash
pkill node                      # kill all processes named "node"
pkill -f "python server.py"     # kill processes matching the full command line
killall node                    # similar to pkill (slightly different on macOS vs Linux)
```

Be careful with `pkill` and `killall` — they match broadly. Make sure you're not killing something you need.

---

## Background Jobs and Job Control

### Running Commands in the Background

Normally, when you run a command, your terminal waits until it finishes. For long-running tasks, you can send them to the background:

```bash
sleep 60 &                      # the & runs it in the background
```

The shell immediately gives you back the prompt. The `&` at the end is the key.

You'll see output like:
```
[1] 12345
```

This means job number 1, process ID 12345.

### Viewing Background Jobs

```bash
jobs                            # list background jobs in this shell
```

```
[1]+  Running                 sleep 60 &
```

### Moving Jobs Between Foreground and Background

**Suspend a running command:** Press `Ctrl + Z`. This pauses the process and puts it in the background (stopped).

```
^Z
[1]+  Stopped                 vim notes.txt
```

**Resume in the background:**
```bash
bg                              # resume the most recent stopped job in the background
bg %1                           # resume job number 1 specifically
```

**Bring back to the foreground:**
```bash
fg                              # bring the most recent background job to the foreground
fg %1                           # bring job 1 to the foreground
```

### A Typical Workflow

1. Start a long task: `./build.sh`
2. Realise it's going to take a while: press `Ctrl + Z`
3. Send it to the background: `bg`
4. Do other work in the terminal
5. Check on it: `jobs`
6. Bring it back if needed: `fg`

---

## Running Tasks After Disconnect

When you close your terminal, all its child processes receive `SIGHUP` and typically die. For long-running tasks on remote servers, you need a way to keep them alive.

### `nohup` — No Hangup

```bash
nohup ./long-task.sh &
```

`nohup` prevents the process from receiving `SIGHUP` when the terminal closes. Output goes to `nohup.out` by default.

```bash
nohup ./long-task.sh > output.log 2>&1 &
```

This redirects both stdout and stderr to a specific log file.

### `screen` and `tmux` — Terminal Multiplexers

For serious work on remote servers, `screen` or `tmux` is better than `nohup`. They create persistent terminal sessions that survive disconnects.

Quick `tmux` overview:

```bash
tmux                            # start a new session
tmux new -s mysession           # start a named session
```

Inside tmux:
- `Ctrl+B, D` — detach (leave session running, return to normal terminal)
- `tmux ls` — list sessions
- `tmux attach -t mysession` — reattach

This is how professionals run long tasks on remote servers — start a tmux session, launch the task, detach, disconnect from the server, and reattach later to check on it.

---

## Scheduling Tasks with `cron`

`cron` runs scripts on a schedule — every hour, every day, every Monday at 3am. It's the Unix way to automate recurring tasks.

### Editing Your Crontab

```bash
crontab -e                      # open your cron schedule in an editor
crontab -l                      # list your current cron jobs
```

### Cron Schedule Format

```
┌───────────── minute (0-59)
│ ┌───────────── hour (0-23)
│ │ ┌───────────── day of month (1-31)
│ │ │ ┌───────────── month (1-12)
│ │ │ │ ┌───────────── day of week (0-7, 0 and 7 are Sunday)
│ │ │ │ │
* * * * * command to run
```

### Examples

```bash
# Run a backup every day at 2:30 AM
30 2 * * * /home/kevin/scripts/backup.sh

# Run a cleanup every Sunday at midnight
0 0 * * 0 /home/kevin/scripts/cleanup.sh

# Run a health check every 15 minutes
*/15 * * * * /home/kevin/scripts/healthcheck.sh

# Run a report on the 1st of every month at 9 AM
0 9 1 * * /home/kevin/scripts/monthly-report.sh

# Run every weekday at 8 AM
0 8 * * 1-5 /home/kevin/scripts/morning-tasks.sh
```

### Cron Tips

**Always use absolute paths in cron jobs.** Cron doesn't load your shell profile, so it doesn't know about your PATH or any aliases.

```bash
# WRONG
backup.sh

# RIGHT
/home/kevin/scripts/backup.sh
```

**Redirect output to a log:**
```bash
0 2 * * * /home/kevin/scripts/backup.sh >> /home/kevin/logs/backup.log 2>&1
```

Without redirection, cron tries to email the output to you (which usually goes nowhere on modern systems). Redirect to a log file so you can check for errors.

**Test your script manually first.** Run it by hand before putting it in cron. Then check the log after the first scheduled run.

---

## Monitoring Resources

### `df` — Disk Free Space

```bash
df -h                           # human-readable disk usage for all filesystems
df -h /home                     # specific filesystem
```

### `free` — Memory Usage

```bash
free -h                         # human-readable memory usage (Linux only)
```

On macOS, use `vm_stat` or `top` instead.

### `uptime` — System Load

```bash
uptime                          # how long the system has been running, load averages
```

The load averages (three numbers) represent the average number of processes waiting for CPU time over the last 1, 5, and 15 minutes. On a single-core system, a load of 1.0 means the CPU is fully utilised. On a 4-core system, 4.0 means full utilisation.

---

## The `xargs` Command

`xargs` takes input from a pipe and converts it into arguments for another command. It bridges the gap between commands that produce output and commands that expect arguments.

```bash
# Delete all .tmp files found by find
find . -name "*.tmp" | xargs rm

# With filenames that might contain spaces
find . -name "*.tmp" -print0 | xargs -0 rm

# Run a command for each input line
cat servers.txt | xargs -I {} ping -c 1 {}
```

`-I {}` defines a placeholder. Each line from stdin replaces `{}` in the command.

```bash
# Create directories from a list
echo -e "logs\ncache\ntmp" | xargs mkdir -p

# Compress each file individually
ls *.log | xargs -I {} gzip {}
```

---

## Try It Yourself

1. Run `ps aux` and pipe it through `grep` to find your shell process. Note its PID.

2. Start a `sleep 300` command, then immediately press `Ctrl + Z` to suspend it. Use `jobs` to verify it's stopped. Resume it in the background with `bg`. Use `jobs` again to confirm it's running.

3. Start a background task with `sleep 120 &`. Find its PID with `jobs -l` or `ps`. Kill it with `kill`.

4. Write a simple script that prints the current date and time to a log file. Set up a cron job to run it every minute. After a few minutes, check the log to confirm it's working. Then remove the cron job.

5. Use `find` and `xargs` to find all `.txt` files in your `bash-lessons` directory and count the total number of lines across all of them.

6. Use `df -h` to check your disk space. Use `du -sh ~/bash-lessons` to see how much space your lesson files are using.

---

## Key Takeaways

- Every running program is a process with a unique PID. `ps aux` shows them all, `top`/`htop` monitors them live.
- `kill PID` sends SIGTERM (graceful). `kill -9 PID` forces termination. Always try graceful first.
- `&` runs a command in the background. `Ctrl + Z` suspends. `bg` resumes in background. `fg` brings to foreground.
- `nohup` keeps processes alive after terminal disconnect. `tmux` is the professional solution for persistent sessions.
- `cron` schedules recurring tasks. Use `crontab -e` to edit, always use absolute paths, and redirect output to log files.
- `xargs` converts piped input into command arguments — essential for connecting `find` output to other commands.

---

*Next up: [Lesson 12 — Real-World Scripting](12-real-world-scripting.md)*
