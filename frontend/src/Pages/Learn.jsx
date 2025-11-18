import "./Learn.css"
import LearnTextBox from "../Components/LearnTextbox";
import TextDisplay from "../Components/TextDisplay";
import ChatList from "../Components/ChatList";
import { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL;
const API_INVOKE_AGENT = `${API_BASE}/agent/invoke-agent`;


const Learn = () => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedChat, setSelectedChat] = useState(null);
    const [chats, setChats] = useState([]);

    const cleanAgentText = (text) => {
        if (!text) return "";

        return text
            .replace(/\r\n/g, "\n")               // normalize CRLF → LF
            .replace(/\n{3,}/g, "\n\n")           // collapse 3+ newlines → 2
            .replace(/[ \t]+\n/g, "\n")           // trim trailing whitespace before newlines
            .replace(/\n[ \t]+/g, "\n")           // trim whitespace after newlines
            .replace(/\s+$/g, "")                 // trim ending whitespace
            .trim();
    };

    const handleSend = async (text) => {
        if (!text.trim() || !selectedChat || loading) return;

        setLoading(true);

        const userMessage = { role: "User", content: text };
        setMessages(prev => [...prev, userMessage]);

        try {
            const res = await axios.post(`${API_INVOKE_AGENT}`, {
                user_id: localStorage.getItem('cognitoSub') || 'test_user',
                chat_id: selectedChat,
                input_string: text
            });

            const rawReply = res.data?.result ?? "";
            const reply = cleanAgentText(rawReply);
            const agentMessage = { role: "Agent", content: reply };
            setMessages(prev => [...prev, agentMessage]);

        } catch (err) {
            console.error("Error invoking agent:", err);
            setMessages(prev => [...prev, {
                role: "Agent",
                content: "Sorry, something went wrong."
            }]);
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        if (!selectedChat) return;

        const fetchMessages = async () => {
            try {
                const res = await axios.get(
                    `${API_BASE}/users/chats/${selectedChat}/messages`,
                    { params: { last_index: 0 } }
                );

                const formatted = res.data.map(m => ({
                    role: m.role === "system" ? "Agent" : "User",
                    content: m.text
                }));
                setMessages(formatted);
            } catch (err) {
                console.error("Error fetching messages:", err);
                setMessages([]);
            }
        };

        fetchMessages();
    }, [selectedChat]);


    useEffect(() => {
        if (chats.length > 0 && !selectedChat) {
            setSelectedChat(chats[0].chat_id);
        }
    }, [chats, selectedChat]);

    return (
        <div className="learn-container">
            <div className="learn-content">
                <ChatList
                    className="chat-list"
                    chats={chats}
                    selectedChat={selectedChat}
                    setSelectedChat={setSelectedChat}
                    setChats={setChats}
                />
                <div className="conversation-container">
                    {selectedChat ? (
                        <>
                            <TextDisplay messages={messages} />
                            <LearnTextBox
                                onSend={handleSend}
                                loading={loading}
                            />
                        </>
                    ) : (
                        <div className="no-chat-selected-message">
                            <h2>Create or Select a chat to begin</h2>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
};

export default Learn;