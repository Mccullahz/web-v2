import React from "react";
import { ThreeScene } from "../three/Three";

export const Gui: React.FC = () => {
  return (
    <div style={{ height: "100vh", width: "100vw" }}>
      <ThreeScene />
    </div>
  );
};

