use std::collections::HashMap;
use eframe::egui::{Pos2, Vec2, Color32};
use rand::Rng;

#[derive(Clone)]
pub struct Node {
    pub id: String,
    pub node_type: String,
    pub pos: Pos2,
    pub vel: Vec2,
    pub color: Color32,
    pub radius: f32,
}

#[derive(Clone)]
pub struct Edge {
    pub source: String,
    pub target: String,
    pub weight: f32,
}

pub struct GraphState {
    pub nodes: HashMap<String, Node>,
    pub edges: Vec<Edge>,
}

impl GraphState {
    pub fn new() -> Self {
        Self {
            nodes: HashMap::new(),
            edges: Vec::new(),
        }
    }

    pub fn add_node(&mut self, id: String, node_type: String) {
        if !self.nodes.contains_key(&id) {
            let mut rng = rand::thread_rng();
            
            let color = match node_type.as_str() {
                "ACTION" => Color32::from_rgb(255, 100, 50), // Orange
                "IDENTITY" => Color32::from_rgb(255, 255, 255), // White
                "EPISODIC" => Color32::from_rgb(200, 100, 255), // Purple
                _ => Color32::from_rgb(0, 200, 255), // Cyan
            };
            
            let radius = match node_type.as_str() {
                "IDENTITY" => 8.0,
                "ACTION" => 6.0,
                _ => 4.0,
            };

            self.nodes.insert(id.clone(), Node {
                id,
                node_type,
                pos: Pos2::new(rng.gen_range(300.0..500.0), rng.gen_range(200.0..400.0)),
                vel: Vec2::ZERO,
                color,
                radius,
            });
        }
    }

    pub fn add_edge(&mut self, source: String, target: String) {
        // Ensure nodes exist first (default to CONCEPT if unknown)
        self.add_node(source.clone(), "CONCEPT".to_string());
        self.add_node(target.clone(), "CONCEPT".to_string());
        
        self.edges.push(Edge { source, target, weight: 1.0 });
    }

    // Simple Force-Directed Layout Step (Verlet Integration)
    pub fn simulate(&mut self, dt: f32) {
        let repulsion = 5000.0;
        let spring_len = 50.0;
        let spring_k = 0.05;
        let damping = 0.90;

        let mut forces: HashMap<String, Vec2> = HashMap::new();

        // 1. Repulsion
        let ids: Vec<String> = self.nodes.keys().cloned().collect();
        for i in 0..ids.len() {
            for j in (i+1)..ids.len() {
                let id1 = &ids[i];
                let id2 = &ids[j];
                
                if let (Some(n1), Some(n2)) = (self.nodes.get(id1), self.nodes.get(id2)) {
                    let delta = n1.pos - n2.pos;
                    let dist_sq = delta.length_sq().max(100.0); // Min dist to avoid explosion
                    let force = delta.normalized() * (repulsion / dist_sq);
                    
                    *forces.entry(id1.clone()).or_insert(Vec2::ZERO) += force;
                    *forces.entry(id2.clone()).or_insert(Vec2::ZERO) -= force;
                }
            }
        }

        // 2. Springs
        for edge in &self.edges {
             if let (Some(n1), Some(n2)) = (self.nodes.get(&edge.source), self.nodes.get(&edge.target)) {
                 let delta = n2.pos - n1.pos;
                 let dist = delta.length().max(1.0);
                 let force = delta.normalized() * ((dist - spring_len) * spring_k);
                 
                 *forces.entry(edge.source.clone()).or_insert(Vec2::ZERO) += force;
                 *forces.entry(edge.target.clone()).or_insert(Vec2::ZERO) -= force;
             }
        }
        
        // 3. Update Position & Center Gravity
        let center = Pos2::new(400.0, 300.0);
        
        for (id, node) in self.nodes.iter_mut() {
            let f = forces.get(id).cloned().unwrap_or(Vec2::ZERO);
            let to_center = center - node.pos;
            
            node.vel += (f + to_center * 0.05) * dt; // Add Gravity
            node.vel *= damping;
            node.pos += node.vel * dt;
        }
    }
}
