# GET /rest/api/3/project/{projectKeyOrId}/securitylevel

## Get project issue security levels

Возвращает все уровни безопасности issue для проекта, к которым у пользователя есть доступ.

Эта операция может быть доступна анонимно.

**Permissions required:** Browse projects global permission для проекта, однако уровни безопасности issue возвращаются только для аутентифицированного пользователя с Set Issue Security global permission для проекта.

**Data Security Policy:** Exempt from app access rules

**Scopes:**
- OAuth 2.0 scopes required:
  - Classic RECOMMENDED: `read:jira-work`
  - Granular: `read:issue-security-level:jira`
- Connect app scope required: `READ`

---

## Пример запроса

### Node.js

```javascript
// This code sample uses the 'node-fetch' library:
// https://www.npmjs.com/package/node-fetch
const fetch = require('node-fetch');

fetch('https://your-domain.atlassian.net/rest/api/3/project/{projectKeyOrId}/securitylevel', {
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

**Схема:** ProjectIssueSecurityLevels

#### Пример ответа

```json
{
  "levels": [
    {
      "description": "Only the reporter and internal staff can see this issue.",
      "id": "100000",
      "name": "Reporter Only",
      "self": "https://your-domain.atlassian.net/rest/api/3/securitylevel/100000"
    },
    {
      "description": "Only internal staff can see this issue.",
      "id": "100001",
      "name": "Staff Only",
      "self": "https://your-domain.atlassian.net/rest/api/3/securitylevel/100001"
    }
  ]
}
```

### 404 Not Found


