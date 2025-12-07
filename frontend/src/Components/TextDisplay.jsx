import "./TextDisplay.css";
import { useEffect, useRef, useLayoutEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

const TextDisplay = ({ messages, onScrollTop, loadingOlder, fullyLoaded, assistantName = "Agent", resetScrollToken }) => {
    const wrapperRef = useRef(null);
    const bottomRef = useRef(null);

    // For scroll persistence 
    const prevHeightRef = useRef(0);
    const prevScrollTopRef = useRef(0);
    const loadingOlderRef = useRef(false);
    const initialLoadRef = useRef(true);
    const autoScrollingRef = useRef(false); // for scrolling down smoothly on first load


    const handleScroll = () => {
        const div = wrapperRef.current;
        if (!div) return;
        if (autoScrollingRef.current) return;
        prevScrollTopRef.current = div.scrollTop;

        if (div.scrollTop < 50) {
            if (fullyLoaded) return;
            if (loadingOlderRef.current) return;
            console.log("[Scroll] Near top → Load older messages");
            loadingOlderRef.current = true;
            onScrollTop && onScrollTop();
        }
    };

    useLayoutEffect(() => {
        const div = wrapperRef.current;
        if (!div) return;

        if (!loadingOlderRef.current || initialLoadRef.current) return;

        const heightDiff = div.scrollHeight - prevHeightRef.current;
        div.scrollTop = prevScrollTopRef.current + heightDiff;

        loadingOlderRef.current = false;
    });

    useEffect(() => {
        const div = wrapperRef.current;
        if (!div) return;

        if (initialLoadRef.current && messages.length > 0) {
            autoScrollingRef.current = true;
            requestAnimationFrame(() => {
                bottomRef.current?.scrollIntoView({ behavior: "smooth" });
                // stop blocking lazy load once smooth scroll finishes
                setTimeout(() => {
                    autoScrollingRef.current = false;
                }, 300); // match animation duration
            });
            console.log("Scrolling to bottom on first load");
            initialLoadRef.current = false;
            return;
        }

        const nearBottom =
            div.scrollTop > div.scrollHeight - div.clientHeight - 100;

        if (nearBottom) {
            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    useEffect(() => {
        initialLoadRef.current = true;
        loadingOlderRef.current = false;
        prevHeightRef.current = 0;
        prevScrollTopRef.current = 0;

        requestAnimationFrame(() => {
            bottomRef.current?.scrollIntoView({ behavior: "auto" });
        });
    }, [resetScrollToken]);

    const getSpeakerName = (role) => {
        return role === "User" ? "You" : assistantName;
    };

    return (
        <div className="chat-wrapper" ref={wrapperRef} onScroll={handleScroll}>

            {loadingOlder && (
                <div className="chat-loading-older">
                    <span>Loading more messages...</span>
                </div>
            )}

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
