from datetime import datetime
import os
from pymongo import MongoClient, ReturnDocument
import uuid


def save_chat_turn_sync(chat_id: str, text: str, role: str = "system"):
    mongo_client = MongoClient(os.environ.get("ATLAS_URI"))
    db = mongo_client["language_app"]
    collection = db["chat_sessions"]

    # Calculate next turn number
    doc = collection.find_one_and_update(
        {"chat_id": chat_id},
        {"$inc": {"next_turn": 1}},
        return_document=ReturnDocument.BEFORE,
    )

    if not doc:
        raise ValueError(f"Chat session {chat_id} not found")

    assigned_turn = doc.get("next_turn", 0)

    message = {
        "message_id": str(uuid.uuid4()),
        "turn": assigned_turn,
        "role": role,
        "text": text,
        "timestamp": datetime.utcnow(),
    }

    collection.find_one_and_update(
        {"chat_id": chat_id},
        {
            "$push": {"messages": message},
            "$set": {
                "last_message_at": datetime.utcnow(),
                "last_seen_at": datetime.utcnow(),
            },
        },
        return_document=ReturnDocument.AFTER,
    )

    print(f"[DB] Inserted turn={assigned_turn} into chat={chat_id}")
    return assigned_turn

def fetch_short_term_memories(chat_id: str, limit: int = 10):
    mongo_client = MongoClient(os.environ.get("ATLAS_URI"))
    db = mongo_client["language_app"]
    collection = db["chat_sessions"]

    chat_doc = collection.find_one({"chat_id": chat_id})

    if not chat_doc:
        print(f"[STM] Chat session not found for chat_id={chat_id}")
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


def load_user_preferences(user_id: str) -> str:
    try:
        mongo_client = MongoClient(os.environ.get("ATLAS_URI"))
        db = mongo_client["language_app"]

        doc = db.user_profiles.find_one(
            {"user_id": user_id}, {"_id": 0, "preferences": 1}
        )

        if not doc:
            print(f"[PREF] No profile found for user {user_id}")
            return "None provided"

        prefs = doc.get("preferences", [])
        if not isinstance(prefs, list):
            print(f"[PREF] Invalid preferences format for user {user_id}: {prefs}")
            return "None provided"

        normalized = []
        for p in prefs:
            if isinstance(p, str):
                normalized.append(p.lower())

        print(f"[PREF] Loaded preferences for user {user_id}: {normalized}")

        # Return as a stable string
        return ", ".join(normalized) if normalized else ""

    except Exception as e:
        print(f"[PREF] Error loading preferences for user {user_id}: {e}")
        return ""

    except Exception as e:
        print(f"[PREF] Error loading preferences for user {user_id}: {e}")
        return []
    
    
def normalize_llm_response(resp_content):
    """
    Converts LangChain 1.x content blocks into a clean string.
    Handles:
    - reasoning blocks (ignored)
    - text blocks (returned)
    - lists of blocks
    - dict content blocks
    - plain strings
    """

    # Case 1: Already a raw string
    if isinstance(resp_content, str):
        return resp_content

    # Case 2: List of content blocks
    if isinstance(resp_content, list):
        parts = []
        for block in resp_content:
            if not isinstance(block, dict):
                continue

            block_type = block.get("type")

            # Ignore chain-of-thought blocks
            if block_type == "reasoning":
                continue

            # Extract user-visible text blocks
            if block_type == "text":
                parts.append(block.get("text", ""))

        return "\n".join(parts).strip()

    # Case 3: Single dict content block
    if isinstance(resp_content, dict):
        if resp_content.get("type") == "text":
            return resp_content.get("text", "")
        return str(resp_content)

    # Fallback
    return str(resp_content)
