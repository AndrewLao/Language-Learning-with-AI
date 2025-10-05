from langchain.vectorstores import FAISS
import os
from langchain_openai import OpenAIEmbeddings
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough 
from langchain_core.prompts import ChatPromptTemplate
from langchain import hub
from langchain.prompts import ChatPromptTemplate, HumanMessagePromptTemplate, PromptTemplate
from dotenv import load_dotenv
load_dotenv()
embeddings = OpenAIEmbeddings(model='text-embedding-ada-002', openai_api_key=os.environ.get("OPENAI_API_KEY"))
vector_db = FAISS.load_local("../storage/faiss_pronoun_store", embeddings, allow_dangerous_deserialization=True)
retriever = vector_db.as_retriever(search_type = 'mmr', 
                                      search_kwargs = {'k': 3, 'fetch_k': 20, 'lambda_mult': 1})
# Define the prompt template string with the specified sentence removed
template_str = (
    "You are an assistant for question-answering tasks. "
    "Use the following pieces of retrieved context to answer the question. "
    "If you don't know the answer, just say that you don't know.\n"
    "Question: {question} \n"
    "Context: {context} \n"
    "Answer:"
)

prompt = hub.pull("rlm/rag-prompt")
prompt

# Create the inner PromptTemplate
prompt_template = PromptTemplate(
    input_variables=["context", "question"],
    template=template_str
)

# Create the HumanMessagePromptTemplate wrapping the PromptTemplate
human_message_prompt = HumanMessagePromptTemplate(prompt=prompt_template)

# Create the final ChatPromptTemplate
chat_prompt = ChatPromptTemplate(
    input_variables=["context", "question"],
    messages=[human_message_prompt],
    metadata={
        "lc_hub_owner": "rlm",
        "lc_hub_repo": "rag-prompt",
        "lc_hub_commit_hash": "50442af133e61576e74536c6556cefe1fac147cad032f4377b60c436e6cdcb6e"
    }
)
from langchain_openai import OpenAI
llm = OpenAI(
    api_key=os.environ.get("OPENAI_API_KEY")
    )

def format_docs(docs):
    return '\n\n'.join([doc.page_content for doc in docs])

rag_chain = (
    {"context": retriever|format_docs, "question": RunnablePassthrough()}
    | prompt
    | llm
    | StrOutputParser()
)
question = "Give me only basic pronouns in Vietnamese , explain what are their purpose. Doesn't provide advanced pronouns"
response = rag_chain.invoke(question)

print(response)