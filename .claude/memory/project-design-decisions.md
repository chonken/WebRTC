---
name: project-design-decisions
description: Non-obvious architectural choices in the WebRTC chat room codebase
metadata:
  type: project
---

These decisions are not apparent from reading the code alone.

**How to apply:** Check these before modifying the signaling flow, module boundary, or ICE/SDP handling to avoid accidentally breaking assumptions.

### `isOffer` as a live ES module binding

`isOffer` is exported as `export let isOffer` from `webrtc.js`. `ui.js` imports it directly and reads the live binding — it does **not** receive it as a function parameter. `setIsOffer(val)` is the only setter.

**Why:** Avoids threading a role flag through every function call. The role is set once at the start and never changes within a page session.

### ICE candidates serialized as a JSON array

`temp_ice[]` accumulates all candidates inside `webrtc.js`; the entire array is serialized to a single JSON string each time a new candidate arrives. The user copies this one string (not individual candidates).

**Why:** Simplifies the copy-paste UX — one field for all ICE data instead of one entry per candidate.

### One `RTCPeerConnection` per page load

The connection object is created at module load time (`new RTCPeerConnection(configuration)` at the top of `webrtc.js`). There is no reset or reconnect path.

**Why:** Intentional simplicity. A failed or closed connection requires a page refresh.

### Entry point is `ui.js` via `type="module"`

`index.html` loads only `ui.js` as `<script type="module">`. `webrtc.js` is pulled in transitively via ES module import. No bundler is involved.

**Why:** Keeps the HTML clean and lets the browser handle module resolution natively.

See [[project-connection-flow]] for how these decisions affect the signaling steps.
