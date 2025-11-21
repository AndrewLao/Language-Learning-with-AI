from pydantic import BaseModel , Field, EmailStr
import uuid
from datetime import datetime
from typing import List, Literal, Optional

#Schema for simple chat message
class SimpleMessageGet(BaseModel):
    input_string: str

class SimpleMessageResponse(BaseModel):
    result: str

#Schema for User Documents
class UserDocument(BaseModel):
    doc_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    doc_name: str
    text: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_seen_at: Optional[datetime] = None

#Schema for User Profile
class UserProfile(BaseModel):
    user_id: str
    username: str
    email: EmailStr
    last_seen: Optional[datetime] = None
    score_streak: int = 0
    lessons_completed: List[int] = Field(default_factory=list)
    preferences: "UserPreferences" = Field(default_factory=lambda: UserPreferences())
    documents: List[UserDocument] = Field(default_factory=list)    

#Schema for Creating User Profile
class UserProfileCreate(BaseModel):
    user_id: str
    username: str
    email: EmailStr
    last_seen: Optional[datetime] = None
    score_streak: int = 0
    lessons_completed: List[int] = Field(default_factory=list)
    preferences: "UserPreferences" = Field(default_factory=lambda: UserPreferences())
    lessons_completed: List[int] = Field(default_factory=list)

#Schema for Edit Profile
class EditProfile(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    lessons_completed: Optional[List[int]] = None
    preferences: Optional["UserPreferences"] = None
    lessons_completed: Optional[List[int]] = None

#Schema for Messages
class Message(BaseModel):
    message_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    turn: int
    role: Literal["user", "system"]
    text: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

#Schema for Agent Context
class AgentContext(BaseModel):
    orchestrator_version: Optional[str] = None
    agents_used: Optional[List[str]] = None

#Schema for Chat Session
class ChatSession(BaseModel):
    chat_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    chat_name: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_seen_at: datetime = Field(default_factory=datetime.utcnow)
    last_message_at: datetime = Field(default_factory=datetime.utcnow)

    messages: List[Message] = Field(default_factory=list)

    status: Literal["active", "archived", "deleted"] = "active"
    pinned: bool = False
    agent_context: Optional[AgentContext] = None

# Separate model for user preference categories
class UserPreferences(BaseModel):
    movies: bool = False
    games: bool = False
    anime: bool = False
    travel: bool = False
    technology: bool = False
    outdoors: bool = False
    podcasts: bool = False
    books: bool = False
    music: bool = False
    fitness: bool = False
    cooking: bool = False
    art: bool = False
    pets: bool = False
    photography: bool = False

# Schema for User WriteUps
class WriteUp(BaseModel):
    writeup_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class WriteUpCreate(BaseModel):
    user_id: str
    title: str
    content: str