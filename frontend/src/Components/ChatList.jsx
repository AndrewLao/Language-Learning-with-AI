import './ChatList.css';
import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

// Fixed lesson definitions
const LESSONS = [
    { id: 1, name: "Lesson 1" },
    { id: 2, name: "Lesson 2" },
    { id: 3, name: "Lesson 3" },
    { id: 4, name: "Lesson 4" },
    { id: 5, name: "Lesson 5" },
    { id: 6, name: "Lesson 6" },
    { id: 7, name: "Lesson 7" }
];

// Build synthetic lesson items (shown only if not materialized)
const buildLessonChats = (realChats) => {
    return LESSONS
        .filter(l => !realChats.some(rc => rc.chat_name === l.name)) // remove if real chat exists
        .map(l => ({
            chat_id: `lesson-${l.id}`,
            chat_name: l.name,
            isLesson: true,
            lesson_id: l.id
        }));
};

const ChatList = ({
    selectedChat,
    setSelectedChat = () => { },
    setChats = () => { },
}) => {

    const [realChats, setRealChats] = useState([]);
    const [loadingInitial, setLoadingInitial] = useState(true);
    const [userId, setUserId] = useState(null);

    useEffect(() => {
        const stored = localStorage.getItem('cognitoSub');
        setUserId(stored || 'test_user');
    }, []);

    const lessonChats = [
        ...realChats
            .filter(c => /^Lesson\s+\d+$/.test(c.chat_name))
            .map(c => ({
                ...c,
                isLesson: true,
                lesson_id: Number(c.chat_name.replace("Lesson ", "")),
            })),
        ...buildLessonChats(realChats)
    ];

    const [loading, setLoading] = useState(false);

    const [showModal, setShowModal] = useState(false);
    const [newChatName, setNewChatName] = useState("");

    // ---------------------------------------------------------------
    // Fetch real chats from Mongo
    // ---------------------------------------------------------------
    const fetchChats = async () => {
        setLoadingInitial(true);

        try {
            const resp = await axios.get(`${API_BASE}/users/chats/user/${userId}`);
            let dbChats = Array.isArray(resp.data) ? resp.data : [];

            // Sort real chats by recency
            dbChats = dbChats.sort((a, b) => {
                const tA = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
                const tB = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
                return tB - tA;
            });

            setRealChats(dbChats);

            // Combine into a single list
            const syntheticLessons = buildLessonChats(dbChats);
            const combined = [
                ...dbChats,
                ...syntheticLessons.sort((a, b) => a.lesson_id - b.lesson_id) // ensure lesson order
            ];

            setChats(combined);

        } catch (err) {
            console.error("Failed to load chats:", err);

            const lessonOnly = buildLessonChats([]);
            setRealChats([]);
            setChats(lessonOnly);

        } finally {
            setLoadingInitial(false);
        }
    };

    useEffect(() => {
        if (!userId) return;
        fetchChats();
    }, [userId]);

    const handleSelectChat = async (chat) => {
        // Normal chat
        if (!chat.isLesson) {
            setSelectedChat(chat.chat_id);
            return;
        }

        // Extract lesson id from chat title
        const lessonId = Number(chat.chat_name.replace("Lesson ", "").trim());
        const lessonName = `Lesson ${lessonId}`;

        const existing = realChats.find(rc => rc.chat_name === lessonName);
        if (existing) {
            setSelectedChat(existing.chat_id);
            return;
        }

        // Otherwise create it now
        setLoading(true);
        try {
            const resp = await axios.post(
                `${API_BASE}/users/chats`,
                null,
                { params: { user_id: userId, chat_name: lessonName } }
            );

            const created = resp.data;

            const realChat = {
                chat_id: created.chat_id,
                chat_name: created.chat_name,
                created_at: created.created_at
            };

            const updated = [...realChats, realChat];
            setRealChats(updated);

            // Rebuild combined UI list
            const syntheticLessons = buildLessonChats(updated);

            setChats([
                ...updated,
                ...syntheticLessons.sort((a, b) => a.lesson_id - b.lesson_id)
            ]);

            setSelectedChat(realChat.chat_id);

        } catch (err) {
            console.error("Failed to create lesson chat:", err);
        }

        setLoading(false);
    };


    // ---------------------------------------------------------------
    // Manual Creation for custom chats
    // ---------------------------------------------------------------
    const handleCreateChat = async (name) => {
        const cleanName = name.trim();

        if (!cleanName) return;

        // ❌ Prevent user-created chats that match "Lesson X"
        const isForbiddenLessonName = /^lesson\s+\d+$/i.test(cleanName);
        if (isForbiddenLessonName) {
            alert("You cannot create chats named 'Lesson X'. That format is reserved.");
            return;
        }

        setLoading(true);

        try {
            const resp = await axios.post(
                `${API_BASE}/users/chats`,
                null,
                { params: { user_id: userId, chat_name: cleanName } }
            );

            const newChat = resp.data;

            const updatedReal = [...realChats, newChat];
            setRealChats(updatedReal);

            const lessons = buildLessonChats(updatedReal);

            setChats([
                ...updatedReal,
                ...lessons.sort((a, b) => a.lesson_id - b.lesson_id)
            ]);

            setSelectedChat(newChat.chat_id);

        } catch (err) {
            console.error("Failed to create chat:", err);
        }

        setShowModal(false);
        setNewChatName("");
        setLoading(false);
    };


    return (
        <div className="chat-list">
            <h2>Your Chats</h2>

            {/* User-created + lesson-backed REAL chats */}
            {loadingInitial ? (
                <div className="chat-loading">Loading…</div>
            ) : realChats.filter(c => !/^Lesson\s+\d+$/.test(c.chat_name)).length === 0 ? (
                <div className="chat-empty">No Chats Yet</div>
            ) : (
                realChats
                    .filter(c => !/^Lesson\s+\d+$/.test(c.chat_name))   // ⬅ remove lesson chats here
                    .map((chat) => {
                        const isSelected = selectedChat === chat.chat_id;
                        return (
                            <div
                                className={`chat-item${isSelected ? " selected" : ""}`}
                                key={chat.chat_id}
                                onClick={() => handleSelectChat(chat)}
                            >
                                <div className="chat-item-title">{chat.chat_name}</div>
                            </div>
                        );
                    })
            )}

            {/* Create chat button (only for normal chats) */}
            <button className="add-chat" onClick={() => setShowModal(true)}>
                {loading ? "Creating…" : "+ New Chat"}
            </button>

            {/* ----- LESSON SECTION HEADER ----- */}
            <h3 className="lesson-section-title">Lesson Section</h3>

            {/* Lesson items ALWAYS shown in order */}
            {lessonChats.length === 0 ? (
                <div className="chat-empty">No Lessons</div>
            ) : (
                lessonChats
                    .sort((a, b) => a.lesson_id - b.lesson_id)
                    .map((lesson) => {
                        const isSelected = selectedChat === lesson.chat_id;
                        return (
                            <div
                                className={`chat-item lesson-item${isSelected ? " selected" : ""}`}
                                key={lesson.chat_id}
                                onClick={() => handleSelectChat(lesson)}
                            >
                                <div className="chat-item-title">{lesson.chat_name}</div>
                            </div>
                        );
                    })
            )}

            {/* Modal for creating custom chat */}
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
