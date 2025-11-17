import "./TextDisplay.css";
import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

const TextDisplay = ({ messages, assistantName = "Agent" }) => {
    const bottomRef = useRef(null);

    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);


    const getSpeakerName = (role) => {
        return role === "User" ? "You" : assistantName;
    };

    return (
        <div className="chat-wrapper">
            {messages.map((msg, index) => (
                <div
                    key={index}
                    className={`text-display-container ${msg.role}`}
                >
                    <span className="speaker-label">{getSpeakerName(msg.role)}</span>

                    <div className="markdown-body">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeHighlight]}
                        >
                            {msg.content}
                        </ReactMarkdown>
                    </div>
                </div>
            ))}
            <div ref={bottomRef} />
        </div>
    );
};

export default TextDisplay;
