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

offerBtn.onclick = () => {
	setIsOffer(true)
	answerBtn.innerText = '收到回應'
	offerBtn.disabled = true
	connectInit()
}

answerBtn.onclick = () => {
	const sdp = remoteSdpEl.value
	const ice = remoteIceEl.value
	if (sdp !== '' && ice !== '') {
		try {
			if (isOffer) {
				setAnswer(sdp)
			} else {
				connectInit(sdp)
			}
			setIceCandidates(ice)
		} catch {
			alert('不要亂打好嗎')
		}
	} else {
		alert('空的是要怎麼' + answerBtn.innerText)
	}
}

inputBtn.onclick = sendMessage
inputBox.onkeydown = (event) => {
	if (event.key === 'Enter' && !event.shiftKey && inputBox.value.trim() !== '') {
		sendMessage()
	}
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
}
