import React, { Suspense, useState } from "react";
import { SCENE_VERSIONS } from "../three/versions";
import { SceneSwitcher } from "../three/components/SceneSwitcher";

export const Gui: React.FC = () => {
  const [index, setIndex] = useState(0);
  const version = SCENE_VERSIONS[index];
  const Scene = version.Component;

  return (
    <div className="relative h-screen w-screen bg-bg">
      {/* keyed so switching tears the old canvas (and its GL context) down */}
      <Suspense
        fallback={
          <div className="absolute inset-0 grid place-items-center font-mono text-xs text-faint">
            loading {version.label}…
          </div>
        }
      >
        <Scene key={version.id} />
      </Suspense>
      <SceneSwitcher versions={SCENE_VERSIONS} index={index} onChange={setIndex} />
    </div>
  );
};
