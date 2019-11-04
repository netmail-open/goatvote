function move_up(e) {
	var list = e.target.parentElement.parentElement;
	var self = e.target.parentElement;
	if(self.previousSibling) {
		list.insertBefore(self, self.previousSibling);
	}
	e.target.focus();
}
function move_down(e) {
	var list = e.target.parentElement.parentElement;
	var self = e.target.parentElement;
	if(self.nextSibling) {
		list.insertBefore(self.nextSibling, self);
	}
	e.target.focus();
}

function get_color(idx) {
	var colors = [
		"pink",
		"orange",
		"gold",
		"yellowgreen",
		"lightgreen",
		"aqua",
		"lightblue",
		"violet"
	];
	return colors[idx % colors.length];
}

function submit_vote() {
	var list = [];
	var nodes = document.querySelectorAll("#choices label");
	for(var i = 0; i < nodes.length; ++i) {
		list.push(nodes.item(i).title);
	}

	document.querySelector(".poll").classList.add("hidden");
	document.querySelector(".loading").classList.remove("hidden");

	var req = {
		voterid: getCookie("voterid"),
		rank: list
	};
	remote("/vote", req, function(res) {
		document.querySelector(".loading").classList.add("hidden");
		msg_voted();
	}, function(err) {
		document.querySelector(".loading").classList.add("hidden");
		msg_error(err);
	});
}

window.addEventListener("load", function() {
	if(!getCookie("voterid")) {
		setCookie("voterid", uuid4());
	}

	var req = {
		voterid: getCookie("voterid")
	};
	remote("/poll", req, function(res) {
		document.querySelector(".loading").classList.add("hidden");
		var choices = (res && res.choices && res.choices.length);
		var results = (res && res.results);
		if(!res || (!choices && !results)) {
			msg_nothing();
			return;
		}
		document.querySelector(".poll").classList.remove("hidden");
		document.querySelector("#title").textContent = res.title;
		document.querySelector("#desc").textContent = res.desc;

		var list = document.querySelector("#choices");
		if(res.closed || res.results) {
			var max = 0;
			Object.keys(res.results).forEach(function(choice) {
				max = Math.max(max, res.results[choice]);
			});

			list.classList.add("result");
			var sorted = res.results;
			if(res.closed) {
				var tmp = [];
				console.log(res.results);
				Object.keys(res.results).forEach(function(choice) {
					tmp.push({
						choice : choice,
						points: res.results[choice] || 0
					});
				});
				tmp.sort(function(a, b) {
					return b.points - a.points;
				});
				sorted = {};
				tmp.forEach(function(obj) {
					sorted[obj.choice] = obj.points;
				});
			}
			console.log(sorted);
			var offset = Math.floor(Math.random() * 100);
			if(res.closed && typeof res.closed === "number") {
				offset = res.closed;
			}
			Object.keys(sorted).forEach(function(choice) {
				var li = document.createElement("li");
				if(res.closed) {
					li.className = "total";
				}
				var perc = ((sorted[choice] / max) * 100) || 0;
				var color = get_color(offset++);
				console.log(perc, sorted[choice], max);
				li.style.background = [
					"linear-gradient(to bottom, rgba(255,255,255,0.25),",
					" rgba(0,0,0,0.25))",
					", ",
					"linear-gradient(to right, ",
					color, " ", perc, "%", ", transparent ", perc, "%)"
				].join("");
				console.log( [
					"linear-gradient(to bottom, rgba(255,255,255,0.25),",
					" rgba(0,0,0,0.25))",
					", ",
					"linear-gradient(to right, ",
					color, " ", perc, "%", ", transparent ", perc, "%)"
				].join(""));
				var lb = document.createElement("label");
				//lb.style.overflow("hidden");
				var sp = document.createElement("span");
				sp.className = "total";
				lb.title = lb.textContent = choice;
				sp.textContent = sorted[choice];

				list.appendChild(li);
				li.appendChild(lb);
				li.appendChild(sp);
			});
			var submit = document.querySelector("#submit");
			var txt = document.createTextNode(
				res.closed ? "The results are in!" : "Voting is still open."
			);
			submit.parentElement.appendChild(txt);
			submit.parentElement.removeChild(submit);
		} else {
			res.choices.forEach(function(choice) {
				var li = document.createElement("li");
				var lb = document.createElement("label");
				var up = document.createElement("a");
				var dn = document.createElement("a");
				li.className = "entry";
				lb.title = lb.textContent = choice;
				up.href = dn.href = "#";
				up.innerHTML = "&uarr;";
				dn.innerHTML = "&darr;";
				up.className = "up";
				dn.className = "down";
				up.addEventListener("click", move_up);
				dn.addEventListener("click", move_down);

				list.appendChild(li);
				li.appendChild(up);
				li.appendChild(dn);
				li.appendChild(lb);
			});
		}
		/*
		sameWidth(list.querySelectorAll("label"));
		window.addEventListener("resize", function() {
			sameWidth(list.querySelectorAll("label"));
		})
		*/
	}, function(err) {
		alert(err);
	});
	document.querySelector("#submit").addEventListener("click", submit_vote);
});
