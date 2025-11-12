import './ChatList.css';

const ChatList = ({ chats, selectedChat, setSelectedChat }) => {
    return (
        <div className="chat-list">
            <h2>Chat List</h2>
            {chats.map((chat, idx) => (
                <div
                    className={`chat-item${selectedChat === chat.name ? " selected" : ""}`}
                    key={idx}
                    onClick={() => setSelectedChat(chat.name)}
                >
                    {chat.name}
                </div>
            ))}
        </div>
    );
};

export default ChatList;