


const hamburger = document.querySelector('.hamburger')
const navMenu = document.querySelector('.sidebar')
const navLink = document.querySelectorAll('.nav-item')


hamburger.addEventListener('click', mobileMenu);
navLink.forEach(n => n.addEventListener('click', closeMenu));
function mobileMenu() {
	hamburger.classList.toggle('active');
	navMenu.classList.toggle('active');
}
function closeMenu() {
	hamburger.classList.remove('active');
	navMenu.classList.remove('active');
	// hamburger.style.position="fixed";
}

var SSE = function (url, options) {
	if (!(this instanceof SSE)) {
		return new SSE(url, options);
	}

	this.INITIALIZING = -1;
	this.CONNECTING = 0;
	this.OPEN = 1;
	this.CLOSED = 2;

	this.url = url;

	options = options || {};
	this.headers = options.headers || {};
	this.payload = options.payload !== undefined ? options.payload : '';
	this.method = options.method || (this.payload && 'POST' || 'GET');
	this.withCredentials = !!options.withCredentials;

	this.FIELD_SEPARATOR = ':';
	this.listeners = {};

	this.xhr = null;
	this.readyState = this.INITIALIZING;
	this.progress = 0;
	this.chunk = '';

	this.addEventListener = function(type, listener) {
		if (this.listeners[type] === undefined) {
			this.listeners[type] = [];
		}

		if (this.listeners[type].indexOf(listener) === -1) {
			this.listeners[type].push(listener);
		}
	};

	this.removeEventListener = function(type, listener) {
		if (this.listeners[type] === undefined) {
			return;
		}

		var filtered = [];
		this.listeners[type].forEach(function(element) {
			if (element !== listener) {
				filtered.push(element);
			}
		});
		if (filtered.length === 0) {
			delete this.listeners[type];
		} else {
			this.listeners[type] = filtered;
		}
	};

	this.dispatchEvent = function(e) {
		if (!e) {
			return true;
		}

		e.source = this;

		var onHandler = 'on' + e.type;
		if (this.hasOwnProperty(onHandler)) {
			this[onHandler].call(this, e);
			if (e.defaultPrevented) {
				return false;
			}
		}

		if (this.listeners[e.type]) {
			return this.listeners[e.type].every(function(callback) {
				callback(e);
				return !e.defaultPrevented;
			});
		}

		return true;
	};

	this._setReadyState = function(state) {
		var event = new CustomEvent('readystatechange');
		event.readyState = state;
		this.readyState = state;
		this.dispatchEvent(event);
	};

	this._onStreamFailure = function(e) {
		var event = new CustomEvent('error');
		event.data = e.currentTarget.response;
		this.dispatchEvent(event);
		this.close();
	}

	this._onStreamAbort = function(e) {
		this.dispatchEvent(new CustomEvent('abort'));
		this.close();
	}

	this._onStreamProgress = function(e) {
		if (!this.xhr) {
			return;
		}

		if (this.xhr.status !== 200) {
			this._onStreamFailure(e);
			return;
		}
		 if(this.xhr.status === 201) {
			 this._onStreamProgress((e));
		 }
		if (this.readyState == this.CONNECTING) {
			this.dispatchEvent(new CustomEvent('open'));
			this._setReadyState(this.OPEN);
		}

		var data = this.xhr.responseText.substring(this.progress);
		this.progress += data.length;
		data.split(/(\r\n|\r|\n){2}/g).forEach(function(part) {
			if (part.trim().length === 0) {
				this.dispatchEvent(this._parseEventChunk(this.chunk.trim()));
				this.chunk = '';
			} else {
				this.chunk += part;
			}
		}.bind(this));
	};

	this._onStreamLoaded = function(e) {
		this._onStreamProgress(e);

		// Parse the last chunk.
		this.dispatchEvent(this._parseEventChunk(this.chunk));
		this.chunk = '';
	};

	/**
	 * Parse a received SSE event chunk into a constructed event object.
	 */
	this._parseEventChunk = function(chunk) {
		if (!chunk || chunk.length === 0) {
			return null;
		}

		var e = {'id': null, 'retry': null, 'data': '', 'event': 'message'};
		chunk.split(/\n|\r\n|\r/).forEach(function(line) {
			line = line.trimRight();
			var index = line.indexOf(this.FIELD_SEPARATOR);
			if (index <= 0) {
				// Line was either empty, or started with a separator and is a comment.
				// Either way, ignore.
				return;
			}

			var field = line.substring(0, index);
			if (!(field in e)) {
				return;
			}

			var value = line.substring(index + 1).trimLeft();
			if (field === 'data') {
				e[field] += value;
			} else {
				e[field] = value;
			}
		}.bind(this));

		var event = new CustomEvent(e.event);
		event.data = e.data;
		event.id = e.id;
		return event;
	};

	this._checkStreamClosed = function() {
		if (!this.xhr) {
			return;
		}

		if (this.xhr.readyState === XMLHttpRequest.DONE) {
			this._setReadyState(this.CLOSED);
		}
	};

	this.stream = function() {
		this._setReadyState(this.CONNECTING);

		this.xhr = new XMLHttpRequest();
		this.xhr.addEventListener('progress', this._onStreamProgress.bind(this));
		this.xhr.addEventListener('load', this._onStreamLoaded.bind(this));
		this.xhr.addEventListener('readystatechange', this._checkStreamClosed.bind(this));
		this.xhr.addEventListener('error', this._onStreamFailure.bind(this));
		this.xhr.addEventListener('abort', this._onStreamAbort.bind(this));
		this.xhr.open(this.method, this.url);
		for (var header in this.headers) {
			this.xhr.setRequestHeader(header, this.headers[header]);
		}
		this.xhr.withCredentials = this.withCredentials;
		this.xhr.send(this.payload);
	};

	this.close = function() {
		if (this.readyState === this.CLOSED) {
			return;
		}

		this.xhr.abort();
		this.xhr = null;
		this._setReadyState(this.CLOSED);
	};
};

// Export our SSE module for npm.js
if (typeof exports !== 'undefined') {
	exports.SSE = SSE;
}


const textarea = document.querySelector('textarea')
const sendMessageText = document.querySelector('.send-message-text')


var formData = {
	message: sendMessageText?.value,
	au: 9,
	akey: '51uOYuCZsrJyIvGbavEi7wmUEIxED25HLi8'
};

// use SSE to get server Events
var source;
source = new SSE("https://api.nando.ai/ai_chat_new.php", {payload: JSON.stringify(formData)});

function isSendMessage() {
	// return fetch(url, {method: "POST", headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)});
	// setTimeout(() => {
	// 	sendMessageText.value = ""
	// }, 50)
	let story = document.querySelector('.main-content');
	let respContent = document.querySelector('.response-div');
	story.style.display = "none";
	respContent.style.display = "block";
	document.querySelector('.question-text').innerHTML = sendMessageText?.value;
	document.querySelector('.send-message-text').value = '';
	formData.message = sendMessageText.value;
	document.querySelector('.regenerate').style.display = "block";
	return fetch("https://api.nando.ai/ai_chat_new.php", {
		method: "POST",
		headers: {'Content-Type': 'application/json'},
		body: JSON.stringify(formData)}
	)
}

// source.addEventListener('message', function (e) {
// 	if(e.data){
// 		//console.log('data ' . e.data);
// 		if(e.data != '[DONE]'){
// 			var tokens = JSON.parse(e.data).choices[0].delta.content
// 			if(tokens != undefined) {
// 				textarea.innerHTML += tokens
// 			}
// 		}else{
// 			console.log('Completed');
// 		}
// 	}
// })
source.stream()
