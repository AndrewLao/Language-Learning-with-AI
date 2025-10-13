from fastapi import APIRouter

from models.userschema import SimpleMessageGet, SimpleMessageResponse
from services.ai_simple_chat import chat_with_llm_and_context
router = APIRouter()

@router.get("/ai-response", response_model=SimpleMessageResponse)
def check(payload: SimpleMessageGet):
    context_str = 'Just know that Asum language is a new language has 2 tones which influence meaning.'
    response = chat_with_llm_and_context("test_session", payload.input_string, context_str)
    return {"result": response}
    