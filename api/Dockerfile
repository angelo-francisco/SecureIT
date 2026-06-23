FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .

ENV PIP_TIMEOUT 3600

RUN pip install --upgrade pip && \
    pip install -r requirements.txt --timeout $PIP_TIMEOUT

COPY . .

EXPOSE 8000

CMD ["python3", "main.py"]