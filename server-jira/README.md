# Server-Jira: Watcher & Assignee Automation

Standalone service for synchronizing Jira Watchers and Assignees with a PostgreSQL database and managing Jira groups.

## Features
- **Watcher Sync**: Automatically adds/removes users from `${PROJECT_KEY}group_watchers` based on a custom watchers field.
- **Assignee Sync**: Automatically adds/removes users from `${PROJECT_KEY}group_user` based on the issue assignee.
- **Database Tracking**: Uses Prisma to track multiple issues watched/assigned to prevent premature group removal.

## Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Variables**:
   Create a `.env` file in this directory or in the parent directory:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/jira_db"
   JIRA_HOST="https://your-domain.atlassian.net"
   JIRA_EMAIL="your-email@example.com"
   JIRA_API_TOKEN="your-api-token"
   SERVER_JIRA_PORT=3001
   
   # Security
   JIRA_WEBHOOK_SECRET="your-secret"
   GAS_SCRIPT_SECRET="your-other-secret"
   ADMIN_API_KEY="your-admin-key"
   
   # Custom Fields
   WATCHERS_FIELD_ID="customfield_10170"
   ```

3. **Prisma Client**:
   ```bash
   npx prisma generate
   ```

4. **Run**:
   ```bash
   # Development
   npm run dev
   
   # Production
   npm run build
   npm start
   ```

## API
- `GET /api/health`: Health check
- `POST /api/webhook`: Jira Issue Webhook (requires `token` query param or `x-api-key` header)
