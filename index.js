const VERSION = "0.0.1";
let program = require("commander");
let app = require("connect")();
let http = require("http");
let fs = require("fs-extra");
let path = require("path");
let url = require("url");


if(require.main === module) {
    program.version(VERSION)
		.option("-p, --port", "listener port (env: PORT; default=8000)")
		.option("-c, --code", "admin code    (env: CODE; default='secret')")
		.parse(process.argv);
    cmdopts = program.opts();
	process.env.PORT = cmdopts.port || process.env.PORT || 8000;
	process.env.CODE = cmdopts.code || process.env.CODE || "secret";
}


let POLL = {
	title: "",
	desc: "",
	choices: [],
	closed: false
};
let VOTES = {
	//voterid: [ "firstchoice", "second", ... ], ...
};


function membersMatch(arr1, arr2) {
	if(arr1 && arr2 && arr1.length === arr2.length) {
		var copy1 = JSON.parse(JSON.stringify(arr1));
		var copy2 = JSON.parse(JSON.stringify(arr2));
		copy1.sort();
		copy2.sort();
		return (JSON.stringify(copy1) === JSON.stringify(copy2));
	}
	return false;
}

function getResults() {
	var ret = {};
	POLL.choices.forEach(function(choice) {
		ret[choice] = 0;
	});
	Object.keys(VOTES).forEach(function(vid) {
		if(!membersMatch(VOTES[vid], POLL.choices)) {
			return;
		}
		let pts = 0;
		let revrank = JSON.parse(JSON.stringify(VOTES[vid])).reverse();
		revrank.forEach(function(vote) {
			ret[vote] += pts;
			++pts;
		});
	});
	return ret;
}

app.use(function(req, res) {
	let types = {
		".html": "text/html",
		".css": "text/css",
		".js": "text/javascript"
	};
	if(req.url.indexOf("/.") >= 0) {
		// handle naughty requests
		res.statusCode = 400;
		res.end("SUCK IT DAN");
	} else if(req.method === "POST") {
		let data = [];
		req.on("data", function(chunk) {
			data.push(chunk.toString());
		});
		req.on("end", function() {
			let request = null;
			try {
				request = JSON.parse(data.join(""));
			} catch(err) {
				res.writeHead(400, {
					"Content-Type": "text/plain"
				});
				res.end("400 Bad request\n");
			}

			if(req.url === "/admin") {
				// apply settings from an admin
				if(request.code === process.env.CODE) {
					POLL = {
						title: request.title || "",
						desc: request.desc || "",
						choices: request.choices || [],
						closed: request.closed || false
					};
					if(request.clear) {
						VOTES = {};
					}
					res.writeHead(200, {
						"Content-Type": "text/plain"
					});
					res.end("200 OK\n");
				} else {
					res.writeHead(400, {
						"Content-Type": "text/plain"
					});
					res.end("403 Not Allowed\n");
				}
			} else if(req.url === "/poll") {
				// fetch poll data
				res.writeHead(200, {
					"Content-Type": "application/json"
				});
				var out = JSON.parse(JSON.stringify(POLL));
				if(POLL.closed || (request.voterid && VOTES[request.voterid])) {
					out.results = getResults();
				}
				res.end(JSON.stringify(out));
			} else if(req.url === "/vote") {
				// accept a vote
				let vote = request;
				let response = { auth: null };

				if(vote.voterid && !POLL.closed &&
				   membersMatch(vote.rank, POLL.choices)) {
					VOTES[vote.voterid] = vote.rank;
//console.log(VOTES);
					res.writeHead(200, {
						"Content-Type": "application/json"
					});
					res.end("{}");
				} else {
					res.writeHead(400, {
						"Content-Type": "text/plain"
					});
					res.end("400 Bad request\n");
				}
			}
		});
	} else {
		// serve up UI from docroot
		let uri = url.parse(req.url).pathname;
		let filename = path.join(__dirname + "/docroot" + uri);
		fs.exists(filename, function(exists) {
			if(!exists) {
				res.writeHead(404, {
					"Content-Type": "text/plain"
				});
				res.write("404 Not Found\n");
				res.end();
				return;
			}

			if(fs.statSync(filename).isDirectory()) {
				filename += "/index.html";
			}
			fs.readFile(filename, "binary", function(err, file) {
				if(err) {
					res.writeHead(500, {
						"Content-Type": "text/plain"
					});
					res.write(err + "\n");
					res.end();
					return;
				}
				let headers = {};
				let contentType = types[path.extname(filename)];
				if(contentType) {
					headers["Content-Type"] = contentType;
				}
				res.writeHead(200, headers);
				res.write(file, "binary");
				res.end();
			});
		});
	}
});

// Start the server
let server = http.createServer((req, res) => {
	return app(req, res);
});

server.listen(process.env.PORT);
server.on("listening", () => {
	console.log("Listening on port " + process.env.PORT);
	if(process.env.CODE) {
	} else {
		console.log("Using default CODE; hope everybody's honest!");
	}
});
