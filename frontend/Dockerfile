FROM node:20-alpine

WORKDIR /app

# Install dependencies first
COPY package*.json ./
RUN npm install

# Copy application files
COPY . .

EXPOSE 5173

# Run Vite in host mode so it can be accessed from outside the container
CMD ["npm", "run", "dev", "--", "--host"]
