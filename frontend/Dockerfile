FROM node:18-alpine

WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

# Next.js telemetry disable
ENV NEXT_TELEMETRY_DISABLED 1

# If we are using a standalone build, we would build here. 
# For development, we will just use the dev server.
EXPOSE 3000

CMD ["npm", "run", "dev"]
