from test_ant import call_claude
from llm_chat import chat_with_llm_and_context, chat_with_llm_and_context_mistral, clear_session_history

prompt = [
    "Tôi rất yêu quê hương của mình.",
    "Hôm qua tôi đi chợ.",
    "Tôi sống ở trên Hà Nội.",
    "Hãy sửa câu sau thành phủ định: Tôi biết câu trả lời.",
    "Anh ấy là đẹp trai lắm",
    "Tôi đi học trễ vì trời mưa to to",
    "Chúng tôi sẽ đi du lịch vào cuối tuần này nếu thời tiết tốt"
    ]

expected = [
    "Tôi rất yêu quê hương của mình.",
    "Hôm qua tôi đi chợ.",
    "Tôi sống ở Hà Nội.",
    "Tôi không biết câu trả lời.",
    "Anh ấy rất đẹp trai.",
    "Tôi đi học trễ vì trời mưa to.",
    "Chúng tôi sẽ đi du lịch vào cuối tuần này nếu thời tiết tốt."
    ]

context = "You are a Vietnamese language expert. " \
    "Given the Vietnamese sentences, correct any grammatical errors including tense and prepositions." \
    "Only provide the corrected sentence without any additional explanation." \
    "If the sentence is already correct, just repeat it."
score = 0
for p in prompt:
    answer = chat_with_llm_and_context("test_session", p, context)
    if answer == expected[prompt.index(p)]:
        score += 1
    print(f"Input: {p}\nOutput: {answer}\nExpected: {expected[prompt.index(p)]}\n")
print(f"Current Score: {score}/{len(prompt)}\n---")

print("Testing Mistral LLM now...\n")
score = 0
for p in prompt:
    answer = chat_with_llm_and_context_mistral("test_session", p, context)
    if answer == expected[prompt.index(p)]:
        score += 1
    print(f"Input: {p}\nOutput: {answer}\nExpected: {expected[prompt.index(p)]}\n")
print(f"Current Score with Mistral LLM: {score}/{len(prompt)}\n---")

print("Testing Claude LLM now...\n")
score = 0
for p in prompt:
    answer = call_claude(context, p)
    if answer == expected[prompt.index(p)]:
        score += 1
    print(f"Input: {p}\nOutput: {answer}\nExpected: {expected[prompt.index(p)]}\n")
print(f"Current Score with Claude LLM: {score}/{len(prompt)}\n---")
clear_session_history("test_session")