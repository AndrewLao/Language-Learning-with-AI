import './ChatList.css';
import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

const ChatList = ({
    chats = [],
    selectedChat,
    setSelectedChat = () => { },
    setChats = () => { },
    userId = localStorage.getItem('cognitoSub') || 'test_user' }) => {

    const [localChats, setLocalChats] = useState(chats);
    const [loading, setLoading] = useState(false);
    const [loadingInitial, setLoadingInitial] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newChatName, setNewChatName] = useState("");

    const fetchChats = async () => {
        setLoadingInitial(true);
        try {
            const resp = await axios.get(
                `${API_BASE}/users/chats/user/${encodeURIComponent(userId)}`,
                { headers: { 'Content-Type': 'application/json' } }
            );
            let fetched = Array.isArray(resp.data) ? resp.data : [];
            fetched = fetched.sort((a, b) => {
                const timeA = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
                const timeB = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
                return timeB - timeA;
            });
            setLocalChats(fetched);
            setChats(fetched);
        } catch (err) {
            if (err.response && err.response.status === 404) {
                setLocalChats([]);
                setChats([]);
            } else {
                console.error("Failed to fetch chats:", err);
            }
        } finally {
            setLoadingInitial(false);
        }
    };

    useEffect(() => {
        let mounted = true;
        if (mounted) fetchChats();
        return () => { mounted = false; };
    }, []); // run once on mount

    const handleCreateChat = async (name) => {
        if (!name.trim()) return;

        setLoading(true);

        const tempId = `temp-${Date.now()}`;
        const optimisticChat = {
            chat_id: tempId,
            chat_name: name,
            created_at: new Date().toISOString(),
        };

        setLocalChats(prev => [...prev, optimisticChat]);
        setChats(prev => [...prev, optimisticChat]);

        try {
            const resp = await axios.post(
                `${API_BASE}/users/chats`,
                null,
                {
                    params: {
                        user_id: userId,
                        chat_name: name
                    },
                    headers: { 'Content-Type': 'application/json' }
                }
            );

            const created = resp.data || {};
            const normalized = {
                chat_id: created.chat_id,
                chat_name: created.chat_name,
                created_at: created.created_at
            };

            setLocalChats(prev =>
                prev.map(c => (c.chat_id === tempId ? normalized : c))
            );
            setChats(prev =>
                prev.map(c => (c.chat_id === tempId ? normalized : c))
            );
            setSelectedChat(normalized.chat_id);

            await fetchChats();
        } catch (err) {
            console.error('Failed to create chat', err);
            setLocalChats(prev => prev.filter(c => c.chat_id !== tempId));
        } finally {
            setLoading(false);
            setShowModal(false);
            setNewChatName("");
        }
    };


    return (
        <div className="chat-list">
            <h2>Chat List</h2>
            <button className='add-chat' onClick={() => setShowModal(true)}>
                {loading ? 'Creating…' : '+ New Chat'}
            </button>
            {loadingInitial ? (
                <div className="chat-loading">Loading…</div>
            ) : localChats.length === 0 ? (
                <div className="chat-empty">No Chats Yet</div>
            ) : (
                localChats.map((chat, idx) => {
                    const id = chat.chat_id || chat.id || chat._id || `chat-${idx}`;
                    const title = chat.chat_name || chat.title || chat.name || `Chat ${idx + 1}`;
                    const snippet = (chat.messages && chat.messages.length) ? chat.messages.slice(-1)[0].content : '';
                    const isSelected = selectedChat === id;

                    return (
                        <div
                            className={`chat-item${isSelected ? " selected" : ""}`}
                            key={id}
                            onClick={() => setSelectedChat(id)}
                        >
                            <div className="chat-item-title">{title}</div>
                            {snippet && <div className="chat-item-snippet">{snippet}</div>}
                        </div>
                    );
                })
            )}

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        <h3>Create New Chat</h3>

                        <input
                            type="text"
                            className="modal-input"
                            placeholder="Chat name..."
                            value={newChatName}
                            onChange={(e) => setNewChatName(e.target.value)}
                            autoFocus
                        />

                        <div className="modal-buttons">
                            <button
                                className="modal-create"
                                disabled={loading || newChatName.trim() === ""}
                                onClick={() => handleCreateChat(newChatName)}
                            >
                                {loading ? "Creating..." : "Create"}
                            </button>

                            <button
                                className="modal-cancel"
                                onClick={() => {
                                    setShowModal(false);
                                    setNewChatName("");
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default ChatList;