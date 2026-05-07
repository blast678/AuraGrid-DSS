FROM python:3.12-slim

# 1. Install build tools
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 2. Install Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 3. CRITICAL: Install the actual CmdStan engine inside Linux
# This is why we need that extra disk space.
RUN python -m cmdstanpy.install_cmdstan

# 4. Copy code
COPY models/ /app/models/
COPY app/ /app/app/

ENV PYTHONPATH=/app
EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]