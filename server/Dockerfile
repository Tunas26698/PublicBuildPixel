# Use Node.js base image
FROM node:18-slim

# Install Python and dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Set up Python virtual environment
ENV VIRTUAL_ENV=/opt/venv
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Install Python packages
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt --timeout 1000 && \
    pip install --no-cache-dir --no-deps "rembg[cli]"

# Install Node.js dependencies
COPY package*.json ./
RUN npm install

# Copy application code
COPY . .

# Copy Python scripts from parent root (if needed) or assuming they are moved to ./
# The current project structure has server/ and python scripts in root.
# We need to decide how to structure this.
# For simplicity, let's assume the user will deploy the 'server' folder, 
# BUT the python scripts are OUTSIDE.
# Wait, Render deploys a repo. Pointing to 'server' root.
# Accessing parent files is tricky in Docker context if build context is 'server'.
# Recommendation: Move critical python scripts INTO server/ directory or change build context.
# Let's assume user copies scripts to server/scripts/ for deployment.
# Or simpler: COPY EVERYTHING.

# Build Typescript
# RUN npx tsc # If needed, or use ts-node via start script

# Expose port
EXPOSE 3000

# Start server
CMD ["npm", "start"]
