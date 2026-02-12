// hover card component, same style as porject card but in 2d
import React from "react";
import type { Project } from "../data/projects";

const CARD_OFFSET = 16;

interface ShardHoverCardProps {
  project: Project;
  x: number;
  y: number;
}

export const ShardHoverCard: React.FC<ShardHoverCardProps> = ({
  project,
  x,
  y,
}) => {
  return (
    <div
      className="shard-hover-card"
      style={{
        position: "fixed",
        left: x + CARD_OFFSET,
        top: y + CARD_OFFSET,
        pointerEvents: "none",
        zIndex: 10,
        minWidth: 200,
        maxWidth: 280,
        padding: "12px 14px",
        background: "rgba(26, 26, 26, 0.75)",
        border: "1px solid rgba(14, 165, 233)",
        borderRadius: 8,
        boxShadow: "0 8px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(139,69,19,0.2)",
        color: "#e0e0e0",
        fontFamily: "system-ui, sans-serif",
        fontSize: 13,
        lineHeight: 1.4,
        backdropFilter: "blur(8px)",
      }}
    >
      <div
        style={{
          fontWeight: 600,
          color: "#00c2e0",
          marginBottom: 6,
          fontSize: 14,
        }}
      >
        {project.title}
      </div>
      <div style={{ color: "#b0b0b0", marginBottom: 4 }}>{project.category}</div>
      <div style={{ color: "#888", fontSize: 12 }}>{project.tech}</div>
      <div style={{ color: "#777", fontSize: 12, marginTop: 8 }}>{"Click for more!"}</div>
    </div>
  );
};
