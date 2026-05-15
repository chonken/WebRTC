import { isOffer, setIsOffer, initICE, setIceCandidates, createOffer, createAnswer, setAnswer, initDataChannel, sendOnChannel, initMedia, setOnRemoteStream, toggleAudio, toggleVideo, closeConnection } from "./webrtc.js";

const connect = document.querySelector(".connect");
const chatroom = document.querySelector(".chatroom");
const chatbox = document.querySelector(".chatbox");
const typebox = document.querySelector(".typebox");
const inputBox = typebox.querySelector("input");
const inputBtn = typebox.querySelector("button");
const offerBtn = document.getElementById("offer");
const answerBtn = document.getElementById("answer");
const localSdpEl = document.getElementById("localSdp");
const localIceEl = document.getElementById("localIce");
const remoteSdpEl = document.getElementById("remoteSdp");
const remoteIceEl = document.getElementById("remoteIce");
const audioCheckbox = document.getElementById("useAudio");
const videoCheckbox = document.getElementById("useVideo");
const localVideo = document.querySelector(".local-video");
const localClown = document.querySelector(".local-clown");
const remoteVideo = document.querySelector(".remote-video");
const remoteClown = document.querySelector(".remote-clown");
const btnMute = document.querySelector(".btn-mute");
const btnCamera = document.querySelector(".btn-camera");
const btnHangup = document.querySelector(".btn-hangup");
const callControls = document.querySelector(".call-controls");

offerBtn.onclick = async () => {
  setIsOffer(true);
  answerBtn.innerText = "收到回應";
  offerBtn.disabled = true;
  try {
    await startMedia();
    await connectInit();
  } catch (err) {
    alert("連線失敗：" + err.message);
    offerBtn.disabled = false;
  }
};

answerBtn.onclick = async () => {
  const sdp = remoteSdpEl.value;
  const ice = remoteIceEl.value;
  if (sdp === "" || ice === "") {
    alert("空的是要怎麼" + answerBtn.innerText);
    return;
  }
  answerBtn.disabled = true;
  try {
    if (isOffer) {
      await setAnswer(sdp);
    } else {
      await startMedia();
      await connectInit(sdp);
    }
    setIceCandidates(ice);
  } catch (err) {
    answerBtn.disabled = false;
    alert("發生錯誤：" + (err.message || "請確認輸入內容"));
  }
};

async function startMedia() {
  setOnRemoteStream((event) => {
    if (!remoteVideo.srcObject) remoteVideo.srcObject = new MediaStream();
    remoteVideo.srcObject.addTrack(event.track);
    if (event.track.kind !== "video") return;
    const showVideo = () => {
      remoteVideo.style.display = "block";
      remoteClown.style.display = "none";
    };
    const showClown = () => {
      remoteVideo.style.display = "none";
      remoteClown.style.display = "flex";
    };
    if (event.track.readyState === "live") showVideo();
    else showClown();
    event.track.onmute = showClown;
    event.track.onunmute = showVideo;
    event.track.onended = showClown;
  });

  const useAudio = audioCheckbox.checked;
  const useVideo = videoCheckbox.checked;
  let stream = null;

  if (useAudio || useVideo) {
    try {
      stream = await initMedia({ audio: useAudio, video: useVideo });
    } catch {
      if (useVideo && useAudio) {
        try {
          stream = await initMedia({ audio: true, video: false });
        } catch {
          // no media available
        }
      }
    }
  }

  const localTrack = stream?.getVideoTracks()[0];
  if (localTrack?.readyState === "live") {
    localVideo.srcObject = stream;
    localVideo.style.display = "block";
    localClown.style.display = "none";
    localTrack.onended = () => {
      localVideo.style.display = "none";
      localClown.style.display = "flex";
    };
  } else {
    localClown.style.display = "flex";
  }

  callControls.style.display = "flex";
  btnCamera.disabled = !stream?.getVideoTracks().length;
  btnMute.disabled = !stream?.getAudioTracks().length;
}

inputBtn.onclick = sendMessage;
inputBox.onkeydown = (event) => {
  if (event.key === "Enter" && !event.shiftKey && inputBox.value.trim() !== "") {
    sendMessage();
  }
};

btnMute.onclick = () => {
  const isEnabled = toggleAudio();
  if (isEnabled !== null) {
    btnMute.textContent = isEnabled ? "靜音" : "取消靜音";
    btnMute.classList.toggle("active", !isEnabled);
  }
};

btnCamera.onclick = () => {
  const isEnabled = toggleVideo();
  if (isEnabled !== null) {
    btnCamera.textContent = isEnabled ? "關閉鏡頭" : "開啟鏡頭";
    btnCamera.classList.toggle("active", !isEnabled);
  }
};

btnHangup.onclick = () => {
  closeConnection();
  location.reload();
};

async function connectInit(sdp = undefined) {
  initDataChannel(
    () => {
      connect.remove();
      chatroom.style.display = "flex";
    },
    (event) => displayMessage(event.data, false),
  );
  initICE((candidates) => {
    localIceEl.value = candidates;
  });
  if (isOffer) {
    await createOffer((sdpJson) => {
      localSdpEl.value = sdpJson;
    });
  } else {
    await createAnswer(sdp, (sdpJson) => {
      localSdpEl.value = sdpJson;
    });
  }
}

function sendMessage() {
  const text = inputBox.value.trim();
  if (text !== "" && sendOnChannel(text)) {
    displayMessage(text, true);
    inputBox.value = "";
  }
}

function displayMessage(message, isMe) {
  const msg = document.createElement("div");
  msg.textContent = message;
  msg.classList.add(isMe ? "me" : "others");
  chatbox.appendChild(msg);
  chatbox.scrollTop = chatbox.scrollHeight;
}
