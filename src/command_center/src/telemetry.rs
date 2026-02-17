use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum GraphEvent {
    NodeAdded { id: String, label: String, node_type: String },
    EdgeAdded { source: String, target: String, relation: String },
    Activation { id: String, level: f32 },
}

pub fn parse_log(line: &str) -> Option<GraphEvent> {
    // 1b. Enhanced Sync: "[Perception] Node: X | Type: Y"
    if line.contains("[Perception] Node:") {
        let parts: Vec<&str> = line.split('|').collect();
        if parts.len() > 0 {
            let id_part = parts[0].split("Node:").nth(1).unwrap_or("?").trim();
            let type_part = if parts.len() > 1 { 
                parts[1].split("Type:").nth(1).unwrap_or("CONCEPT").trim() 
            } else { "CONCEPT" };
            
            return Some(GraphEvent::NodeAdded { 
                id: id_part.to_string(), 
                label: id_part.to_string(), 
                node_type: type_part.to_string() 
            });
        }
    }

    // 1a. Legacy Perception: "[Perception] Active Concept: X"
    if line.contains("[Perception] Active Concept:") {
        let parts: Vec<&str> = line.split("Active Concept:").collect();
        if parts.len() > 1 {
            let id = parts[1].trim().to_string();
            return Some(GraphEvent::NodeAdded { 
                id: id.clone(), 
                label: id, 
                node_type: "CONCEPT".to_string() 
            });
        }
    }

    // 2. Teaching: "[Teaching] Learned: "A" -> [B]"
    if line.contains("[Teaching] Learned:") {
        // Very basic parsing for demo
        // Expected: "trigger" -> [ACTION]
        let parts: Vec<&str> = line.split("->").collect();
        if parts.len() > 1 {
            let source_raw = parts[0].split('"').nth(1).unwrap_or("?").to_string();
            let target_raw = parts[1].trim().replace('[', "").replace(']', "");
            
            return Some(GraphEvent::EdgeAdded { 
                source: source_raw, 
                target: target_raw, 
                relation: "TRIGGERS".to_string() 
            });
        }
    }

    // 3. Curiosity: "[Curiosity] Suggests: ... on X"
    if line.contains("[Curiosity] Suggests:") {
        let parts: Vec<&str> = line.split(" on ").collect();
        if parts.len() > 1 {
            let target = parts[1].split('(').next().unwrap_or("?").trim().to_string();
            return Some(GraphEvent::Activation { id: target, level: 1.0 });
        }
    }

    None
}
