const configuration = {
	iceServers: [
		{
			urls: [
				'stun:stun1.l.google.com:19302',
				'stun:stun2.l.google.com:19302',
			],
		},
	],
}

const connect = document.querySelector('.connect')
const chatroom = document.querySelector('.chatroom')
const chatbox = document.querySelector('.chatbox')
const typebox = document.querySelector('.typebox')
const inputBox = typebox.querySelector('input')
const inputBtn = typebox.querySelector('button')
const offerBtn = document.getElementById('offer')
const answerBtn = document.getElementById('answer')
const remoteSdp = document.getElementById('remoteSdp')
const remoteIce = document.getElementById('remoteIce')
const rtcPeerConnection = new RTCPeerConnection(configuration)
let dataChannel = undefined
let isOffer = false

offerBtn.onclick = () => {
	isOffer = true
	ConnectInit()
	answerBtn.innerText = '收到回應'
	offerBtn.disabled = true
}
answerBtn.onclick = () => {
	if (remoteSdp.value !== '' && remoteIce.value !== '') {
		const sdp = remoteSdp.value
		const ice = remoteIce.value
		if (isOffer) {
			AddAnswer(sdp)
		} else {
			ConnectInit(sdp)
		}
		SetIceCandidate(ice)
		offerBtn.disabled
		answerBtn.disabled
	} else {
		alert('空的是要怎麼' + answerBtn.innerText)
	}
}
inputBtn.onclick = sendMessage
inputBox.onkeydown = (event) => {
	if (event.key === 'Enter' && event.shiftKey) {
		// inputBox.style.height = `${inputBox.clientHeight + 40}px`
		// inputBox.value += '\n'
	} else if (event.key === 'Enter' && inputBox.value.trim() !== '') {
		sendMessage()
	}
}
function ConnectInit(sdp = undefined) {
	chatInit()
	IceInit()
	if (isOffer) {
		CreateOffer()
	} else {
		CreateAnswer(sdp)
	}
}
function chatInit() {
	if (isOffer) {
		dataChannel = rtcPeerConnection.createDataChannel('chat')
		_channelHandle()
	} else {
		rtcPeerConnection.ondatachannel = function (event) {
			dataChannel = event.channel

			_channelHandle()
		}
	}

	function _channelHandle() {
		dataChannel.onopen = () => {
			connect.remove()
			chatroom.style.display = 'flex'
		}

		dataChannel.onmessage = (event) => {
			const message = event.data
			displayMessage(message, false)
		}
	}
}
let temp_ice = []
function IceInit() {
	rtcPeerConnection.onicecandidate = (event) => {
		if (event.candidate) {
			temp_ice.push(event.candidate)
			document.getElementById('localIce').value = JSON.stringify(temp_ice)
		}
	}
	// rtcPeerConnection.oniceconnectionstatechange = (e) => {
	// 	console.log('iceConnection change: ' + e.target.iceConnectionState)
	// }
}
function SetIceCandidate(candidates) {
	candidates = JSON.parse(candidates)
	candidates.forEach((item) => {
		const candidate = new RTCIceCandidate(item)
		rtcPeerConnection.addIceCandidate(candidate)
	})
}

function CreateOffer() {
	rtcPeerConnection.createOffer().then((offer) => {
		rtcPeerConnection.setLocalDescription(offer)
		document.getElementById('localSdp').value = JSON.stringify(offer)
	})
}
function CreateAnswer(offer) {
	try {
		offer = new RTCSessionDescription(JSON.parse(offer))
		rtcPeerConnection.setRemoteDescription(offer)

		rtcPeerConnection.createAnswer().then((answer) => {
			rtcPeerConnection.setLocalDescription(answer)
			document.getElementById('localSdp').value = JSON.stringify(answer)
		})
	} catch (error) {
		alert('不要亂打好嗎')
	}
}
function AddAnswer(answer) {
	try {
		answer = new RTCSessionDescription(JSON.parse(answer))
		rtcPeerConnection.setRemoteDescription(answer)
	} catch (error) {
		alert('不要亂打好嗎')
	}
}
function sendMessage(message = undefined) {
	if (dataChannel.readyState === 'open') {
		if (message) {
			dataChannel.send(message)
			displayMessage(message, true)
		} else {
			dataChannel.send(inputBox.value)
			displayMessage(inputBox.value, true)
			inputBox.value = ''
		}
	}
}
function displayMessage(message, isMe) {
	const msg = document.createElement('div')
	msg.textContent = message
	if (isMe) {
		msg.classList.add('me')
	} else {
		msg.classList.add('others')
	}
	chatbox.appendChild(msg)
}

// function check() {
// 	console.log('peer connect: ' + rtcPeerConnection.connectionState)
// 	console.log('iceConnect: ' + rtcPeerConnection.iceConnectionState)
// 	console.log('data channel: ' + dataChannel.readyState)
// 	console.log('local SDP: ', rtcPeerConnection.localDescription)
// 	console.log('remote SDP: ', rtcPeerConnection.remoteDescription)
// }
