from langchain_openai import OpenAIEmbeddings
from dotenv import load_dotenv
from langchain_community.document_loaders import PyMuPDFLoader
from langchain_openai import OpenAIEmbeddings

import faiss
from langchain_community.vectorstores import FAISS 
import os 
load_dotenv()
embeddings = OpenAIEmbeddings(model='text-embedding-ada-002', openai_api_key=os.environ.get("OPENAI_API_KEY"))

import os

pdfs = []
for root, dirs, files in os.walk("Lesson plans"):
    # print(root, dirs, files)
    for file in files:
        if file.endswith(".pdf"):
            pdfs.append(os.path.join(root, file))

print(pdfs)

docs = []
for pdf in pdfs:
    loader = PyMuPDFLoader(pdf)
    temp = loader.load()
    docs.extend(temp)
print(f"Loaded {len(docs)} documents")

# Document chunking
from langchain_text_splitters import  RecursiveCharacterTextSplitter

text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
chunks = text_splitter.split_documents(docs)

import tiktoken

encoding = tiktoken.encoding_for_model("gpt-4o-mini")
print(len(encoding.encode(chunks[0].page_content)), len(encoding.encode(chunks[1].page_content)), len(encoding.encode(docs[1].page_content)))

# Document vector embedding
embeddings = OpenAIEmbeddings(model='text-embedding-ada-002', openai_api_key=os.environ.get("OPENAI_API_KEY"))
# Use the first chunk's embedding dimension to create FAISS index
embedding_dimension = len(embeddings.embed_query(chunks[0].page_content))
# Create a FAISS index with correct dimension
index = faiss.IndexFlatL2(embedding_dimension)
# Building the vector store directly from document chunks (embeddings done internally)
vector_store = FAISS.from_documents(chunks, embeddings)
vector_store.save_local("vietnamese_store")

def get_vector_store():
    return FAISS.load_local("vietnamese_store", embeddings, allow_dangerous_deserialization=True)