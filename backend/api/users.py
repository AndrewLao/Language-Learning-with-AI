from fastapi import APIRouter, UploadFile, HTTPException, Depends, Request, Query
from fastapi.responses import FileResponse
from datetime import datetime, timedelta
from pymongo import ReturnDocument
from models.userschema import (
    UserProfile,
    UserProfileCreate,
    EditProfile,
    ChatSession,
    Message,
    QuizPost,
    QuizQuestionResult
)
from typing import List, Optional
from pathlib import Path
import tempfile
import os, uuid
from dotenv import load_dotenv
from langchain_community.document_loaders import PyMuPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings

from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams
from qdrant_client.http.models import PointStruct

router = APIRouter()


def get_db_fs(request: Request):
    return request.app.state.db, request.app.state.fs


"""
User Profile Management 
Endpoints: (1) create user profile (2) get user profile (3) edit user profile (4) get user score streak
"""


@router.get("/check")
def check(db_fs=Depends(get_db_fs)):
    db, _ = db_fs
    # Use the user_profiles collection for the health check document.
    coll = db.user_profiles

    # Ensure a test document with _id 0 exists (insert only if missing).

    # Return all documents from the collection with _id excluded in the projection
    docs = list(coll.find({}, {"_id": 0}))
    return {"status": "User API is up", "docs": docs}


# (1) Create User profile
@router.post("/profiles", response_model=UserProfile, status_code=201)
def create_user_profile(payload: UserProfileCreate, db_fs=Depends(get_db_fs)):
    db, _ = db_fs
    if db.user_profiles.find_one({"user_id": payload.user_id}):
        raise HTTPException(status_code=409, detail="User profile already exists")
    now = datetime.utcnow()
    profile = UserProfile(
        user_id=payload.user_id,
        username=payload.username,
        email=payload.email,
        last_seen=now,
        score_streak=1,
        lessons_completed=[],
    )
    db.user_profiles.insert_one(profile.model_dump())
    return profile


# (2) Get User profile
@router.get("/profiles/{user_id}", response_model=UserProfile)
def get_user_profile(user_id: str, db_fs=Depends(get_db_fs)):
    db, _ = db_fs
    profile = db.user_profiles.find_one({"user_id": user_id}, {"_id": 0})

    if not profile:
        raise HTTPException(status_code=404, detail="User profile not found")

    now = datetime.utcnow()
    last_seen = profile.get("last_seen")
    score_streak = profile.get("score_streak", 0)

    # --- Streak logic ---
    if last_seen:
        days_since_last = (now.date() - last_seen.date()).days

        if days_since_last == 0:
            # User already logged in today → no change
            pass
        elif days_since_last == 1:
            # Logged in consecutive day → increment streak
            score_streak += 1
        else:
            # Missed one or more days → reset streak
            score_streak = 0
    else:
        # First-time login → start streak
        score_streak = 1

    # --- Update DB with last_seen and new streak ---
    db.user_profiles.update_one(
        {"user_id": user_id}, {"$set": {"last_seen": now, "score_streak": score_streak}}
    )

    # Reflect updated values in returned profile
    profile["last_seen"] = now
    profile["score_streak"] = score_streak

    return UserProfile(**profile)


# (3) edit User profile
@router.patch("/profiles/{user_id}", response_model=UserProfile)
def edit_user_profile(user_id: str, updates: EditProfile, db_fs=Depends(get_db_fs)):
    db, _ = db_fs
    update_data = {
        k: v for k, v in updates.dict(exclude_unset=True).items() if v is not None
    }
    if not update_data:
        raise HTTPException(status_code=400, detail="No updates provided")
    updated_profile = db.user_profiles.find_one_and_update(
        {"user_id": user_id},
        {"$set": update_data},
        return_document=ReturnDocument.AFTER,
    )
    if not updated_profile:
        raise HTTPException(status_code=404, detail="User profile not found")
    updated_profile.pop("_id", None)
    return UserProfile(**updated_profile)


# (4) get User score streak
@router.get("/profiles/{user_id}/score-streak")
def get_score_streak(user_id: str, db_fs=Depends(get_db_fs)):
    db, _ = db_fs
    profile = db.user_profiles.find_one(
        {"user_id": user_id}, {"_id": 0, "score_streak": 1}
    )
    if not profile:
        raise HTTPException(status_code=404, detail="User profile not found")
    return {"user_id": user_id, "score_streak": profile.get("score_streak", 0)}


"""
# Chat Session Management
# Endpoints: (1) create new chat session (2) save a new turn in chat session (3) list all chat sessions for a user (4) retrieve a specific chat session
# """


# (1) create new chat session
@router.post("/chats", response_model=ChatSession, status_code=201)
def create_new_chat(
    user_id: str, chat_name: Optional[str] = None, db_fs=Depends(get_db_fs)
):
    db, _ = db_fs
    chat = ChatSession(user_id=user_id, chat_name=chat_name)
    db.chat_sessions.insert_one(chat.model_dump())
    return chat


# (2) Save a new turn in chat session
@router.post("/chats/{chat_id}/turns", response_model=ChatSession)
def add_turn(chat_id: str, message: Message, db_fs=Depends(get_db_fs)):
    db, _ = db_fs

    update = {
        "$push": {"messages": message.model_dump()},
        "$set": {
            "last_message_at": datetime.utcnow(),
            "last_seen_at": datetime.utcnow(),
        },
    }

    updated_chat = db.chat_sessions.find_one_and_update(
        {"chat_id": chat_id}, update, return_document=ReturnDocument.AFTER
    )

    if not updated_chat:
        raise HTTPException(status_code=404, detail="Chat session not found")

    updated_chat.pop("_id", None)
    return ChatSession(**updated_chat)


