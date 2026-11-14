// this file will be used to render the Three.js scene, and be the main entry point for the Three.js application. Our gui page will be rendered here, and Gui.tsx will simply call this file
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { SeedScene } from "./components/SeedScene";
import { ShardHoverCard } from "./components/ShardHoverCard";
import { CameraController } from "./components/CameraController";
import { PlayerControls } from "./components/PlayerControls";
import { KeyboardFocusCardSync } from "./components/KeyboardFocusCardSync";
import { createToolTips } from "./components/ToolTips";
import { ToolTipsCard } from "./components/ToolTipsCard";
import type { CardPayload } from "./components/SeedScene";
import { shardNameToProject } from "./shardMapping";
//import { ShardHighlight } from "./components/ShardHighlight";

export const ThreeScene: React.FC = () => {
  const navigate = useNavigate();
  const [hoveredShard, setHoveredShard] = useState<CardPayload | null>(null);
  const [keyboardFocus, setKeyboardFocus] = useState<CardPayload | null>(null);

  const hoveredRef = useRef(hoveredShard);
  const keyboardRef = useRef(keyboardFocus);
  useEffect(() => {
    hoveredRef.current = hoveredShard;
  }, [hoveredShard]);
  useEffect(() => {
    keyboardRef.current = keyboardFocus;
  }, [keyboardFocus]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;
      const el = e.target as HTMLElement | null;
      if (el?.closest?.("input, textarea, select, [contenteditable=true]")) return;

      const path =
        hoveredRef.current?.project.path ??
        keyboardRef.current?.project.path ??
        (() => {
          const mesh = (window as any).__activeShard as { name?: string } | undefined;
          if (!mesh?.name) return null;
          return shardNameToProject(mesh.name)?.path ?? null;
        })();

      if (path) {
        e.preventDefault();
        navigate(path);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [navigate]);

  const onShardHover = (payload: CardPayload | null) => {
    setHoveredShard(payload);
    if (payload !== null) {
      setKeyboardFocus(null);
    }
  };

  const cardPayload = hoveredShard ?? keyboardFocus;
  const keyboardCardActive = keyboardFocus !== null && !hoveredShard;

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <Canvas camera={{ fov: 75 }}>
        {/* self-hosted: drei's `preset` pulls this from raw.githack.com at
            runtime, which rate-limits (403s) and leaves the scene unlit */}
        <Environment files="/hdri/potsdamer_platz_1k.hdr" />

        <CameraController />
        <SeedScene
          onShardHover={onShardHover}
          onMouseShardFocus={() => setKeyboardFocus(null)}
          onNavigateToProject={(path) => navigate(path)}
        />
        <PlayerControls onKeyboardShardChange={setKeyboardFocus} />
        <KeyboardFocusCardSync active={keyboardCardActive} onUpdate={setKeyboardFocus} />
        {createToolTips()}
        {/*<ShardHighlight />*/}
      </Canvas>
      {/* DOM overlay — must live OUTSIDE <Canvas>; R3F's reconciler rejects HTML children */}
      {ToolTipsCard()}
      {cardPayload && (
        <ShardHoverCard
          project={cardPayload.project}
          x={cardPayload.x}
          y={cardPayload.y}
          hint={hoveredShard ? "Click for more!" : "Press Enter to open"}
        />
      )}
    </div>
  );
};
