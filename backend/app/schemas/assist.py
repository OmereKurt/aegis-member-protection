from typing import Literal, Optional

from pydantic import BaseModel, Field


AssistType = Literal["case_summary", "operator_note", "playbook_explanation"]


class AssistRequest(BaseModel):
    case_id: int = Field(gt=0)
    recommended_step: Optional[str] = Field(default=None, max_length=160)


class AssistResponse(BaseModel):
    assist_type: AssistType
    draft: str
    disclaimer: str
    source_fields: list[str]
    provider: str
