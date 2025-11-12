import "./Learn.css"
import LearnTextBox from "../Components/LearnTextbox";
import TextDisplay from "../Components/TextDisplay";
import ChatList from "../Components/ChatList";
import { useState } from "react";
import axios from "axios";

// Temporary messages for testing
const test_messages = [];
const test_chats = [
    {
        id: "chat_001",
        name: "Personal Journal — Nov 11",
        lastEdited: "2025-11-11T09:12:00Z",
        snippet: "Woke up early and practiced Vietnamese. Worked on verb conjugations…",
    },
    {
        id: "chat_002",
        name: "Vietnamese Practice: Sentences",
        lastEdited: "2025-11-10T18:40:00Z",
        snippet: "Can you correct: Tôi đi học mỗi ngày?",
    },
];

const API_BASE = import.meta.env.VITE_API_URL;
const API_INVOKE_AGENT = `${API_BASE}/agent/invoke-agent`;



const Learn = () => {
    const [messages, setMessages] = useState(test_messages);
    const [loading, setLoading] = useState(false);

    const handleSend = async (text) => {
        if (text.trim() === "") return;
        const newMessages = [...messages, { role: "user", content: text }];
        setMessages(newMessages);
        setLoading(true);

        try {
            const res = await axios.post(API_INVOKE_AGENT, {
                input_string: text
            });
            // Filter out "\n", "AI:", and extra whitespace
            let reply = res.data.result
                .replace(/\\n/g, " ")         
                .replace(/\n/g, " ")          
                .replace(/AI:/g, "")          
                .replace(/\s+/g, " ")         
                .trim();
            setMessages([...newMessages, { role: "assistant", content: reply }]);
        } catch (err) {
            console.error("Error in handleSend:", err);
            setMessages([...newMessages, { role: "assistant", content: "Sorry, there was an error connecting to the server." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="learn-container">
            <div className="learn-content">
                <ChatList className="chat-list" chats={test_chats} />
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