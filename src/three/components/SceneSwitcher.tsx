import type { SceneVersion } from "../versions";

interface SceneSwitcherProps {
  versions: SceneVersion[];
  index: number;
  onChange: (index: number) => void;
}

/**
 * Top-left label for the current portfolio scene, with an accent arrow that
 * cycles to the next one. Hidden when there is only a single version.
 */
export const SceneSwitcher: React.FC<SceneSwitcherProps> = ({ versions, index, onChange }) => {
  const current = versions[index];
  const next = versions[(index + 1) % versions.length];
  const many = versions.length > 1;

  return (
    <div className="pointer-events-none absolute left-6 top-24 z-20 flex items-center gap-2 font-mono text-xs text-faint">
      <span>
        portfolio · {current.label}
        {current.note && <span className="text-acc"> {current.note}</span>}
      </span>

      {many && (
        <>
          <button
            type="button"
            onClick={() => onChange((index + 1) % versions.length)}
            title={`Next: ${next.label}`}
            aria-label={`Next portfolio version: ${next.label}`}
            className="pointer-events-auto rounded border border-transparent px-1.5 py-0.5 text-acc transition-colors hover:border-acc focus-visible:border-acc focus-visible:outline-none"
          >
            →
          </button>
          <span className="tabular-nums">
            {index + 1}/{versions.length}
          </span>
        </>
      )}
    </div>
  );
};
