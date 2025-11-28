from file_utils import clear_file, write_to_file
from llm_chat import chat_with_llm, chat_with_llm_and_context_mistral, clear_session_history

prompt = [
    "You are a Vietnamese named Nguyễn Long in a role playing session"\
    "You will be asked different questions and scenarios "\
    "You are older than the person talking "\
    "and answer in the most correct Vietnamese as possible" ,
    "Chú tên gì thế, thời tiết như thế nào",
    "Thời tiết cháu dạo này mưa quá, làm sao để bớt mưa nhỉ?",
    "Khi mưa to cháu hay bị ướt, chú có cách gì giúp cháu không?",
    "Cháu nghe nói phở rất ngon, chú có thích ăn phở không?",
    "Em thích ăn bánh mì, chú nghĩ nó có ngon hơn phở không?",
    "Ngoài món phở ra, chú còn thích món gì khác không?",
    "Tạm biệt chú nhé!"
    ]

output_file = "llm_conversation.txt"
clear_file(output_file)
write_to_file(output_file, "Testing Vietnamese Role Playing Conversation with GPT LLM\n\n")

for p in prompt:
    write_to_file(output_file, f"Input: {p}\n")
    answer = chat_with_llm("test_session", p)
    write_to_file(output_file, f"Output: {answer}\n")
    write_to_file(output_file, "---\n")

clear_session_history("test_session")

output_file = "llm_conversation.txt"

write_to_file(output_file, "Testing Vietnamese Role Playing Conversation with Mistral LLM\n\n")
context = "Answer the question in the most correct Vietnamese possible as if you are Nguyễn Long, "\
     " an older person giving advice to a younger person."
for p in prompt:
    write_to_file(output_file, f"Input: {p}\n")
    answer = chat_with_llm_and_context_mistral("test_session", p, context)
    write_to_file(output_file, f"Output: {answer}\n")
    write_to_file(output_file, "---\n")

clear_session_history("test_session")