---
name: project-connection-flow
description: Step-by-step manual WebRTC signaling flow between two peers (no signaling server)
metadata:
  type: project
---

The handshake is fully manual — no signaling server. Both peers exchange SDP/ICE out-of-band (copy-paste, chat, etc.).

**Why:** Educational/demo setup showing raw WebRTC mechanics with no backend.

### Steps

1. Both peers select media options (audio/video checkboxes).
2. **Peer A (Offerer)** clicks "發起連線"
   - `startMedia()` → `getUserMedia` → `addTrack` (skipped if unchecked or getUserMedia fails)
   - `_ensureTransceivers()` guarantees audio+video m-lines even without local tracks
   - `setIsOffer(true)` → `connectInit()` → `initDataChannel` + `initICE` + `await createOffer`
   - Local SDP and ICE populate in left textareas.
3. Peer A copies SDP+ICE to Peer B out-of-band.
4. **Peer B (Answerer)** pastes into "對方" fields, clicks "回應連線"
   - `startMedia()` → `getUserMedia` → `addTrack` (same fallback)
   - `await connectInit(sdp)` → `await createAnswer` → local SDP+ICE populate.
5. Peer B sends SDP+ICE back to Peer A.
6. **Peer A** pastes Peer B's SDP+ICE, clicks "收到回應"
   - `await setAnswer(sdp)` + `setIceCandidates(ice)`
   - Answer button disabled immediately on click to prevent double-submission.
7. `RTCDataChannel.onopen` → connection UI removed, chatroom appears.

### Disconnect
Either peer clicking "掛斷" sends `__hangup__` then calls `closeConnection()` + `location.reload()`. The remote side reloads via `channel.onclose`. Network drops are also caught by `onclose`.

### `ontrack` and video/clown display

`ontrack` fires separately per track (audio, video). Video display follows track lifecycle:
- `track.readyState === 'live'` on arrival → show video, hide clown
- `track.onmute` → show clown; `track.onunmute` → show video; `track.onended` → show clown

Local video: same `readyState` check after `getUserMedia`. `localTrack.onended` → show clown.

Camera toggle: `btnCamera` reads `track.enabled` (via `toggleVideo()`) and updates local clown. Sends `__video:off__`/`__video:on__` so remote updates their clown too.

**Media must be added before SDP creation.** See [[project-design-decisions]] for why.
