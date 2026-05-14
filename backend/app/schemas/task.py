from datetime import datetime

from pydantic import BaseModel, field_validator

from app.models.task import TaskStatus


class TaskCreate(BaseModel):
    title: str
    description: str | None = None
    status: TaskStatus = TaskStatus.TODO
    due_at: datetime | None = None

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("title은 비어 있을 수 없습니다")
        return v.strip()


class TaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: TaskStatus | None = None
    due_at: datetime | None = None

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v: str | None) -> str | None:
        if v is not None and not v.strip():
            raise ValueError("title은 비어 있을 수 없습니다")
        return v.strip() if v else v


class TaskListItem(BaseModel):
    """목록 응답 — description 제외"""
    id: int
    title: str
    status: TaskStatus
    due_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TaskRead(BaseModel):
    """단건 응답 — description 포함"""
    id: int
    title: str
    description: str | None
    status: TaskStatus
    due_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
