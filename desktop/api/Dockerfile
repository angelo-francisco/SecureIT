FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --upgrade pip

RUN pip install -r pylock.toml --timeout 3600

COPY . .

EXPOSE 8000

RUN chmod +x /app/etc/entrypoint.sh

ENTRYPOINT ["/bin/sh", "/app/etc/entrypoint.sh"]
