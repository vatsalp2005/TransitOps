FROM node:20-slim

WORKDIR /app

# Install OpenSSL for Prisma Client
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Install dependencies first (leverages caching)
COPY package*.json ./
RUN npm install

# Copy application files
COPY . .

# Generate Prisma Client inside the container
RUN npx prisma generate

EXPOSE 5000

CMD ["npm", "run", "dev"]
