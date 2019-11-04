function remote(path, data, cb, errcb, verb, raw) {
	verb = verb || "POST";
	let XHR = new XMLHttpRequest();
	let error = function(event) {
		//console.error("xhr failure", XHR);
		let res = XHR.response;
		try {
			res = JSON.parse(XHR.response);
		} catch(ignore) {}
		if(typeof errcb === "function") {
			errcb(res, XHR);
		} else {
			console.error("error " + verb + "ing " + path, res);
		}
	};
	XHR.addEventListener("load", function(event) {
		if(XHR.status < 200 || XHR.status > 299) {
			error(event);
		} else if(typeof cb === "function") {
			let res = XHR.response;
			if(res && !raw) {
				try {
					res = JSON.parse(XHR.response);
				} catch(ignore) {
					console.error("failed to parse json", XHR.response);
				}
			}
			cb(res);
		}
	});
	XHR.addEventListener("error", error);
	XHR.open(verb, path);
	XHR.setRequestHeader("Content-Type", "application/json");
	XHR.setRequestHeader("Accept", "application/json");
	XHR.send(raw ? data : JSON.stringify(data));
}
function remote_raw(path, data, cb, errcb, verb) {
	return remote(path, data, cb, errcb, verb, true);
}

function uuid4(a, b) {
	// from https://gist.github.com/LeverOne/1308368
	for(b=a="";a++<36;b+=a*51&52?(a^15?8^Math.random()*(a^20?16:4):4).toString(16):"-");
	return b;
}

function getCookie(key) {
	let c = document.cookie.split("; ");
	let cookies = {};
	c.forEach(function(cookie) {
		cookies[cookie.split("=")[0]] = cookie.split("=")[1];
	});
	if(key) {
		return cookies[key];
	} else {
		return cookies;
	}
}
function setCookie(key, value) {
	document.cookie = "" + key + "=" + value;
}

function popup() {
	let fade = document.createElement("div");
	fade.className = "popupFade";
	let view = document.createElement("div");
	view.className = "popupView";
	let btn = document.createElement("button");
	btn.className = "popupCloseBtn";
	btn.textContent = "X";
	document.body.appendChild(fade);
	document.body.appendChild(view);
	view.appendChild(btn);
	let close = null;
	close = function(e) {
		if(e) {
			e.stopPropagation();
			e.preventDefault();
		}
		if(e.key && e.key !== "Escape") {
			return;
		}
		document.body.removeChild(view);
		document.body.removeChild(fade);
		document.removeEventListener("keyup", close);
	}
	fade.addEventListener("click", close);
	document.addEventListener("keyup", close);
	btn.addEventListener("click", close);
	return view;
}

function sameWidth(nodelist) {
	let width = 0;
	for(let i = 0; i < nodelist.length; i++) {
		nodelist[i].style.width = null;
	}
	let max = 0;
	for(let i = 0; i < nodelist.length; i++) {
		max = Math.max(max, nodelist[i].offsetWidth);
	}
	for(let i = 0; i < nodelist.length; i++) {
		if(!nodelist[i].style.display) {
			nodelist[i].style.display = "inline-block";
		}
		nodelist[i].style.width = max + "px";
	}
}

function msg_nothing() {
	var msg = document.querySelector(".msg");
	var txt = document.createTextNode("There isn't any active poll right now.");
	msg.appendChild(txt);
	msg.classList.remove("hidden");
}
function msg_voted() {
	var msg = document.querySelector(".msg");
	msg.appendChild(document.createTextNode("Your vote has been counted!"));
	msg.appendChild(document.createElement("br"));
	var a = document.createElement("a");
	a.textContent = "Reload";
	a.href="/";
	msg.appendChild(a);
	msg.appendChild(document.createTextNode(" to check for the results."));
	msg.classList.remove("hidden");
}
function msg_error(err, skipHeader) {
	var msg = document.querySelector(".msg");
	while(msg.firstChild) {
		msg.removeChild(msg.firstChild);
	}
	if(!skipHeader) {
		msg.appendChild(document.createTextNode("An error has occurred:"));
		msg.appendChild(document.createElement("br"));
	}
	msg.appendChild(document.createTextNode(err));
	msg.classList.remove("hidden");
}
