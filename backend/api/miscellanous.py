from models.userschema import ChatSession, Message
import os
from pymongo import MongoClient
import requests
import uuid


def save_chat_turn_sync(chat_id: str, text: str, role: str = "system"):
    base = "http://localhost:8000"
    api_prefix = "/users"
    # get existing messages
    r = requests.get(f"{base}{api_prefix}/chats/{chat_id}/messages")
    if r.status_code == 200:
        msgs = r.json()
        turn = len(msgs)
    else:
        turn = 0

    msg = Message(message_id=str(uuid.uuid4()), turn=turn, role=role, text=text)
    # model_dump(mode="json") returns JSON-serializable python types
    payload = msg.model_dump(mode="json")
    r2 = requests.post(f"{base}{api_prefix}/chats/{chat_id}/turns", json=payload)
    print("save_chat_turn_sync response:", r2.status_code, r2.text)
    try:
        r2.raise_for_status()
        data = r2.json()
        chat = ChatSession(**data)  # validate shape
        # success — do something with `chat`
        print(f"Saved turn {turn} to chat {chat_id}")
        return data
    except requests.exceptions.HTTPError as http_err:
        print("HTTP error:", http_err, r2.text)
    except requests.exceptions.RequestException as req_err:
        print("Network/timeout error:", req_err)
    except Exception as e:
        print("Response parsing/validation error:", e)
    return None


def fetch_short_term_memories(chat_id: str, limit: int = 10):
    mongo_client = MongoClient(os.environ.get("ATLAS_URI"))
    db = mongo_client["language_app"]
    collection = db["chat_sessions"]

    chat_doc = collection.find_one({"chat_id": chat_id})

    if not chat_doc:
        print(f"[STM] Chat session not found for chat_id={chat_id}")
        # Debug sample
        sample = collection.find_one()
        print("[STM] Sample chat_sessions document:", sample)
        return []

    messages = chat_doc.get("messages", [])
    if not messages:
        print(f"[STM] Chat session {chat_id} has no messages array")
        return []

    messages = sorted(messages, key=lambda m: m.get("turn", 0))

    recent_msgs = messages[-limit:]

    formatted = [f"{m.get('role', 'system')}: {m.get('text', '')}" for m in recent_msgs]

    print(f"[STM] Returning {len(formatted)} short-term messages for chat_id={chat_id}")

    print("[STM] Short-term memory messages:")
    for f in formatted:
        print("   ", f)

    return formatted


def format_memory_context(memories: list) -> str:
    stm = []
    ltm = []

    for m in memories:
        mtype = m.get("memory_type")
        text = m.get("text", "")

        if mtype == "short_term":
            stm.append(text)

        elif mtype == "long_term":
            cat = m.get("category", "")
            ltm.append(f"[{cat}] {text}")

    lines = []

    if stm:
        lines.append("STM:")
        lines.extend(stm)
        lines.append("")

    if ltm:
        lines.append("LTM:")
        lines.extend(ltm)
        lines.append("")

    return "\n".join(lines).strip() if lines else ""