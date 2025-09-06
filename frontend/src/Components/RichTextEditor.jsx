import React, { useRef } from "react";
import "./RichTextEditor.css";

const RichTextEditor = () => {
    const editorRef = useRef(null);

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

    // Example: Font Color
    const handleFontColor = (color) => {
        document.execCommand("foreColor", false, color);
    };

    const handleFontSize = (size) => {
        document.execCommand("fontSize", false, size);
    }

    return (
        <div className="rte-container">
            <div className="rte-toolbar">
                <div className="rte-toolbar-group">
                    <select onChange={e => handleFont(e.target.value)}>
                        <option value="Arial">Arial</option>
                        <option value="Times New Roman">Times New Roman</option>
                        <option value="Georgia">Georgia</option>
                        <option value="Courier New">Courier New</option>
                    </select>
                    <select onChange={e => handleFontSize(e.target.value)}>
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
                    <button onClick={handleBold}><b>B</b></button>
                    <button onClick={handleItalic}><i>I</i></button>
                    <button onClick={handleUnderline}><u>U</u></button>
                    <button onClick={handleStrike}><s>S</s></button>
                </div>
                <div className="rte-toolbar-group">
                    <button onClick={() => handleHeading(1)}>H1</button>
                    <button onClick={() => handleHeading(2)}>H2</button>
                </div>
                <div className="rte-toolbar-group">
                    <button onClick={handleBulletList}>• List</button>
                    <button onClick={handleNumberList}>1. List</button>
                </div>
                <div className="rte-toolbar-group">
                    <button onClick={() => handleJustify("Left")}>Left</button>
                    <button onClick={() => handleJustify("Center")}>Center</button>
                    <button onClick={() => handleJustify("Right")}>Right</button>
                </div>
                <div className="rte-toolbar-group">
                    <button onClick={() => handleHighlight("yellow")}>Highlight</button>
                    <button onClick={() => handleFontColor("red")}>A</button>
                </div>
            </div>
            <div
                className="rte-editor"
                contentEditable
                ref={editorRef}
                suppressContentEditableWarning={true}
                spellCheck={true}
            ></div>
        </div>
    );
};

export default RichTextEditor;