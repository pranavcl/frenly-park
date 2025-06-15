interface Song {
	room: string;
	title: string;
	searchText: string;
	URL: string;
}

const queue: Song[] = [];

const addSong = (room: string, title: string, searchText: string, URL: string) => {
	queue.push({ room, title, searchText, URL });
};

const getSongs = (room: string) => {
	return queue.filter((song) => song.room === room);
};

const removeSong = (room: string, idx: number) => {
	const indexes: number[] = [];
	queue.forEach((song, index) => {
		if (song.room === room) {
			indexes.push(index);
		}
	});
	queue.splice(indexes.indexOf(idx), 1);
};

const clearQueue = (room: string) => {
	const indexes: number[] = [];

	queue.forEach((song, index) => {
		if (song.room === room) {
			indexes.push(index);
		}
	});

	indexes.reverse().forEach((idx) => {
		queue.splice(idx, 1);
	});
};

export default { addSong, getSongs, removeSong, clearQueue };
