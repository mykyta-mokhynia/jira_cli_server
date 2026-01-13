# Jira Personal Automation

A clean, modular Google Apps Script project for automating Jira tasks via Webhooks.

## Structure
- `src/config.js`: Configuration and Auth.
- `src/jira-client.js`: API Interaction layer.
- `src/webhook-handler.js`: Main entry point for Webhooks (`doPost`).
- `src/features/`: Specific automation logic modules.

## Setup

1.  **Create a Google Apps Script Project**:
    - Go to [script.google.com](https://script.google.com/home).
    - Create a New Project.

2.  **Copy Files**:
    - Copy the contents of `src/*.js` and `src/features/*.js` into corresponding files in the online editor.
    - *Note: GAS uses a flat file structure, so you can name them `config.gs`, `jira-client.gs`, etc.*

3.  **Configure Properties**:
    - In Project Settings > Script Properties, add:
        - `JIRA_BASE_URL`: Your Jira URL (e.g., `https://your-domain.atlassian.net`)
        - `JIRA_AUTH`: `email:api_token` (Base64 encoding is handled in code)

4.  **Deploy**:
    - Deploy as **Web App**.
    - Access: **Anyone** (to allow Jira webhooks to reach it).

## Usage
- Point your Jira Automation Webhooks to the Web App URL.
- Payload format depends on the feature being used (see feature files).
