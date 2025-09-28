# pip install langgraph pydantic
from langgraph.graph import StateGraph, END
from models import UserProfile, TaskType, AnalysisResult, GrammarIssue, Explanation, PracticeItem, GRAMMAR_RULES, EXAMPLES
from pydantic import BaseModel
from typing import Dict, Any
import re
import datetime

# ----- LLM stub (replace with your client of choice) -----
def call_llm(system: str, user: str, tools: Dict[str, Any] | None = None) -> str:
    """
    LLM code here.
    """
    
    return "STUB"

# ----- State -----
class GState(BaseModel):
    profile: UserProfile
    user_text: str
    task: TaskType | None = None
    analysis: AnalysisResult | None = None
    explanation: Explanation | None = None
    practice: list[PracticeItem] = []
    messages: list[str] = []
    now: str = datetime.datetime.utcnow().isoformat()

# ----- Node: classify -----
def classify_node(state: GState) -> GState:
    txt = state.user_text.lower()
    if any(k in txt for k in ["why", "explain", "rule"]):
        state.task = "explain_error"
    elif any(k in txt for k in ["exercise", "practice", "quiz"]):
        state.task = "practice"
    elif len(state.user_text.split()) > 3 and any(c in state.user_text for c in ".?!"):
        state.task = "check_text"
    else:
        state.task = "free_feedback"
    return state

# ----- Helper: light heuristic analyzer  -----
def simple_analyzer(text: str) -> AnalysisResult:
    issues = []
    # toy heuristic: missing article before singular count noun (very rough)
    patterns = [(r"\bI have (cat|dog)\b", "articles", "Consider 'a' before singular count nouns.")]
    fixed = text
    for pat, label, reason in patterns:
        m = re.search(pat, text, flags=re.I)
        if m:
            issues.append(GrammarIssue(label=label, span=m.group(0), reason=reason, severity="med"))
            fixed = re.sub(pat, lambda mo: f"I have a {mo.group(1)}", fixed, flags=re.I)
    fluent = fixed  # in real agent, ask LLM for fluent rewrite
    if not issues:
        fluent = text
    return AnalysisResult(issues=issues, minimal_edit=fixed, fluent_rewrite=fluent)

# ----- Node: analyze -----
def analyze_node(state: GState) -> GState:
    result = simple_analyzer(state.user_text)
    state.analysis = result
    # user-facing message
    if result.issues:
        bullets = "\n".join([f"- {i.label}: {i.reason} ⇒ “{i.span}”" for i in result.issues])
        state.messages.append(f"**Found issues**:\n{bullets}")
        state.messages.append(f"**Minimal edit**:\n{result.minimal_edit}")
        state.messages.append(f"**Fluent rewrite**:\n{result.fluent_rewrite}")
    else:
        state.messages.append("Nice! I didn’t detect clear grammar issues. Want micro-practice on a tricky area?")
    return state

# ----- Node: explain -----
def explain_node(state: GState) -> GState:
    topic = (state.analysis.issues[0].label if state.analysis and state.analysis.issues
             else "articles")
    cefr = state.profile.cefr
    explanation = GRAMMAR_RULES.get(topic, {}).get(cefr) or GRAMMAR_RULES.get(topic, {}).get("B1", "")
    examples = EXAMPLES.get(topic, {}).get(cefr, [])[:2]
    state.explanation = Explanation(topic=topic, cefr=cefr, explanation=explanation, examples=examples)
    block = f"**{topic.title()} ({cefr})**\n{explanation}\n\nExamples:\n" + "\n".join([f"- {e}" for e in examples])
    state.messages.append(block)
    return state

# ----- Node: practice -----
def practice_node(state: GState) -> GState:
    topic = state.explanation.topic if state.explanation else (
        state.analysis.issues[0].label if state.analysis and state.analysis.issues else "articles"
    )
    items = []
    if topic == "articles":
        items = [
            PracticeItem(kind="fill_blank",
                         prompt="___ sun rises in ___ east.",
                         answer="The, the"),
            PracticeItem(kind="choose",
                         prompt="I bought ___ umbrella.", options=["a","an","the"], answer="an"),
        ]
    elif topic == "present perfect":
        items = [
            PracticeItem(kind="transform",
                         prompt="Rewrite with present perfect: I (live) here since 2018.",
                         answer="I have lived here since 2018."),
        ]
    state.practice = items
    # user-facing
    for i, q in enumerate(items, 1):
        if q.kind == "choose":
            opts = " / ".join(q.options or [])
            state.messages.append(f"{i}. {q.prompt} ({opts})")
        else:
            state.messages.append(f"{i}. {q.prompt}")
    state.messages.append("_Send your answers like: 1) The, the  2) an_")
    return state

# ----- Node: log learning -----
USER_DB: Dict[str, UserProfile] = {}

def log_node(state: GState) -> GState:
    prof = USER_DB.get(state.profile.user_id, state.profile)
    if state.analysis and state.analysis.issues:
        new = {i.label for i in state.analysis.issues}
        prof.known_issues = list(set(prof.known_issues) | new)
    USER_DB[state.profile.user_id] = prof
    return state

# ----- Build graph -----
graph = StateGraph(GState)
graph.add_node("classify", classify_node)
graph.add_node("analyze", analyze_node)
graph.add_node("explain", explain_node)
graph.add_node("practice", practice_node)
graph.add_node("log", log_node)

graph.set_entry_point("classify")

# Edges
def need_analysis(s: GState) -> bool: return s.task in ("check_text","free_feedback","explain_error")
def need_explain(s: GState) -> bool: return s.task in ("explain_error","check_text") and (s.analysis is None or True)
def need_practice(s: GState) -> bool: return s.task == "practice" or (s.analysis and s.analysis.issues)

graph.add_conditional_edges("classify", lambda s: "analyze" if need_analysis(s) else ("practice" if s.task=="practice" else "log"),
                            {"analyze":"analyze","practice":"practice","log":"log"})
graph.add_conditional_edges("analyze", lambda s: "explain" if need_explain(s) else ("practice" if need_practice(s) else "log"),
                            {"explain":"explain","practice":"practice","log":"log"})
graph.add_conditional_edges("explain", lambda s: "practice" if need_practice(s) else "log",
                            {"practice":"practice","log":"log"})
graph.add_edge("practice", "log")
graph.add_edge("log", END)

app = graph.compile()
