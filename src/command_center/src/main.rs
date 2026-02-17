mod kernel_ops;
mod graph;
mod telemetry;
use kernel_ops::KernelOps;
use graph::GraphState;
use telemetry::parse_log;
use std::sync::mpsc::{channel, Receiver, Sender};
use eframe::egui::{self, Color32, Stroke};

fn main() -> Result<(), eframe::Error> {
    env_logger::init();
    let options = eframe::NativeOptions {
        viewport: eframe::egui::ViewportBuilder::default()
            .with_inner_size([1200.0, 800.0]),
        ..Default::default()
    };
    eframe::run_native(
        "Sentra Command Center",
        options,
        Box::new(|cc| {
            // Dark Theme Visuals
            let mut visuals = egui::Visuals::dark();
            visuals.window_fill = Color32::from_rgb(10, 12, 16); // Deep Black
            visuals.panel_fill = Color32::from_rgb(15, 18, 25);  // Dark Blue-Grey
            cc.egui_ctx.set_visuals(visuals);
            
            Ok(Box::new(CommandCenter::default()))
        }),
    )
}

struct CommandCenter {
    label: String,
    logs: Vec<String>,
    receiver: Receiver<String>,
    sender: Sender<String>,
    kernel_ops: KernelOps,
    graph: GraphState,
    input_text: String,
    sync_pending: Option<std::time::Instant>,
}

impl Default for CommandCenter {
    fn default() -> Self {
        let (sender, receiver) = channel();
        Self {
            label: "Ready".to_owned(),
            logs: vec![],
            receiver,
            sender,
            kernel_ops: KernelOps::new(),
            graph: GraphState::new(),
            input_text: String::new(),
            sync_pending: None,
        }
    }
}

impl eframe::App for CommandCenter {
    fn update(&mut self, ctx: &egui::Context, _frame: &mut eframe::Frame) {
        // Auto-Sync Check
        if let Some(time) = self.sync_pending {
            if time.elapsed().as_secs() > 1 {
                let _ = self.kernel_ops.send_command("/sync");
                self.sync_pending = None;
            }
            ctx.request_repaint();
        }

        // Poll logs
        while let Ok(msg) = self.receiver.try_recv() {
            if let Some(event) = parse_log(&msg) {
                match event {
                    telemetry::GraphEvent::NodeAdded { id, node_type, .. } => self.graph.add_node(id, node_type),
                    telemetry::GraphEvent::EdgeAdded { source, target, .. } => self.graph.add_edge(source, target),
                    telemetry::GraphEvent::Activation { id: _, .. } => { /* flash node */ },
                }
            }
            self.logs.push(msg);
        }

        self.graph.simulate(0.016);

        // --- SIDEBAR ---
        egui::SidePanel::left("controls")
            .resizable(false)
            .default_width(220.0)
            .show(ctx, |ui| {
                ui.add_space(20.0);
                ui.heading(egui::RichText::new("SENTRA").size(24.0).strong());
                ui.label(egui::RichText::new("Cognitive Engine v0.9").weak());
                ui.add_space(20.0);
                
                ui.separator();
                ui.add_space(10.0);
                
                let btn_size = egui::vec2(200.0, 40.0);
                if ui.add(egui::Button::new(egui::RichText::new("🚀 LAUNCH KERNEL").size(16.0)).min_size(btn_size)).clicked() {
                    match self.kernel_ops.launch(&self.sender) {
                        Ok(_) => {
                            self.label = "ONLINE".to_string();
                            self.sync_pending = Some(std::time::Instant::now());
                        }
                        Err(e) => self.label = format!("ERROR: {}", e),
                    }
                }
                
                ui.add_space(15.0);
                ui.label(format!("STATUS: {}", self.label));
                
                ui.add_space(20.0);
                ui.heading("METRICS");
                ui.add_space(5.0);
                ui.label(format!("Nodes: {}", self.graph.nodes.len()));
                ui.label(format!("Edges: {}", self.graph.edges.len()));
            });

        // --- LOGS (Bottom) ---
        egui::TopBottomPanel::bottom("logs")
            .resizable(true)
            .min_height(250.0)
            .show(ctx, |ui| {
                ui.add_space(5.0);
                ui.heading("TERMINAL");
                ui.separator();
                egui::ScrollArea::vertical()
                    .stick_to_bottom(true)
                    .auto_shrink([false, false])
                    .show(ui, |ui| {
                         ui.style_mut().text_styles.insert(
                            egui::TextStyle::Body, 
                            egui::FontId::new(13.0, egui::FontFamily::Monospace)
                        );
                        for log in &self.logs {
                            ui.label(egui::RichText::new(log).color(Color32::from_gray(200)));
                        }
                    });
            });

        // --- CHAT (Above Logs) ---
        egui::TopBottomPanel::bottom("chat_panel")
            .min_height(70.0)
            .show(ctx, |ui| {
                 egui::Frame::none().inner_margin(15.0).show(ui, |ui| {
                    ui.horizontal(|ui| {
                         let response = ui.add(
                             egui::TextEdit::singleline(&mut self.input_text)
                                .hint_text("Communicate with Sentra...")
                                .desired_width(f32::INFINITY)
                                .font(egui::FontId::proportional(16.0))
                         );
                         
                         if ui.add(egui::Button::new("SEND").min_size(egui::vec2(80.0, 30.0))).clicked() 
                            || (response.lost_focus() && ui.input(|i| i.key_pressed(egui::Key::Enter))) {
                             if !self.input_text.is_empty() {
                                 let _ = self.kernel_ops.send_command(&self.input_text);
                                 self.logs.push(format!("USER > {}", self.input_text));
                                 self.input_text.clear();
                                 response.request_focus();
                             }
                         }
                    });
                 });
            });

        // --- GRAPH (Center) ---
        egui::CentralPanel::default().show(ctx, |ui| {
             let painter = ui.painter();
            
            // Draw Edges
            for edge in &self.graph.edges {
                if let (Some(n1), Some(n2)) = (self.graph.nodes.get(&edge.source), self.graph.nodes.get(&edge.target)) {
                    painter.line_segment(
                        [n1.pos, n2.pos], 
                        Stroke::new(1.5, Color32::from_rgb(60, 70, 80))
                    );
                }
            }
            
            // Draw Nodes
            for node in self.graph.nodes.values() {
                // Glow
                painter.circle_filled(node.pos, node.radius * 3.0, node.color.gamma_multiply(0.15));
                // Core
                painter.circle_filled(node.pos, node.radius, node.color);
                
                // Label
                painter.text(
                    node.pos + egui::vec2(0.0, node.radius + 8.0), 
                    egui::Align2::CENTER_TOP, 
                    &node.id, 
                    egui::FontId::proportional(12.0), 
                    Color32::from_gray(220)
                );
            }
            
            ctx.request_repaint();
        });
    }
}
