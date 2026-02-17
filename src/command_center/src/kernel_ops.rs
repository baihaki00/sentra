use std::process::{Command, Stdio, Child, ChildStdin};
use std::io::{BufRead, BufReader, Write};
use std::thread;
use std::sync::mpsc::Sender;

pub struct KernelOps {
    child: Option<Child>,
    stdin: Option<ChildStdin>,
}

impl KernelOps {
    pub fn new() -> Self {
        Self { child: None, stdin: None }
    }

    pub fn launch(&mut self, sender: &Sender<String>) -> anyhow::Result<()> {
        let mut child = Command::new("node")
            .current_dir("../../") // Run from d:\ClosedClaw
            .arg("src/genesis/Kernel.js") // Now relative to Root
            .stdout(Stdio::piped())
            .stdin(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()?;

        let stdout = child.stdout.take().expect("Failed to open stdout");
        let stderr = child.stderr.take().expect("Failed to open stderr");
        let stdin = child.stdin.take().expect("Failed to open stdin");

        self.child = Some(child);
        self.stdin = Some(stdin);

        // Spawn stdout reader thread
        let tx_out = sender.clone();
        thread::spawn(move || {
            let reader = BufReader::new(stdout);
            for line in reader.lines() {
                if let Ok(l) = line {
                    let _ = tx_out.send(l);
                }
            }
        });

        // Spawn stderr reader thread
        let tx_err = sender.clone();
        thread::spawn(move || {
            let reader = BufReader::new(stderr);
            for line in reader.lines() {
                if let Ok(l) = line {
                    let _ = tx_err.send(format!("[STDERR] {}", l));
                }
            }
        });

        // Auto-sync after short delay to let Node boot
        let ops_clone = Self { child: None, stdin: self.stdin.take() }; // Temporarily move stdin
        // Wait, self.stdin is Option. We can clone the sender or just spawn a thread to write later?
        // Simpler: Just write it if we can. But launch consumes &mut self.
        // Actually, we returned Ok(()). The caller has the shell.
        // Better: Do it in main.rs or just write here if we change logic.
        // Let's modify main.rs to send it, or use a thread here.
        
        // REVISIT: We can't easily use self.stdin here because we moved it into the struct.
        // But wait, self.stdin IS in the struct.
        // The threads use stdout/stderr. input is free.
        
        // Let's just do it in the UI button handler in main.rs for simplicity.
        // "Launch" -> Wait -> Sync.
        // Or better, let KernelOps expose a method and call it.
        
        self.stdin = Some(ops_clone.stdin.unwrap()); // Put it back? No, that logic is messy.

        // Revert: I will handle this in main.rs to avoid ownership hell in this function.
        // Just return Ok.
        Ok(())
    }

    pub fn send_command(&mut self, cmd: &str) -> anyhow::Result<()> {
        if let Some(stdin) = &mut self.stdin {
            writeln!(stdin, "{}", cmd)?;
            return Ok(());
        }
        anyhow::bail!("Kernel not running")
    }
}
