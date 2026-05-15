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

1. **Peer A (Offerer)** clicks "發起連線"
   - `setIsOffer(true)` → `connectInit()` → `initDataChannel` + `initICE` + `createOffer`
   - Local SDP and ICE candidates populate in the left textareas.
2. Peer A copies their SDP and ICE to Peer B out-of-band.
3. **Peer B (Answerer)** pastes Peer A's SDP/ICE into the "對方" fields and clicks "回應連線"
   - `connectInit(sdp)` → `createAnswer` → local SDP and ICE populate.
4. Peer B sends their SDP/ICE back to Peer A.
5. Peer A pastes Peer B's SDP/ICE and clicks "收到回應" (button label changed at step 1)
   - `setAnswer(sdp)` + `setIceCandidates(ice)`
6. The `RTCDataChannel` fires `onopen` → connection UI is removed, chat UI appears.

See [[project-design-decisions]] for why ICE is serialized as a JSON array.
