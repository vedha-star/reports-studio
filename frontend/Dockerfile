FROM node:20-alpine

WORKDIR /app

# Install dependencies first for better caching
COPY package*.json ./
RUN npm install

# Pass environment variables for build time
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Copy the rest of the application
COPY . .

# Build the application
RUN npm run build

# Expose the frontend port
EXPOSE 3000

# Start the application
CMD ["npm", "run", "start"]
