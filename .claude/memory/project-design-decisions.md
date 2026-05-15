---
name: project-design-decisions
description: Non-obvious architectural choices in the WebRTC chat room codebase
metadata:
  type: project
---

**How to apply:** Check these before modifying the signaling flow, module boundary, or ICE/SDP handling.

### `isOffer` as a live ES module binding
`export let isOffer` in `webrtc.js`; `ui.js` reads the live binding directly. `setIsOffer(val)` is the only setter. **Why:** avoids threading a role flag through every call; set once per page session.

### ICE candidates serialized as a JSON array
`temp_ice[]` accumulates all candidates; serialized to one JSON string per update. **Why:** one copy-paste field instead of one entry per candidate.

### One `RTCPeerConnection` per page load
Created at module load time, no reconnect path. Any disconnect requires a page refresh.

### Entry point is `ui.js` via `type="module"`
`index.html` loads only `ui.js`; `webrtc.js` is pulled in transitively. No bundler.

### Media tracks must be added before SDP creation
`initMedia` → `addTrack` must precede `createOffer`/`createAnswer`. Tracks added late are absent from m-lines and won't be transmitted.

### `localStream` is module-private in `webrtc.js`
Not exported; UI calls `toggleAudio`, `toggleVideo`, `closeConnection` helpers. **Why:** keeps `webrtc.js` DOM-free.

### `closeConnection` stops tracks before closing peer connection
Calls `track.stop()` on all local tracks before `rtcPeerConnection.close()`. **Why:** `stop()` turns off the hardware indicator light; `close()` alone does not.

### `_ensureTransceivers` before `createOffer`
Adds `recvonly` audio+video transceivers if none exist for those kinds before `createOffer`. **Why:** offerer without camera/mic produces no m-lines; answerer can't negotiate media even if they have a camera.

### All SDP operations must be fully awaited
`createOffer`, `createAnswer`, `setAnswer` are all `async` and must be `await`-ed end-to-end including in button handlers. **Why:** unawaited calls produce `InvalidStateError: Called in wrong state: stable`.

### Answer button disabled immediately on click
`answerBtn.disabled = true` before any async op; re-enabled only on error. **Why:** double-click calls `setRemoteDescription` twice → wrong state error.

### Remote video uses a locally-built `MediaStream`
`new MediaStream()` created in `ontrack`; tracks added individually via `addTrack(event.track)`. **Why:** `ontrack` fires per-track separately; re-assigning `event.streams[0]` to `srcObject` doesn't re-render on subsequent arrivals.

### Track lifecycle events control clown/video visibility
`track.readyState === 'live'` on arrival sets initial state. `track.onmute` → clown; `track.onunmute` → video; `track.onended` → clown.

### Control messages share the data channel with chat
Reserved strings `__hangup__`, `__video:on__`, `__video:off__` are intercepted in `onmessage` before `displayMessage`. **Why:** no separate channel; double-underscore prefix avoids collision with chat text.

### Disconnect reloads both peers via `channel.onclose`
`channel.onclose → location.reload()` handles all disconnects (intentional or network drop). `btnHangup` also sends `__hangup__` before `closeConnection()` as a belt-and-suspenders measure. **Why:** no reconnect path; any close is terminal.

### Camera toggle drives local clown via track state
`btnCamera.onclick` reads `toggleVideo()` return value (`track.enabled` post-toggle) to show/hide local clown. Also sends `__video:off__`/`__video:on__` to remote. **Why:** `track.enabled = false` sends black frames; `onmute` does not fire on the receiver side.

See [[project-connection-flow]] for how these decisions affect the signaling steps.
