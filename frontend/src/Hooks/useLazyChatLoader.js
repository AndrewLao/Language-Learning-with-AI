// src/hooks/useLazyChatLoader.js
import { useState, useRef, useCallback } from "react";
import axios from "axios";

export default function useLazyChatLoader({ apiBase, selectedChat }) {
    const [messages, setMessages] = useState([]);
    const [lastIndex, setLastIndex] = useState(0);
    const [fullyLoaded, setFullyLoaded] = useState(false);

    const loadingRef = useRef(false);

    const fetchMore = useCallback(async (replace = false) => {
        if (!selectedChat) return;
        if (loadingRef.current) return;
        if (!replace && fullyLoaded) return;

        loadingRef.current = true;

        const res = await axios.get(
            `${apiBase}/users/chats/${selectedChat}/messages`,
            { params: { last_index: replace ? 0 : lastIndex } }
        );

        const formatted = res.data.map(m => ({
            role: m.role === "system" ? "Agent" : "User",
            content: m.text,
        }));

        setMessages(prev => {
            if (replace) return formatted;

            const seen = new Set(prev.map(m => m.content));
            const filtered = formatted.filter(m => !seen.has(m.content));

            if (filtered.length === 0) setFullyLoaded(true);

            return [...filtered, ...prev];
        });

        setLastIndex(prev => prev + formatted.length);
        if (formatted.length < 25) setFullyLoaded(true);

        requestAnimationFrame(() => {
            loadingRef.current = false;
        });
    }, [apiBase, selectedChat, lastIndex, fullyLoaded]);

    return { messages, setMessages, fetchMore, fullyLoaded };
}
