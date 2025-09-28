# core schemas
from pydantic import BaseModel , Field, EmailStr
import uuid
from datetime import datetime
from typing import List, Literal, Optional

TaskType = Literal["check_text", "explain_error", "practice", "free_feedback"]

class UserProfile(BaseModel):
    user_id: str
    cefr: Literal["A1","A2","B1","B2","C1","C2"]
    l1: Optional[str] = None
    known_issues: List[str] = []   # e.g., ["articles", "present perfect", "word order"]

class GrammarIssue(BaseModel):
    label: str           # "articles", "prepositions", ...
    span: Optional[str]  # text snippet
    reason: str          # short rationale
    severity: Literal["low","med","high"]

class AnalysisResult(BaseModel):
    issues: List[GrammarIssue]
    minimal_edit: str
    fluent_rewrite: str

class Explanation(BaseModel):
    topic: str           # "articles"
    cefr: str
    explanation: str     # short, level-appropriate
    examples: List[str]

class PracticeItem(BaseModel):
    kind: Literal["fill_blank","choose","transform"]
    prompt: str
    options: Optional[List[str]] = None
    answer: str

class AgentOutput(BaseModel):
    task: TaskType
    analysis: Optional[AnalysisResult] = None
    explanation: Optional[Explanation] = None
    practice: List[PracticeItem] = []
    messages: List[str] = []  # user-facing text blocks