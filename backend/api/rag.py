from fastapi import APIRouter

from models.userschema import SimpleMessageGet, SimpleMessageResponse
from services.ai_simple_chat import chat_with_llm
router = APIRouter()

@router.get("/ai-response", response_model=SimpleMessageResponse)
def check(payload: SimpleMessageGet):
    response = chat_with_llm("test_session", payload.input_string)
    return {"result": response}
    