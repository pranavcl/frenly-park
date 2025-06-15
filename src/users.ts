interface User {
	id: string;
	room: string;
	username: string;
}

const users: User[] = [];

const userJoin = (id: string, room: string, username: string) => {
	const user = { id, room, username };
	users.push(user);
	return user;
};

const getRoomUsers = (room: string) => {
	return users.filter((user) => user.room === room);
};

const removeUser = (id: string) => {
	users.forEach((user, idx) => {
		if (user.id === id) {
			users.splice(idx, 1);
		}
	});
};

export default { userJoin, getRoomUsers, removeUser };
