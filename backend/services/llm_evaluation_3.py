from file_utils import write_to_file, clear_file
from llm_chat import chat_with_llm_and_context, chat_with_llm_and_context_mistral, clear_session_history
from test_ant import call_claude

output_file = "llm_evaluation_results3.txt"
clear_file(output_file)
prompt = [
    "Choose the correct alphabet only (a, b, c or d) and doesn't output the correct sentence" \
    "In Vietnamese, which sentence best expresses ability? " \
    "a. Tôi nên ngủ, b. Tôi muốn ăn, c. tôi phải đi làm, d. tôi có thể bơi " ,
    "Which modal verb most naturally conveys obligation or necessity? " \
    "a. nên, b. phải, c. muốn, có thể" ,
    "Choose the best rewrite to politely suggest: You should see a doctor. " \
    "a. Bạn nên đi khám bác sĩ. b. Bạn phải đi khám bác sĩ. " ,
    "Which sentence uses the modal for permission correctly?" \
    "a. Em nên mượn sách không? b. Em có thể mượn sách không? " ,
    "Identify the most natural placement of a modal in Vietnamese word order" \
    "a. Subject + Modal + Verb + Object, b.Subject + Verb + Modal + Object, "
]

expected = [
    "d", "b", "a", "b", "a"
    ]

context = "You are a Vietnamese language expert. " \
    "Answer the prompt by saying the only correct choice, all in lower case"
score = 0
write_to_file(output_file, "Testing Vietnamese Language LLM Evaluation\n\n")
write_to_file(output_file, "Testing Primary LLM now...\n")
for p in prompt:
    answer = chat_with_llm_and_context("test_session", p, context)
    if answer == expected[prompt.index(p)]:
        score += 1
    write_to_file(output_file, f"Input: {p}\nOutput: {answer}\nExpected: {expected[prompt.index(p)]}\n score: {score} \n")
write_to_file(output_file, f"Current Score: {score}/{len(prompt)}\n---")

write_to_file(output_file, "Testing Mistral LLM now...\n")
score = 0
for p in prompt:
    answer = chat_with_llm_and_context_mistral("test_session", p, context)
    if answer == expected[prompt.index(p)]:
        score += 1
    write_to_file(output_file, f"Input: {p}\nOutput: {answer}\nExpected: {expected[prompt.index(p)]}\n score: {score} \n")
write_to_file(output_file, f"Current Score with Mistral LLM: {score}/{len(prompt)}\n---")
write_to_file(output_file, "Testing Claude LLM now...\n")
score = 0
for p in prompt:
    answer = call_claude(context, p)
    if answer == expected[prompt.index(p)]:
        score += 1
    write_to_file(output_file, f"Input: {p}\nOutput: {answer}\nExpected: {expected[prompt.index(p)]}\n score: {score} \n")
write_to_file(output_file, f"Current Score with Claude LLM: {score}/{len(prompt)}\n---")
clear_session_history("test_session")