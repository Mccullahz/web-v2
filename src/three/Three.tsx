// this file will be used to render the Three.js scene, and be the main entry point for the Three.js application. Our gui page will be rendered here, and Gui.tsx will simply call this file
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { SeedScene } from "./components/SeedScene";
import { ShardHoverCard } from "./components/ShardHoverCard";
import { CameraController } from "./components/CameraController";
import { PlayerControls } from "./components/PlayerControls";
import { FocusedShardPositionSync } from "./components/FocusedShardPositionSync";
import type { CardPayload } from "./components/SeedScene";
//import { ShardHighlight } from "./components/ShardHighlight";

export const ThreeScene: React.FC = () => {
  const navigate = useNavigate();
  const [hoveredShard, setHoveredShard] = useState<CardPayload | null>(null);
  const [focusedShard, setFocusedShard] = useState<CardPayload | null>(null);

  const cardTarget = hoveredShard ?? focusedShard;

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <Canvas camera={{ fov: 75 }}>
        <Environment preset="city" />

        <CameraController />
        <SeedScene
          onShardHover={setHoveredShard}
          onActiveShardChange={setFocusedShard}
          onNavigateToProject={(path) => navigate(path)}
        />
        <PlayerControls onActiveShardChange={setFocusedShard} />
        <FocusedShardPositionSync onUpdate={setFocusedShard} />
        {/*<ShardHighlight />*/}
      </Canvas>
      {cardTarget && (
        <ShardHoverCard
          project={cardTarget.project}
          x={cardTarget.x}
          y={cardTarget.y}
        />
      )}
    </div>
  );
};

