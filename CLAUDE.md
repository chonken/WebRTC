# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Documentation Maintenance

After every code change, assess whether documentation needs updating. Docs to check:

- **`CLAUDE.md`** — update if architecture, module structure, connection flow, or key design decisions change.
- **`.claude/memory/`** — update relevant memory files if project context, decisions, or patterns change.
- **`.claude/INDEX.md`** — update if new feature documentation files are added.

All documentation must be written in **English**.

## Project Overview

A serverless peer-to-peer WebRTC chat room with no backend. Two peers exchange SDP and ICE candidates manually (copy-paste) to establish a direct browser-to-browser data channel connection.

## Running the App

Open `index.html` directly in a browser (no build step, no server required). For cross-origin restrictions or testing across machines, serve it with any static file server:

```
npx serve .
# or
python -m http.server
```

## Architecture

Logic is split into two ES modules. `index.html` loads `ui.js` as `<script type="module">`, which imports `webrtc.js`.

- **`webrtc.js`** — WebRTC protocol layer. No DOM access. Owns `RTCPeerConnection`, data channel, and all SDP/ICE operations.
- **`ui.js`** — Frontend UI layer. Owns all DOM references, button handlers, and message rendering. Calls into `webrtc.js` via its exported functions.
- **`style.css`** — Layout only.

For the step-by-step connection flow, see `.claude/memory/project-connection-flow.md`.  
For non-obvious design decisions, see `.claude/memory/project-design-decisions.md`.
