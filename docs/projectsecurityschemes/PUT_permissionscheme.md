# PUT /rest/api/3/project/{projectKeyOrId}/permissionscheme

## Assign permission scheme

Назначает схему разрешений проекту. См. [Managing project permissions](https://support.atlassian.com/jira-service-management-cloud/docs/manage-project-permissions/) для получения дополнительной информации о схемах разрешений.

**Permissions required:** Administer Jira global permission

**Data Security Policy:** Exempt from app access rules

**Scopes:**
- OAuth 2.0 scopes required:
  - Classic RECOMMENDED: `manage:jira-project`
  - Granular: `read:application-role:jira`, `read:field:jira`, `read:group:jira`, `read:permission-scheme:jira`, `read:permission:jira`
- Connect app scope required: `PROJECT_ADMIN`

---

## Пример запроса

### Node.js

```javascript
// This code sample uses the 'node-fetch' library:
// https://www.npmjs.com/package/node-fetch
const fetch = require('node-fetch');

const bodyData = `{
  "id": 10000
}`;

fetch('https://your-domain.atlassian.net/rest/api/3/project/{projectKeyOrId}/permissionscheme', {
  method: 'PUT',
  headers: {
    'Authorization': `Basic ${Buffer.from(
      'email@example.com:<api_token>'
    ).toString('base64')}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  },
  body: bodyData
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

## Request body

**Content-Type:** `application/json`

### Схема запроса

```json
{
  "id": 10000
}
```

### Поля

- `id` (integer, обязательно) - ID схемы разрешений для назначения проекту

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


