

from llm_chat import chat_with_llm, clear_session_history


print(chat_with_llm("test_session", "What is 4+4?"))
print("---")

# The AI should return something like I don't know your name
print(chat_with_llm("test_session", "What is my name?"))
print("---")

# The AI should return something like Khai Nguyen
print(chat_with_llm("test_session", "Remember my name is Khai Nguyen"))
print(chat_with_llm("test_session", "What is my name?"))
print("---")

# The AI should return like I don't know this language
print(chat_with_llm("test_session", "What is Asu45m language?"))
print("---")

# The AI should return something like Asum language is a new language has 2 tones which influence meaning.
context_str = "Just know that Asu45m language is a new language has 2 tones which influence meaning."
print(chat_with_llm("test_session", f"Remember this context: {context_str}"))
print(chat_with_llm("test_session", "What is Asu45m language?"))
print("---")

clear_session_history("test_session")