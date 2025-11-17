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

    const handleSend = async (text) => {
        if (!text.trim() || !selectedChat || loading) return;

        setLoading(true);

        // Immediately show the user message (local UI)
        const userMessage = { role: "User", content: text };
        setMessages(prev => [...prev, userMessage]);

        try {
            const res = await axios.post(`${API_INVOKE_AGENT}`, {
                user_id: localStorage.getItem("userId") || "test_user",
                chat_id: selectedChat,
                input_string: text
            });

            const reply = res.data?.result ?? "";

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
                    <TextDisplay
                        messages={messages}
                    />
                    <LearnTextBox onSend={handleSend} loading={loading} />
                </div>
            </div>
        </div>
    )
};

export default Learn;