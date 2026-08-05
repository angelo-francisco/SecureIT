from contextvars import ContextVar

current_profile_id: ContextVar[str | None] = ContextVar(
    "current_profile_id", default=None
)

