import type { ReactElement } from "react";

{/* TT card to be placed under the animation. not sure if I want to use this because the scene already feels kind of crowded. tbd*/}

export function ToolTipsCard(): ReactElement {
	  return (
    <div
      style={{
	position: "absolute",
	bottom: 20,
	left: "50%",
	transform: "translateX(-50%)",
	backgroundColor: "rgba(0, 0, 0, 0.7)",
	color: "white",
	padding: "10px 20px",
	borderRadius: "5px",
	fontSize: "14px",
	pointerEvents: "none",
      }}
    >
      Use WASD or arrow keys to move around. Hover over shards for more info!
    </div>
  );
}
