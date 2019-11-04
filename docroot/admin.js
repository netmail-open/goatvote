function save(e) {
	if(e && e.preventDefault) {
		e.preventDefault();
	}
	var msg = document.querySelector(".msg");
	var ui = document.querySelector(".poll");
	var load = document.querySelector(".loading");
	var req = {
		title: document.querySelector("#title").value,
		desc: document.querySelector("#desc").value,
		choices: [],
		closed: (document.querySelector("#closed").checked ?
				new Date().valueOf() : false),
		clear: document.querySelector("#clear").checked,
		code: document.querySelector("#code").value
	};
	var choices = document.querySelectorAll("#choices input");
	for(var i = 0; i < choices.length; ++i) {
		req.choices.push(choices.item(i).value);
	}
	ui.classList.add("hidden");
	load.classList.remove("hidden");
	remote("/admin", req, function(res) {
		//document.querySelector("#submit");
		load.classList.add("hidden");
		msg_error("Saved!", true);
		setTimeout(function() {
			msg.classList.add("hidden");
			ui.classList.remove("hidden");
		}, 3000);
	}, function(err) {
		load.classList.add("hidden");
		msg_error(err);
		setTimeout(function() {
			msg.classList.add("hidden");
			ui.classList.remove("hidden");
		}, 3000);
	});
}

function remove(e) {
	e.preventDefault();
	var item = e.target.parentNode;
	item.parentNode.removeChild(item);
}

function add(value) {
	if(value.target && value.preventDefault) {
		value.preventDefault();
		value = "";
	}
	var list = document.querySelector("#choices");
	var li = document.createElement("li");
	var np = document.createElement("input");
	var rm = document.createElement("a");
	//li.className = "choice";
	np.value = value || "";
	rm.ref = "#";
	rm.innerHTML = "&otimes;";
	rm.addEventListener("click", remove);
	list.appendChild(li);
	li.appendChild(np);
	li.appendChild(rm);
	if(!value) {
		np.focus();
	}
}

window.addEventListener("load", function() {
	var req = {};
	remote("/poll", req, function(res) {
		document.querySelector(".loading").classList.add("hidden");
		if(!res || (!res.choices && !res.results)) {
			msg_nothing();
			return;
		}
		document.querySelector(".poll").classList.add("admin");
		document.querySelector(".poll").classList.remove("hidden");
		document.querySelector("#title").value = res.title;
		document.querySelector("#desc").value = res.desc;
		document.querySelector("#closed").checked = res.closed;

		var list = document.querySelector("#choices");
		res.choices.forEach(function(choice) {
			add(choice);
		});
		sameWidth(list.querySelectorAll("label"));
		window.addEventListener("resize", function() {
			sameWidth(list.querySelectorAll("label"));
		});
	});
	document.querySelector("#add").addEventListener("click", add);
	document.querySelector("#submit").addEventListener("click", save);
});
