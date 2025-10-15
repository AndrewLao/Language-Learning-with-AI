from langchain_community.vectorstores import FAISS
import os
from langchain_openai import OpenAIEmbeddings
from langchain.prompts import PromptTemplate
from dotenv import load_dotenv
load_dotenv()
embeddings = OpenAIEmbeddings(model='text-embedding-ada-002', openai_api_key=os.environ.get("OPENAI_API_KEY"))
vector_db = FAISS.load_local("vietnamese_store", embeddings, allow_dangerous_deserialization=True)
retriever = vector_db.as_retriever(search_type = 'mmr', 
                                      search_kwargs = {'k': 1, 'fetch_k': 20, 'lambda_mult': 1})

from langchain_openai import OpenAI
llm = OpenAI(
    api_key=os.environ.get("OPENAI_API_KEY")
    )

def format_docs(docs):
    return '\n\n'.join([doc.page_content for doc in docs])

question = 'Explain verb modal in Vietnamese'

# Retrieve relevant documents using the retriever
retrieved_docs = retriever.invoke(question)
context_str = format_docs(retrieved_docs)

# print(context_str)
print("---")

# Define your prompt template that takes context and question
template_str = (
    "Return the following context exactly as given, without omission or summarization:"
    "Context: {context}"
    "The question is: {question}"

    "Your answer should include the entire context text above."

)

prompt_template = PromptTemplate(
    input_variables=["context", "question"],
    template=template_str
)

# Format the prompt by filling context and question strings
filled_prompt = prompt_template.format(context=context_str, question=question)

# Pass formatted prompt string directly to LLM invoke (as it expects a plain string)
response = llm.invoke(filled_prompt)

print(response)
