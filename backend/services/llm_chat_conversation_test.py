

from llm_chat import chat_with_llm, clear_session_history

prompt = "Ask me three yes/no math questions one at a time " \
    "After that show me the score."
print(chat_with_llm("test_session", prompt))
print("---")
print(chat_with_llm("test_session", "yes"))
print("---")
print(chat_with_llm("test_session", "yes"))
print("---")
print(chat_with_llm("test_session", "no"))
print("---")
clear_session_history("test_session")