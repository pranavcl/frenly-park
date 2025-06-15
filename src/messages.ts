interface Message {
	room: string;
	sender: string;
	message: string;
}

const chatMessages: Message[] = [];

const addMessage = (room: string, sender: string, message: string) => {
	chatMessages.push({ room, sender, message });
	return { sender, message };
};

const getMessages = (room: string) => {
	return chatMessages.filter((chatMessages) => chatMessages.room === room);
};

const deleteBotMessages = (room: string) => {
	const indexes: number[] = [];

	chatMessages.forEach((msg, index) => {
		if (msg.room === room && msg.sender === "bot") {
			indexes.push(index);
		}
	});

	indexes.reverse().forEach((idx) => {
		chatMessages.splice(idx, 1);
	});
};

const clearChat = (room: string) => {
	const indexes: number[] = [];

	chatMessages.forEach((msg, index) => {
		if (msg.room === room) {
			chatMessages.splice(index, 1);
		}
	});

	indexes.reverse().forEach((idx) => {
		chatMessages.splice(idx, 1);
	});
};

export default { addMessage, getMessages, deleteBotMessages, clearChat };
