FROM python:3.12-slim

WORKDIR /app

COPY pyproject.toml .python-version uv.lock .

RUN pip install --upgrade pip \
    && pip install uv \
    && uv sync --frozen

COPY . .

ENV PATH="/app/.venv/bin:$PATH"

EXPOSE 8000

RUN chmod +x /app/etc/entrypoint.sh

ENTRYPOINT ["/bin/sh", "/app/etc/entrypoint.sh"]
