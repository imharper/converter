FROM node:20-bullseye

RUN apt-get update && apt-get install -y python3-venv python3-pip

WORKDIR /app

COPY . .

RUN python3 -m venv /app/venv && \
    /app/venv/bin/pip install --upgrade pip && \
    /app/venv/bin/pip install -r requirements.txt

RUN npm install

WORKDIR /app/client
RUN npm install

WORKDIR /app

ENV PATH="/app/venv/bin:$PATH"

CMD ["npm", "run", "dev"]
