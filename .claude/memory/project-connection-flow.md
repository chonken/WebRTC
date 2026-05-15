---
name: project-connection-flow
description: Step-by-step manual WebRTC signaling flow between two peers (no signaling server)
metadata:
  type: project
---

The handshake is fully manual — there is no signaling server. Both peers must be open in a browser at the same time and exchange data out-of-band (copy-paste, chat, email, etc.).

**Why:** The project intentionally avoids any backend. This is an educational/demo setup showing raw WebRTC mechanics.

**How to apply:** When modifying connection logic, keep in mind that each step below maps to a UI action and a WebRTC API call. There is no retry or reconnect — a failed handshake requires a page refresh.

### Steps

1. Both peers select their media options (audio/video checkboxes) before initiating.
2. **Peer A (Offerer)** clicks "發起連線"
   - `startMedia()` → `getUserMedia` → `addTrack` (skipped if checkboxes unchecked or getUserMedia fails)
   - `_ensureTransceivers()` guarantees audio+video m-lines exist in the offer even without local tracks
   - `setIsOffer(true)` → `connectInit()` → `initDataChannel` + `initICE` + `await createOffer`
   - Local SDP and ICE candidates populate in the left textareas.
3. Peer A copies their SDP and ICE to Peer B out-of-band.
4. **Peer B (Answerer)** pastes Peer A's SDP/ICE into the "對方" fields and clicks "回應連線"
   - `startMedia()` → `getUserMedia` → `addTrack` (same fallback logic as step 2)
   - `await connectInit(sdp)` → `await createAnswer` → local SDP and ICE populate.
5. Peer B sends their SDP/ICE back to Peer A.
6. Peer A pastes Peer B's SDP/ICE and clicks "收到回應" (button label changed at step 2)
   - `await setAnswer(sdp)` + `setIceCandidates(ice)`
   - Answer button is disabled immediately on click to prevent double-submission.
7. The `RTCDataChannel` fires `onopen` → connection UI is removed, chat+video UI appears.
   - Remote tracks arrive via `ontrack` events (one per track).

### `ontrack` and video/clown display logic

`ontrack` fires separately for audio and video tracks. Video display is controlled by track lifecycle:
- `track.readyState === 'live'` on arrival → show remote video, hide clown
- `track.onmute` → show clown (signal lost)
- `track.onunmute` → show remote video (signal restored)
- `track.onended` → show clown (peer disconnected)

Local video display is determined after `getUserMedia` resolves:
- `localTrack.readyState === 'live'` → show local video, hide clown
- `localTrack.onended` → show clown (camera stopped)

**Media must be added before SDP creation.** Tracks registered after `createOffer`/`createAnswer` are not included in the negotiated SDP.

See [[project-design-decisions]] for why ICE is serialized as a JSON array.
