// Fire the espresso machine's steam purge from anywhere (props.ts); Steam.tsx draws it.
let requested = 0;

/** Ask for one purge; it starts on the next frame. */
export function puffSteam() {
  requested++;
}

/** How many purges have been asked for so far (Steam.tsx compares against what it's shown). */
export const steamRequests = () => requested;
