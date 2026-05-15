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

### Media tracks must be added before SDP creation

`initMedia` calls `addTrack` on the `RTCPeerConnection` before `createOffer`/`createAnswer` is called. This is mandatory — tracks added after SDP negotiation are not included in the offer/answer and will not be transmitted.

**Why:** WebRTC SDP describes the negotiated media capabilities at the moment of offer/answer creation. Adding tracks late produces an SDP without audio/video m-lines.

### `localStream` is module-private in `webrtc.js`

`localStream` (from `getUserMedia`) is stored as a module-level variable, not exported. UI controls (mute/camera toggle, hang up) call the exported `toggleAudio`, `toggleVideo`, `closeConnection` helpers instead of touching the stream directly.

**Why:** Keeps the DOM-free contract of `webrtc.js` — the UI layer never holds a reference to the stream or its tracks.

### `closeConnection` stops tracks before closing peer connection

`closeConnection` calls `track.stop()` on all local tracks before `rtcPeerConnection.close()`. The hang-up button then does `location.reload()` to reset all state.

**Why:** `track.stop()` is the only way to turn off the camera/microphone indicator light in the browser. Closing the peer connection alone does not stop the hardware capture.

See [[project-connection-flow]] for how these decisions affect the signaling steps.
