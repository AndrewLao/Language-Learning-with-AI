import "./Learn.css"
import LearnTextBox from "../Components/LearnTextbox";
import TextDisplay from "../Components/TextDisplay";
import ChatList from "../Components/ChatList";
import { useState, useEffect, useRef } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL;
const API_INVOKE_AGENT = `${API_BASE}/agent/invoke-agent`;

const Learn = () => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedChat, setSelectedChat] = useState(null);
    const [chats, setChats] = useState([]);

    const [lastIndex, setLastIndex] = useState(0);
    const [fullyLoaded, setFullyLoaded] = useState(false);

    // For spinner
    const [loadingOlder, setLoadingOlder] = useState(false);

    // Concurrency lock
    const loadingOlderRef = useRef(false);

    const cleanAgentText = (text) => {
        if (!text) return "";
        return text
            .replace(/\r\n/g, "\n")
            .replace(/\r/g, "\n")
            .replace(/[\u2028\u2029]/g, "\n")
            .replace(/[ \t]+\n/g, "\n")
            .replace(/\n[ \t]+/g, "\n")
            .replace(/\n{3,}/g, "\n")
            .replace(/^\n+|\n+$/g, "")
            .trim();
    };

    // Lazy Load Fetch
    const fetchMessages = async (replace = false) => {
        if (!selectedChat) return;

        // Hard block duplicate calls
        if (loadingOlderRef.current) {
            console.log("[LazyLoad] BLOCKED: Already fetched");
            return;
        }

        // No reason to load more
        if (!replace && fullyLoaded) {
            console.log("[LazyLoad] BLOCKED: Fully loaded");
            return;
        }

        // Lock BEFORE async starts
        loadingOlderRef.current = true;
        setLoadingOlder(true);

        console.log(`[LazyLoad] Fetching older messages | replace=${replace} index=${lastIndex}`);

        const res = await axios.get(
            `${API_BASE}/users/chats/${selectedChat}/messages`,
            { params: { last_index: replace ? 0 : lastIndex } }
        );

        const formatted = res.data.map(m => ({
            role: m.role === "system" ? "Agent" : "User",
            content: m.text,
        }));

        // Deduplicate oldest overlapping messages
        setMessages(prev => {
            if (replace) return formatted;

            const seen = new Set(prev.map(m => m.content));
            const filtered = formatted.filter(m => !seen.has(m.content));

            if (filtered.length === 0) {
                console.log("[LazyLoad] No new messages — marking fully loaded");
                setFullyLoaded(true);
            }

            return [...filtered, ...prev];
        });

        // Pagination update
        setLastIndex(prev => prev + formatted.length);
        if (formatted.length < 25) setFullyLoaded(true);

        // UI unlock
        setLoadingOlder(false);

        // Unlock scroll after DOM adjusts (important)
        requestAnimationFrame(() => {
            loadingOlderRef.current = false;
        });
    };

    // Send message
    const handleSend = async (text) => {
        if (!text.trim() || !selectedChat || loading) return;
        const currentChatId = selectedChat;
        setLoading(true);

        const userMessage = { role: "User", content: text };
        setMessages(prev => [...prev, userMessage]);

        try {
            const res = await axios.post(`${API_INVOKE_AGENT}`, {
                user_id: localStorage.getItem('cognitoSub') || 'test_user',
                chat_id: currentChatId,
                input_string: text
            });

            const reply = cleanAgentText(res.data?.result ?? "");
            const agentMessage = { role: "Agent", content: reply };

            setMessages(prev => {
                if (selectedChat !== currentChatId) return prev;
                return [...prev, agentMessage];
            });

        } catch (err) {
            setMessages(prev => [...prev, {
                role: "Agent",
                content: "Sorry, something went wrong."
            }]);
            console.log(err);
        } finally {
            setLoading(false);
        }
    };

    // Load messages when chat changes
    useEffect(() => {
        if (!selectedChat) return;

        setMessages([]);
        setLastIndex(0);
        setFullyLoaded(false);

        // Reset locks
        loadingOlderRef.current = false;

        fetchMessages(true);
    }, [selectedChat]);

    // Auto-select first chat
    useEffect(() => {
        if (chats.length > 0 && !selectedChat) {
            setSelectedChat(chats[0].chat_id);
        }
    }, [chats, selectedChat]);

    return (
        <div className="learn-container">
            <div className="learn-content">
                <ChatList
                    chats={chats}
                    selectedChat={selectedChat}
                    setSelectedChat={setSelectedChat}
                    setChats={setChats}
                />

                <div className="conversation-container">
                    {selectedChat ? (
                        <>
                            <TextDisplay
                                key={selectedChat}
                                messages={messages}
                                loadingOlder={loadingOlder}
                                fullyLoaded={fullyLoaded}
                                onScrollTop={() => fetchMessages(false)}
                            />
                            <LearnTextBox onSend={handleSend} loading={loading} />
                        </>
                    ) : (
                        <div className="no-chat-selected-message">
                            <h2>Create or Select a chat to begin</h2>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Learn;
