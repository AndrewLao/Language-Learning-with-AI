from llm_chat import chat_with_llm_and_context, chat_with_llm_and_context_mistral, clear_session_history
from test_ant import call_claude

prompt = [
    "Choose the correct alphabet only (a, b, c or d) Từ hòa bình có nghĩa là gì?"\
    "a) Chiến tranh" \
    "b) Tình bạn" \
    "c) Không có chiến tranh, sống yên ổn" \
    "d) Học tập"    ,
    "Điền từ thích hợp vào chỗ trống: Con mèo ______ trên mái nhà." \
    "ngủ, bơi"  ,
    "Từ nào trái nghĩa với hạnh phúc? bất hạnh, to lớn, nhanh, đẹp",
    "Từ đồng nghĩa với to lớn? nhỏ, khổng lồ, ngắn, nhẹ",
    "Lan đi bộ đến trường, đi bộ là loại từ nào?"
]

expected = [
    "c",
    "ngủ",
    "bất hạnh",
    "khổng lồ",
    "động từ"
    ]

context = "You are a Vietnamese language expert. " \
    "Answer the prompt by saying the only correct choice, all in lower case"
score = 0
for p in prompt:
    answer = chat_with_llm_and_context("test_session", p, context)
    if answer == expected[prompt.index(p)]:
        score += 1
    print(f"Input: {p}\nOutput: {answer}\nExpected: {expected[prompt.index(p)]}\n score: {score}")
print(f"Current Score: {score}/{len(prompt)}\n---")

print("Testing Mistral LLM now...\n")
score = 0
for p in prompt:
    answer = chat_with_llm_and_context_mistral("test_session", p, context)
    if answer == expected[prompt.index(p)]:
        score += 1
    print(f"Input: {p}\nOutput: {answer}\nExpected: {expected[prompt.index(p)]}\n score: {score}")
print(f"Current Score with Mistral LLM: {score}/{len(prompt)}\n---")
print("Testing Claude LLM now...\n")
score = 0
for p in prompt:
    answer = call_claude(context, p)
    if answer == expected[prompt.index(p)]:
        score += 1
    print(f"Input: {p}\nOutput: {answer}\nExpected: {expected[prompt.index(p)]}\n score: {score}")
print(f"Current Score with Claude LLM: {score}/{len(prompt)}\n---")
clear_session_history("test_session")