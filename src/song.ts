interface Song {
	room: string;
	song: {
		title: string;
		URL: string;
		time: number;
	};
	index: number;
	shuffle: boolean;
}

const currentSong: Song[] = [];

const setSong = (room: string) => {
	currentSong.push({
		room,
		song: { title: "", URL: "", time: 0 },
		index: -1,
		shuffle: false,
	});
};

const getSongData = (room: string) => {
	return currentSong.find((x) => x.room === room);
};

const clearSong = (room: string) => {
	currentSong.forEach((song, index) => {
		if (song.room === room) {
			currentSong.splice(index, 1);
		}
	});
};

export default { setSong, getSongData, clearSong };
