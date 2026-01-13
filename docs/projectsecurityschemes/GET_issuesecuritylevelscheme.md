# GET /rest/api/3/project/{projectKeyOrId}/issuesecuritylevelscheme

## Get project issue security scheme

Возвращает схему безопасности issue, связанную с проектом.

**Permissions required:** Administer Jira global permission или Administer Projects project permission.

**Data Security Policy:** Exempt from app access rules

**Scopes:**
- OAuth 2.0 scopes required:
  - Classic RECOMMENDED: `read:jira-work`
  - Granular: `read:issue-security-level:jira`, `read:issue-security-scheme:jira`
- Connect app scope required: `READ`

---

## Пример запроса

### Node.js

```javascript
// This code sample uses the 'node-fetch' library:
// https://www.npmjs.com/package/node-fetch
const fetch = require('node-fetch');

fetch('https://your-domain.atlassian.net/rest/api/3/project/{projectKeyOrId}/issuesecuritylevelscheme', {
  method: 'GET',
  headers: {
    'Authorization': `Basic ${Buffer.from(
      'email@example.com:<api_token>'
    ).toString('base64')}`,
    'Accept': 'application/json'
  }
})
  .then(response => {
    console.log(
      `Response: ${response.status} ${response.statusText}`
    );
    return response.text();
  })
  .then(text => console.log(text))
  .catch(err => console.error(err));
```

---

## Path parameters

### projectKeyOrId
- **Тип:** string
- **Обязательно:** Да
- **Описание:** Ключ или ID проекта

---

## Responses

### 200 OK - Returned if the request is successful.

**Content-Type:** `application/json`

**Схема:** SecurityScheme

#### Пример ответа

```json
{
  "defaultSecurityLevelId": 10021,
  "description": "Description for the default issue security scheme",
  "id": 10000,
  "levels": [
    {
      "description": "Only the reporter and internal staff can see this issue.",
      "id": "10021",
      "name": "Reporter Only",
      "self": "https://your-domain.atlassian.net/rest/api/3/securitylevel/10021"
    }
  ],
  "name": "Default Issue Security Scheme",
  "self": "https://your-domain.atlassian.net/rest/api/3/issuesecurityschemes/10000"
}
```

### 400 Bad Request

### 401 Unauthorized

### 403 Forbidden

### 404 Not Found


