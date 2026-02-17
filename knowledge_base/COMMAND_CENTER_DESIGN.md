# Sentra Command Center: Design Document (Rust Edition)

> **Objective**: A high-performance, memory-safe "Cognitive Control Plane" built in Rust.

## 1. Architecture: The Native Bridge
We adhere to the **Hard Boundary** principle but replace Electron with native code.
-   **Brain**: `src/genesis/Kernel.js` (Node.js Process).
-   **Body**: `target/release/command_center.exe` (Rust Application).

## 2. Tech Stack
-   **Language**: Rust (2024 Edition).
-   **GUI Framework**: `eframe` (egui) - Immediate Mode, GPU-accelerated, lightweight.
-   **Graphics API**: `wgpu` (Cross-platform Vulkan/DX12/Metal).
-   **Async Runtime**: `tokio` (for IPC and non-blocking I/O).
-   **Graph Engine**: Custom `wgpu` compute shader for force-directed layout (or CPU-based `fdg` crate initially).

## 3. Modules

### A. Process Manager (`src/kernel_ops.rs`)
-   Spawns `node src/genesis/Kernel.js`.
-   Manages `BufReader` for stdout/stderr.
-   Sends commands via `stdin`.
-   **Safety**: `std::process::Child` separation.

### B. IPC Bridge (`src/ipc.rs`)
-   **Telemetry Channel**: `tokio::sync::mpsc` channel.
-   **Log Channel**: Broadcasts raw logs to the UI.
-   **Protocol**: JSON-RPC over stdio.
    -   `{ "type": "TELEMETRY", "data": ... }`
    -   `{ "type": "LOG", "msg": ... }`

### C. The Visualizer (`src/graph_view.rs`)
-   **Renderer**: `egui::PaintCallback` with custom `wgpu` render pass.
-   **Layout**: Force-directed simulation (Start with `egui_graphs` or custom implementation).
-   **Visuals**: 
    -   Nodes: Instanced meshes (Spheres/Points).
    -   Edges: Line list with bloom (flashing lights).
    -   Pulses: Shader-based activation waves.

## 4. Data Flow
1.  **Kernel** (Node.js) emits JSON line.
2.  **Rust Backend** parses JSON in `tokio` task.
3.  **Rust Backend** pushes state update to `Arc<Mutex<AppState>>`.
4.  **Egui Frontend** reads state and renders frame (60 FPS).

## 5. Implementation Roadmap
1.  **Scaffold**: `cargo new command_center`.
2.  **UI**: Basic Egui window with "Start Kernel" button.
3.  **Bridge**: Launch Node.js and capture "Hello World" from Kernel.
4.  **Graph**: Integrate a basic graph widget.
