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

### `_ensureTransceivers` before `createOffer`

Before creating an offer, `_ensureTransceivers()` adds `recvonly` audio and video transceivers if none already exist for those kinds.

**Why:** If the offerer has no camera or mic, `addTrack` is never called, and `createOffer` would produce an SDP with no audio/video m-lines. The answerer's SDP would then also have no m-lines, and remote tracks would never be negotiated — even if the answerer has a camera. The recvonly transceivers guarantee m-lines are always present regardless of local hardware.

### All SDP operations must be fully awaited

`createOffer`, `createAnswer`, and `setAnswer` in `webrtc.js` are all `async` and must be `await`-ed end-to-end through the call stack, including in button handlers.

**Why:** Calling the `onReady` callback before `setLocalDescription` resolves, or calling `setAnswer` while the connection is not in the expected state, produces `InvalidStateError: Called in wrong state: stable`. The browser state machine is strict about sequencing.

### Answer button is disabled immediately on click

`answerBtn.disabled = true` is set as the first line of the answer button's click handler, before any async operations begin. It is only re-enabled if an error is caught.

**Why:** Double-clicking the answer button calls `setRemoteDescription` twice with the same answer SDP, triggering `InvalidStateError: wrong state: stable`. Disabling immediately prevents this race.

### Remote video uses a locally-built `MediaStream`

In `ontrack`, rather than using `event.streams[0]`, a `new MediaStream()` is built and tracks are added individually via `addTrack(event.track)`.

**Why:** `ontrack` fires once per track (audio and video separately). `event.streams[0]` may not contain all tracks when the first event fires, and re-assigning the same stream object to `srcObject` does not trigger re-render on subsequent track arrivals. Building the stream incrementally ensures each arriving track is reliably rendered.

### Track lifecycle events control clown/video visibility

`track.readyState === 'live'` on first arrival determines initial show/hide state. `track.onmute` → show clown; `track.onunmute` → show video; `track.onended` → show clown.

**Why:** `readyState` reflects the track's connection state at the moment of `ontrack`. The lifecycle events handle signal loss and reconnect without re-negotiation. This is the correct level for this project — track-level is finer than stream-level (which would miss mute/unmute) and coarser than inspecting individual frames.

See [[project-connection-flow]] for how these decisions affect the signaling steps.
