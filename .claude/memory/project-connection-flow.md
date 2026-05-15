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
   - `startMedia()` → `getUserMedia` → `addTrack` to peer connection (skipped if both checkboxes unchecked)
   - `setIsOffer(true)` → `connectInit()` → `initDataChannel` + `initICE` + `createOffer`
   - Local SDP and ICE candidates populate in the left textareas.
3. Peer A copies their SDP and ICE to Peer B out-of-band.
4. **Peer B (Answerer)** pastes Peer A's SDP/ICE into the "對方" fields and clicks "回應連線"
   - `startMedia()` → `getUserMedia` → `addTrack` (same as step 2)
   - `connectInit(sdp)` → `createAnswer` → local SDP and ICE populate.
5. Peer B sends their SDP/ICE back to Peer A.
6. Peer A pastes Peer B's SDP/ICE and clicks "收到回應" (button label changed at step 2)
   - `setAnswer(sdp)` + `setIceCandidates(ice)`
7. The `RTCDataChannel` fires `onopen` → connection UI is removed, chat+video UI appears.
   - Remote video stream arrives via `ontrack` and is bound to `.remote-video`.

**Media must be added before SDP creation.** Tracks registered after `createOffer`/`createAnswer` are not included in the negotiated SDP.

See [[project-design-decisions]] for why ICE is serialized as a JSON array.
