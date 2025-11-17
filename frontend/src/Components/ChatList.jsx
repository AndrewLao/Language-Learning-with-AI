import './ChatList.css';
import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

const ChatList = ({
    chats = [],
    selectedChat,
    setSelectedChat = () => { },
    setChats = () => { },
    userId = localStorage.getItem('userId') || 'test_user' }) => {

    const [localChats, setLocalChats] = useState(chats);
    const [loading, setLoading] = useState(false);
    const [loadingInitial, setLoadingInitial] = useState(true);

    const fetchChats = async () => {
        setLoadingInitial(true);
        try {
            const resp = await axios.get(
                `${API_BASE}/users/chats/user/${encodeURIComponent(userId)}`,
                { headers: { 'Content-Type': 'application/json' } }
            );
            const data = Array.isArray(resp.data) ? resp.data : [];
            setLocalChats(data);
            setChats(data); // inform parent if provided
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

    const handleAddChat = async () => {
        const name = prompt('Name for new chat', 'New Chat') || 'New Chat';
        const tempId = `temp-${Date.now()}`;

        const optimisticChat = {
            chat_id: tempId,
            chat_name: name,
            created_at: new Date().toISOString(),
        };

        setLocalChats(prev => [...(prev || []), optimisticChat]);
        setChats(prev => [...(prev || []), optimisticChat]);
        setLoading(true);

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

            // replace optimistic chat with server-created chat
            setLocalChats(prev =>
                (prev || []).map(c => (c.chat_id === tempId ? normalized : c))
            );
            setChats(prev =>
                (prev || []).map(c => (c.chat_id === tempId ? normalized : c))
            );
            setSelectedChat && setSelectedChat(normalized.chat_id);

            // refresh to ensure ordering/metadata matches server
            await fetchChats();

        } catch (err) {
            console.error('Failed to create chat', err);

            // remove optimistic chat on failure
            setChats(prev => (prev || []).filter(c => c.chat_id !== tempId));
            alert('Unable to create chat. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="chat-list">
            <h2>Chat List</h2>
            <button className='add-chat' onClick={handleAddChat} disabled={loading}>
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
        </div>
    );
};

export default ChatList;