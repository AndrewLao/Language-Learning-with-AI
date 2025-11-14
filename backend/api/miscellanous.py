import uuid
import requests

from models.userschema import ChatSession, Message

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
        data =  r2.json()
        chat = ChatSession(**data)        # validate shape
        # success — do something with `chat`
        print(f"Saved turn {turn} to chat {chat_id}")
    except requests.exceptions.HTTPError as http_err:
        print("HTTP error:", http_err, r2.text)
    except requests.exceptions.RequestException as req_err:
        print("Network/timeout error:", req_err)
    except Exception as e:
        print("Response parsing/validation error:", e)
    return r2.json()