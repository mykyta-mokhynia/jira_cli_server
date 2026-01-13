# GET /rest/api/3/project/{projectKeyOrId}/permissionscheme

## Get assigned permission scheme

Получает схему разрешений, связанную с проектом.

**Permissions required:** Administer Jira global permission или Administer projects project permission.

**Data Security Policy:** Exempt from app access rules

**Scopes:**
- OAuth 2.0 scopes required:
  - Classic RECOMMENDED: `read:jira-work`
  - Granular: `read:application-role:jira`, `read:field:jira`, `read:group:jira`, `read:permission-scheme:jira`, `read:permission:jira`
- Connect app scope required: `READ`

---

## Пример запроса

### Node.js

```javascript
// This code sample uses the 'node-fetch' library:
// https://www.npmjs.com/package/node-fetch
const fetch = require('node-fetch');

fetch('https://your-domain.atlassian.net/rest/api/3/project/{projectKeyOrId}/permissionscheme', {
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

## Query parameters

### expand
- **Тип:** string
- **Описание:** Параметр для расширения ответа

---

## Responses

### 200 OK - Returned if the request is successful.

**Content-Type:** `application/json`

**Схема:** PermissionScheme

#### Пример ответа

```json
{
  "description": "description",
  "id": 10000,
  "name": "Example permission scheme",
  "self": "https://your-domain.atlassian.net/rest/api/3/permissionscheme/10000"
}
```

### 401 Unauthorized

### 403 Forbidden

### 404 Not Found


