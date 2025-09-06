import "./TextDisplay.css";
import { useEffect, useRef } from "react";


const TextDisplay = ({ messages, assistantName = "Assistant" }) => {
    const bottomRef = useRef(null);

    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);


    const getSpeakerName = (role) => {
        return role === "user" ? "You" : assistantName;
    };

    return (
        <div className="chat-wrapper">
            {messages.map((msg, index) => (
                <div
                    key={index}
                    className={`text-display-container ${msg.role === 'user' ? 'user' : 'assistant'}`}
                >
                    <span className="speaker-label">{getSpeakerName(msg.role)}</span>
                    <p>{msg.content}</p>
                </div>
            ))}
            <div ref={bottomRef} />
        </div>
    );
};

export default TextDisplay;
