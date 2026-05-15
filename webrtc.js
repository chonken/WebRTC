const configuration = {
  iceServers: [
    {
      urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
    },
  ],
};

export const rtcPeerConnection = new RTCPeerConnection(configuration);
export let dataChannel = undefined;
export let isOffer = false;

export function setIsOffer(val) {
  isOffer = val;
}

const temp_ice = [];

export function initICE(onUpdate) {
  rtcPeerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      temp_ice.push(event.candidate);
      onUpdate(JSON.stringify(temp_ice));
    }
  };
}

export function setIceCandidates(candidatesJson) {
  const candidates = JSON.parse(candidatesJson);
  candidates.forEach((item) => {
    rtcPeerConnection.addIceCandidate(new RTCIceCandidate(item));
  });
}

export async function createOffer(onReady) {
  _ensureTransceivers();
  const offer = await rtcPeerConnection.createOffer();
  await rtcPeerConnection.setLocalDescription(offer);
  onReady(JSON.stringify(offer));
}

function _ensureTransceivers() {
  const kinds = new Set(rtcPeerConnection.getTransceivers().map((t) => t.receiver.track.kind));
  if (!kinds.has("audio")) rtcPeerConnection.addTransceiver("audio", { direction: "recvonly" });
  if (!kinds.has("video")) rtcPeerConnection.addTransceiver("video", { direction: "recvonly" });
}

export async function createAnswer(offerJson, onReady) {
  const offer = new RTCSessionDescription(JSON.parse(offerJson));
  await rtcPeerConnection.setRemoteDescription(offer);
  const answer = await rtcPeerConnection.createAnswer();
  await rtcPeerConnection.setLocalDescription(answer);
  onReady(JSON.stringify(answer));
}

export async function setAnswer(answerJson) {
  const answer = new RTCSessionDescription(JSON.parse(answerJson));
  await rtcPeerConnection.setRemoteDescription(answer);
}

export function initDataChannel(onOpen, onMessage) {
  if (isOffer) {
    dataChannel = rtcPeerConnection.createDataChannel("chat");
    _setupChannel(dataChannel, onOpen, onMessage);
  } else {
    rtcPeerConnection.ondatachannel = (event) => {
      dataChannel = event.channel;
      _setupChannel(dataChannel, onOpen, onMessage);
    };
  }
}

function _setupChannel(channel, onOpen, onMessage) {
  channel.onopen = onOpen;
  channel.onmessage = onMessage;
}

export function sendOnChannel(message) {
  if (dataChannel && dataChannel.readyState === "open") {
    dataChannel.send(message);
    return true;
  }
  return false;
}

let localStream = null;

export async function initMedia(options) {
  localStream = await navigator.mediaDevices.getUserMedia(options);
  localStream.getTracks().forEach((track) => {
    rtcPeerConnection.addTrack(track, localStream);
  });
  return localStream;
}

export function setOnRemoteStream(callback) {
  rtcPeerConnection.ontrack = callback;
}

export function toggleAudio() {
  const track = localStream?.getAudioTracks()[0];
  if (track) track.enabled = !track.enabled;
  return track?.enabled ?? null;
}

export function toggleVideo() {
  const track = localStream?.getVideoTracks()[0];
  if (track) track.enabled = !track.enabled;
  return track?.enabled ?? null;
}

export function closeConnection() {
  localStream?.getTracks().forEach((t) => t.stop());
  localStream = null;
  rtcPeerConnection.close();
}
