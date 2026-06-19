# BRUTAL FIX: Use the full Python 3.9 image. 
# It contains the pre-compiled C-libraries needed for ML.
FROM python:3.9
WORKDIR /app

RUN apt-get update && apt-get install -y \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Because we are on the full image, this will download pre-built wheels in seconds
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]