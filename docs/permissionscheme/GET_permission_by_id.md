# GET /api/2/permissionscheme/{schemeId}/permission/{permissionId}

## Get a permission grant by ID

Возвращает разрешение, идентифицированное по указанному ID.

**Примечания:**
- Forge и OAuth2 приложения не могут получить доступ к этому REST ресурсу

---

## Пример запроса

### Node.js

```javascript
// This code sample uses the 'node-fetch' library:
// https://www.npmjs.com/package/node-fetch
const fetch = require('node-fetch');

fetch('http://{baseurl}/rest/api/2/permissionscheme/{schemeId}/permission/{permissionId}', {
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

### schemeId
- **Тип:** integer
- **Обязательно:** Да
- **Описание:** ID схемы разрешений

### permissionId
- **Тип:** integer
- **Обязательно:** Да
- **Описание:** ID разрешения

---

## Query parameters

### expand
- **Тип:** string
- **Описание:** Параметр для расширения ответа

---

## Responses

### 200 OK - Permission grant

**Content-Type:** `application/json`

**Схема:** PermissionGrantBean

#### Пример ответа

```json
{
  "id": 10001,
  "permission": "ADMINISTER_PROJECTS",
  "holder": {
    "type": "group",
    "parameter": "jira-administrators"
  },
  "self": "http://example.com/rest/api/2/permissionscheme/10000/permission/10001"
}
```

### 401 Unauthorized - Returned if user is not logged in.

### 403 Forbidden - Returned if user is not allowed to view permission schemes.

### 404 Not Found

