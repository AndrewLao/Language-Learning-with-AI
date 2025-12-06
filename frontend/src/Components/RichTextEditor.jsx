import React, { useRef } from "react";
import "./RichTextEditor.css";

const RichTextEditor = ({ onChange }) => {
    const editorRef = useRef(null);

    const emitChange = () => {
        if (!onChange || !editorRef.current) return;

        const html = editorRef.current.innerHTML;

        // Strip tags for "real text" detection
        const text = html.replace(/<[^>]+>/g, "").trim();

        onChange({
            html,
            text
        });
    };

    // Example: Bold
    const handleBold = () => {
        document.execCommand("bold");
    };

    // Example: Italic
    const handleItalic = () => {
        document.execCommand("italic");
    };

    // Example: Underline
    const handleUnderline = () => {
        document.execCommand("underline");
    };

    // Example: Strikethrough
    const handleStrike = () => {
        document.execCommand("strikeThrough");
    };

    // Example: Heading
    const handleHeading = (level) => {
        document.execCommand("formatBlock", false, `H${level}`);
    };

    // Example: Unordered List
    const handleBulletList = () => {
        document.execCommand("insertUnorderedList");
    };

    // Example: Ordered List
    const handleNumberList = () => {
        document.execCommand("insertOrderedList");
    };

    // Example: Justify
    const handleJustify = (type) => {
        document.execCommand(`justify${type}`);
    };

    // Example: Highlight (background color)
    const handleHighlight = (color) => {
        document.execCommand("hiliteColor", false, color);
    };

    // Example: Font Change
    const handleFont = (font) => {
        document.execCommand("fontName", false, font);
    };

    const handleFontSize = (size) => {
        document.execCommand("fontSize", false, size);
    }

    // Insert a tab (behave like a text editor) instead of moving focus
    const handleKeyDown = (e) => {
        if (e.key === "Tab") {
            e.preventDefault();
            const tab = "\t";
            // Best-effort: use execCommand where supported
            const usedExec = document.execCommand && document.execCommand("insertText", false, tab);
            if (!usedExec) {
                const sel = window.getSelection();
                if (!sel || !sel.rangeCount) return;
                const range = sel.getRangeAt(0);
                // remove any selected content
                range.deleteContents();
                const node = document.createTextNode(tab);
                range.insertNode(node);
                // Move caret after inserted node
                range.setStartAfter(node);
                range.collapse(true);
                sel.removeAllRanges();
                sel.addRange(range);
            }
            emitChange();

        }
    };

    return (
        <div className="rte-container">
            <div className="rte-toolbar">
                <div className="rte-toolbar-group">
                    <select
                        className="select-wrap"
                        title="Font"
                        aria-label="Font"
                        onChange={e => handleFont(e.target.value)}
                    >
                        <option value="Arial">Arial</option>
                        <option value="Times New Roman">Times New Roman</option>
                        <option value="Georgia">Georgia</option>
                        <option value="Courier New">Courier New</option>
                    </select>
                    <select
                        className="select-wrap"
                        title="Font Size"
                        aria-label="Font Size"
                        onChange={e => handleFontSize(e.target.value)}
                    >
                        <option value="1">8pt</option>
                        <option value="2">10pt</option>
                        <option value="3" selected>12pt</option>
                        <option value="4">14pt</option>
                        <option value="5">18pt</option>
                        <option value="6">24pt</option>
                        <option value="7">36pt</option>
                    </select>
                </div>
                <div className="rte-toolbar-group">
                    <button onClick={handleBold} title="Bold (Ctrl/Cmd + B)" aria-label="Bold"><b>B</b></button>
                    <button onClick={handleItalic} title="Italic (Ctrl/Cmd + I)" aria-label="Italic"><i>I</i></button>
                    <button onClick={handleUnderline} title="Underline (Ctrl/Cmd + U)" aria-label="Underline"><u>U</u></button>
                    <button onClick={handleStrike} title="Strikethrough" aria-label="Strikethrough"><s>S</s></button>
                </div>
                <div className="rte-toolbar-group">
                    <button onClick={() => handleHeading(1)} title="Heading 1" aria-label="Heading 1">H1</button>
                    <button onClick={() => handleHeading(2)} title="Heading 2" aria-label="Heading 2">H2</button>
                </div>
                <div className="rte-toolbar-group">
                    <button onClick={handleBulletList} title="Bulleted list" aria-label="Bulleted list">•••</button>
                    <button onClick={handleNumberList} title="Numbered list" aria-label="Numbered list">1.2.3.</button>
                </div>
                <div className="rte-toolbar-group">
                    <button onClick={() => handleJustify("Left")} title="Align left" aria-label="Align left">Left</button>
                    <button onClick={() => handleJustify("Center")} title="Align center" aria-label="Align center">Center</button>
                    <button onClick={() => handleJustify("Right")} title="Align right" aria-label="Align right">Right</button>
                </div>
                <div className="rte-toolbar-group">
                    <button onClick={() => handleHighlight("yellow")} title="Highlight" aria-label="Highlight">Highlight</button>
                </div>
            </div>
            <div
                className="rte-editor"
                contentEditable
                ref={editorRef}
                suppressContentEditableWarning={true}
                onKeyDown={handleKeyDown}
                onKeyUp={emitChange}
                onInput={emitChange}
                spellCheck={true}
            ></div>
        </div>
    );
};

export default RichTextEditor;