# (3) List all chat sessions for a user
@router.get("/chats/user/{user_id}", response_model=List[ChatSession])
def list_user_chats(user_id: str, db_fs=Depends(get_db_fs)):
    db, _ = db_fs

    # Only return metadata fields
    projection = {
        "_id": 0,
        "user_id": 1,
        "chat_id": 1,
        "chat_name": 1,
        "created_at": 1,
        "last_seen_at": 1,
        "last_message_at": 1,
        "status": 1,
        "pinned": 1,
        "unread_count": 1,
        "agent_context": 1,
    }

    chats = list(
        db.chat_sessions.find({"user_id": user_id}, projection).sort(
            "last_seen_at", -1
        )  # latest chats first
    )

    if not chats:
        raise HTTPException(
            status_code=404, detail="No chat sessions found for this user"
        )

    return chats


# (4) Retrieve a specific chat session
@router.get("/chats/{chat_id}/messages", response_model=List[Message])
def get_messages(
    chat_id: str,
    last_index: int = Query(0, ge=0, description="Index of last message received"),
    db_fs=Depends(get_db_fs),
):
    db, _ = db_fs

    # When using $slice on an array field, MongoDB does not allow projecting
    # the array subfields (e.g. "messages.message_id") at the same time
    # — doing so causes a "Path collision" error. Project the sliced
    # `messages` array and any top-level fields you need instead.
    slice_query = {
        "_id": 0,  # exclude _id
        # return a window of messages (last_index + 25) most recent messages
        "messages": {"$slice": [-(last_index + 25), 25]},
        # If you need top-level metadata, include them explicitly
        "chat_id": 1,
        "user_id": 1,
        "last_seen_at": 1,
        "last_message_at": 1,
    }

    chat = db.chat_sessions.find_one_and_update(
        {"chat_id": chat_id},
        {"$set": {"last_seen_at": datetime.utcnow()}},
        projection=slice_query,
        return_document=ReturnDocument.AFTER,
    )

    if not chat:
        raise HTTPException(status_code=404, detail="Chat session not found")

    return [Message(**msg) for msg in chat.get("messages", [])]


"""
User Document Management
# Endpoints: (1) upload user document (2) list all user documents (3) retrieve a specific document
"""


# User File Upload
@router.post("/upload/{user_id}")
async def upload_document(user_id: str, file: UploadFile, db_fs=Depends(get_db_fs)):
    # Save file into GridFS
    pdf_bytes = await file.read()

    # Save PDF to GridFS
    db, fs = db_fs
    file_id = fs.put(pdf_bytes, filename=file.filename)

    # Save metadata
    doc_id = str(uuid.uuid4())
    db.user_documents.insert_one(
        {
            "doc_id": doc_id,
            "user_id": user_id,
            "file_name": file.filename,
            "storage": "gridfs",
            "gridfs_id": file_id,
            "created_at": datetime.utcnow(),
            "processed": False,
        }
    )
    return {"doc_id": doc_id, "file_name": file.filename}


# List all User Documents
@router.get("/documents/{user_id}")
def list_documents(user_id: str, db_fs=Depends(get_db_fs)):
    db, fs = db_fs
    docs = list(
        db.user_documents.find(
            {"user_id": user_id},
            {"_id": 0, "doc_id": 1, "file_name": 1, "created_at": 1},
        )
    )
    return {"documents": docs}


# Retrive a specific document
@router.get("/documents/{user_id}/{doc_id}")
def download_document(user_id: str, doc_id: str, db_fs=Depends(get_db_fs)):
    db, fs = db_fs
    doc = db.user_documents.find_one({"user_id": user_id, "doc_id": doc_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    gridout = fs.get(doc["gridfs_id"])
    tmp_path = Path(tempfile.gettempdir()) / doc["file_name"]
    with open(tmp_path, "wb") as f:
        f.write(gridout.read())
    return FileResponse(tmp_path, filename=doc["file_name"])


# Delete a specific document
@router.delete("/documents/{user_id}/{doc_id}")
def delete_document(user_id: str, doc_id: str, db_fs=Depends(get_db_fs)):
    db, fs = db_fs
    doc = db.user_documents.find_one({"user_id": user_id, "doc_id": doc_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Delete from GridFS
    fs.delete(doc["gridfs_id"])

    # Delete metadata
    db.user_documents.delete_one({"doc_id": doc_id})

    return {"message": "Document deleted successfully", "doc_id": doc_id}


# Quiz stuff
@router.post("/quiz/submit", status_code=201)
def submit_quiz(payload: QuizPost, db_fs=Depends(get_db_fs)):
    db, _ = db_fs

    quiz_data = payload.model_dump()

    result = db.quiz_results.insert_one(quiz_data)

    if not result.inserted_id:
        raise HTTPException(status_code=500, detail="Failed to store quiz")

    return {
        "success": True,
        "quiz_id": payload.quiz_id,
        "message": "Quiz stored successfully"
    }

@router.get("/quiz/{user_id}", response_model=List[QuizPost])
def get_user_quizzes(user_id: str, db_fs=Depends(get_db_fs)):
    """
    Retrieve all quiz submissions for a specific user.
    Sorted newest → oldest.
    """
    db, _ = db_fs

    quizzes = list(
        db.quiz_results.find({"user_id": user_id}, {"_id": 0}).sort("timestamp", -1)
    )

    return quizzes
