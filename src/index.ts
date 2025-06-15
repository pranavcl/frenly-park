import express from "express";
import http from "http";
import dotenv from "dotenv";
import { Server } from "socket.io";
import cors from "cors";
import { youtube as yt } from "scrape-youtube";
import { exec } from "child_process";

import users from "./users";
import messages from "./messages";
import songQueue from "./queue";
import song from "./song";

const { xss } = require("express-xss-sanitizer");

dotenv.config(); // Load environment variables

// Express configuration

const app = express();
const port = process.env.PORT ?? 5000;

app.use(xss());
app.use(cors());

// Socket.io

const server = http.createServer(app);
const io = new Server(server);

// Helper functions

const fixChat = (room: string) => {
	// This function deletes all messages by bots and forces all users to reset their DOM
	messages.deleteBotMessages(room);
	io.to(room).emit("printChatLog", messages.getMessages(room));
};

interface Song {
	room: string;
	title: string;
	searchText: string;
	URL: string;
}

const changeSong = (
	room: string,
	songs: Song[],
	mode: string,
	shuffle: boolean,
	idx: number | undefined,
) => {
	const current = song.getSongData(room);

	if (!current) {
		return;
	}

	if (mode === "next") {
		if (shuffle) {
			current.index = Math.floor(Math.random() * songs.length);
		} else {
			current.index++;
			if (current.index > songs.length - 1) {
				current.index = 0;
			}
		}
	} else if (mode === "prev") {
		if (shuffle) {
			current.index = Math.floor(Math.random() * songs.length);
		} else {
			current.index--;
			if (current.index < 0) {
				current.index = songs.length - 1;
			}
		}
	} else if (typeof idx !== "undefined") {
		current.index = idx;
	}

	current.shuffle = shuffle;
	current.song = {
		title: songs[current.index].title,
		URL: songs[current.index].URL,
		time: 0,
	};

	io.to(room).emit("printQueue", songs);
	io.to(room).emit("playSong", current.song);
};

io.on("connection", (socket) => {
	console.log(`✨ A new socket just connected with ID ${socket.id}`);

	socket.on("join", (room: string, username: string) => {
		const user = users.userJoin(socket.id, room, username); // Add to users array
		socket.join(user.room); // Add user to socket.io room

		console.log(`🛋️ ${username} joined room ${room}`);

		socket.emit("printChatLog", messages.getMessages(user.room)); // Send current messages to user
		let msg = messages.addMessage(user.room, "bot", `${user.username} is here!`);
		io.to(user.room).emit("chatMessage", msg);

		socket.on("chatMessage", (message) => {
			// Broadcast message by user
			let msg = messages.addMessage(user.room, user.username, message);
			io.to(user.room).emit("chatMessage", msg);
		});

		setTimeout(() => fixChat(user.room), 10000); // Every 10 seconds, call fixChat

		socket.emit("printQueue", songQueue.getSongs(user.room)); // Send current queue to user

		let current = song.getSongData(user.room);
		if (current) {
			socket.to(user.room).emit("getData", user.id, current.song);
		}

		socket.on("setData", (userX, song, time, loop, shuffle) => {
			song.time = time + 1;

			if (songQueue.getSongs(user.room).length) {
				io.to(userX).emit("playSong", song);
			}

			io.to(userX).emit("loopSong", loop);
			io.to(userX).emit("shuffleSong", shuffle);
		});

		socket.on("addSong", (search, state) => {
			io.to(user.room).emit("setSearchState", true);
			setTimeout(() => io.to(user.room).emit("setSearchState", false), 10000);

			yt.search(search).then((res) => {
				if (res.videos.length) {
					exec("yt-dlp -f 140 -g -- " + res.videos[0].id, (error, stdout, stderr) => {
						if (error) {
							console.error(`exec error: ${error}`);
							return;
						}

						songQueue.addSong(user.room, res.videos[0].title, search, stdout);
						const songs = songQueue.getSongs(user.room);
						io.to(user.room).emit("printQueue", songs);
						if (!state) {
							song.setSong(user.room);
							changeSong(user.room, songs, "next", false, undefined);
						}
					});
				}
			});
		});

		socket.on("loopSong", (loop) => {
			io.to(user.room).emit("loopSong", loop);
		});

		socket.on("shuffleSong", (shuffle) => {
			current = song.getSongData(user.room);

			if (!current) {
				return;
			}

			current.shuffle = shuffle;
			io.to(user.room).emit("shuffleSong", shuffle);
		});

		socket.on("play", (mode, shuffle, idx) => {
			const songs = songQueue.getSongs(user.room);
			if (songs.length) {
				changeSong(user.room, songs, mode, shuffle, idx);
			}
		});

		socket.on("removeSong", (idx) => {
			songQueue.removeSong(user.room, idx);
			const songs = songQueue.getSongs(user.room);
			current = song.getSongData(user.room);

			if (!current) {
				return;
			}

			if (current.index === idx) {
				current.index--;
				if (!songs.length) {
					io.to(user.room).emit("managePlay", true);
				} else {
					changeSong(user.room, songs, "next", current.shuffle, undefined);
				}
			} else if (current.index > idx) {
				current.index--;
			}

			io.to(room).emit("printQueue", songs);
		});

		socket.on("managePlay", (state) => {
			io.to(user.room).emit("managePlay", state);
		});

		socket.on("skipTime", (time) => {
			io.to(user.room).emit("skipTime", time);
		});

		socket.on("getUsers", () => {
			socket.emit("printUsers", users.getRoomUsers(user.room));
		});

		socket.on("disconnect", () => {
			users.removeUser(socket.id);
			msg = messages.addMessage(user.room, "bot", user.username + " has left!");
			io.to(user.room).emit("chatMessage", msg);

			if (users.getRoomUsers(room).length == 0) {
				songQueue.clearQueue(room);
				messages.clearChat(room);
				song.clearSong(room);
			}
		});
	});
});

// `GET /`

app.get("/", (req: express.Request, res: express.Response) => {
	res.sendFile(__dirname + "/public/index.html");
});
app.use("/public", express.static(__dirname + "/public"));

server.listen(port, () => {
	console.log("✅ Server started on port " + port);
});
