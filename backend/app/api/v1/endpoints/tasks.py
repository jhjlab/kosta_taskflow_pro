from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.api.deps import CurrentUser, DB
from app.models.task import Task
from app.schemas.task import TaskCreate, TaskListItem, TaskRead, TaskUpdate

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("/", response_model=list[TaskListItem])
async def list_tasks(db: DB, current_user: CurrentUser):
    result = await db.execute(select(Task).where(Task.owner_id == current_user.id))
    return result.scalars().all()


@router.post("/", response_model=TaskRead, status_code=status.HTTP_201_CREATED)
async def create_task(task_in: TaskCreate, db: DB, current_user: CurrentUser):
    task = Task(**task_in.model_dump(), owner_id=current_user.id)
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return task


@router.get("/{task_id}", response_model=TaskRead)
async def get_task(task_id: int, db: DB, current_user: CurrentUser):
    result = await db.execute(
        select(Task).where(Task.id == task_id, Task.owner_id == current_user.id)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.put("/{task_id}", response_model=TaskRead)
async def update_task(task_id: int, task_in: TaskUpdate, db: DB, current_user: CurrentUser):
    result = await db.execute(
        select(Task).where(Task.id == task_id, Task.owner_id == current_user.id)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    for field, value in task_in.model_dump(exclude_unset=True).items():
        setattr(task, field, value)

    await db.commit()
    await db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(task_id: int, db: DB, current_user: CurrentUser):
    result = await db.execute(
        select(Task).where(Task.id == task_id, Task.owner_id == current_user.id)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    await db.delete(task)
    await db.commit()
