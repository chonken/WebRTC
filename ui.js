import {
	isOffer,
	setIsOffer,
	initICE,
	setIceCandidates,
	createOffer,
	createAnswer,
	setAnswer,
	initDataChannel,
	sendOnChannel,
	initMedia,
	setOnRemoteStream,
	toggleAudio,
	toggleVideo,
	closeConnection,
} from './webrtc.js'

const connect = document.querySelector('.connect')
const chatroom = document.querySelector('.chatroom')
const chatbox = document.querySelector('.chatbox')
const typebox = document.querySelector('.typebox')
const inputBox = typebox.querySelector('input')
const inputBtn = typebox.querySelector('button')
const offerBtn = document.getElementById('offer')
const answerBtn = document.getElementById('answer')
const localSdpEl = document.getElementById('localSdp')
const localIceEl = document.getElementById('localIce')
const remoteSdpEl = document.getElementById('remoteSdp')
const remoteIceEl = document.getElementById('remoteIce')
const audioCheckbox = document.getElementById('useAudio')
const videoCheckbox = document.getElementById('useVideo')
const localVideo = document.querySelector('.local-video')
const remoteVideo = document.querySelector('.remote-video')
const videoSection = document.querySelector('.video-section')
const btnMute = document.querySelector('.btn-mute')
const btnCamera = document.querySelector('.btn-camera')
const btnHangup = document.querySelector('.btn-hangup')
const callControls = document.querySelector('.call-controls')

offerBtn.onclick = async () => {
	setIsOffer(true)
	answerBtn.innerText = '收到回應'
	offerBtn.disabled = true
	try {
		await startMedia()
		connectInit()
	} catch (err) {
		alert('無法取得媒體裝置：' + err.message)
		offerBtn.disabled = false
	}
}

answerBtn.onclick = async () => {
	const sdp = remoteSdpEl.value
	const ice = remoteIceEl.value
	if (sdp === '' || ice === '') {
		alert('空的是要怎麼' + answerBtn.innerText)
		return
	}
	try {
		if (isOffer) {
			setAnswer(sdp)
		} else {
			await startMedia()
			connectInit(sdp)
		}
		setIceCandidates(ice)
	} catch (err) {
		alert('發生錯誤：' + (err.message || '請確認輸入內容'))
	}
}

async function startMedia() {
	const useAudio = audioCheckbox.checked
	const useVideo = videoCheckbox.checked
	if (!useAudio && !useVideo) return

	setOnRemoteStream((stream) => {
		remoteVideo.srcObject = stream
	})

	const stream = await initMedia({ audio: useAudio, video: useVideo })
	localVideo.srcObject = stream

	if (useVideo) videoSection.style.display = 'block'
	callControls.style.display = 'flex'
	if (!useVideo) btnCamera.style.display = 'none'
}

inputBtn.onclick = sendMessage
inputBox.onkeydown = (event) => {
	if (event.key === 'Enter' && !event.shiftKey && inputBox.value.trim() !== '') {
		sendMessage()
	}
}

btnMute.onclick = () => {
	const isEnabled = toggleAudio()
	if (isEnabled !== null) {
		btnMute.textContent = isEnabled ? '靜音' : '取消靜音'
		btnMute.classList.toggle('active', !isEnabled)
	}
}

btnCamera.onclick = () => {
	const isEnabled = toggleVideo()
	if (isEnabled !== null) {
		btnCamera.textContent = isEnabled ? '關閉鏡頭' : '開啟鏡頭'
		btnCamera.classList.toggle('active', !isEnabled)
	}
}

btnHangup.onclick = () => {
	closeConnection()
	location.reload()
}

function connectInit(sdp = undefined) {
	initDataChannel(
		() => {
			connect.remove()
			chatroom.style.display = 'flex'
		},
		(event) => displayMessage(event.data, false)
	)
	initICE((candidates) => {
		localIceEl.value = candidates
	})
	if (isOffer) {
		createOffer((sdpJson) => {
			localSdpEl.value = sdpJson
		})
	} else {
		createAnswer(sdp, (sdpJson) => {
			localSdpEl.value = sdpJson
		})
	}
}

function sendMessage() {
	const text = inputBox.value.trim()
	if (text !== '' && sendOnChannel(text)) {
		displayMessage(text, true)
		inputBox.value = ''
	}
}

function displayMessage(message, isMe) {
	const msg = document.createElement('div')
	msg.textContent = message
	msg.classList.add(isMe ? 'me' : 'others')
	chatbox.appendChild(msg)
	chatbox.scrollTop = chatbox.scrollHeight
}
