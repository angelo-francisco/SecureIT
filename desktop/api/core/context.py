import contextvars

current_profile_id: contextvars.ContextVar[str | None] = contextvars.ContextVar(
    "current_profile_id", default=None
)
