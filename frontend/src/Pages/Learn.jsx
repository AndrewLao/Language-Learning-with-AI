import "./Learn.css"
import LearnTextBox from "../Components/LearnTextbox";
import TextDisplay from "../Components/TextDisplay";
import AssistantList from "../Components/AssistantList";
import { useState } from "react";
import axios from "axios";

// Temporary messages for testing
const test_messages = [];

const API_URL = "http://127.0.0.1:8000/ai-response/";

const Learn = () => {
    const [messages, setMessages] = useState(test_messages);
    const [loading, setLoading] = useState(false);

    const handleSend = async (text) => {
        if (text.trim() === "") return;
        const newMessages = [...messages, { role: "user", content: text }];
        setMessages(newMessages);
        setLoading(true);

        try {
            const res = await axios.post(API_URL, {
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
                {/* right of textbox can be explanations */}
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