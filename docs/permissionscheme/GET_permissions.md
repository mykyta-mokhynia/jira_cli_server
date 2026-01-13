# GET /api/2/permissionscheme/{schemeId}/permission

## Get all permission grants of a scheme

Возвращает все разрешения указанной схемы разрешений.

**Примечания:**
- Forge и OAuth2 приложения не могут получить доступ к этому REST ресурсу

---

## Пример запроса

### Node.js

```javascript
// This code sample uses the 'node-fetch' library:
// https://www.npmjs.com/package/node-fetch
const fetch = require('node-fetch');

fetch('http://{baseurl}/rest/api/2/permissionscheme/{schemeId}/permission', {
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

---

## Query parameters

### expand
- **Тип:** string
- **Описание:** Параметр для расширения ответа

---

## Responses

### 200 OK - Permission grants

**Content-Type:** `application/json`

**Схема:** PermissionGrantsBean

#### Пример ответа

```json
{
  "permissions": [
    {
      "id": 10001,
      "permission": "ADMINISTER_PROJECTS",
      "holder": {
        "type": "group",
        "parameter": "jira-administrators"
      },
      "self": "http://example.com/rest/api/2/permissionscheme/10000/permission/10001"
    },
    {
      "id": 10002,
      "permission": "BROWSE_PROJECTS",
      "holder": {
        "type": "group",
        "parameter": "jira-users"
      },
      "self": "http://example.com/rest/api/2/permissionscheme/10000/permission/10002"
    },
    {
      "id": 10003,
      "permission": "CREATE_ISSUES",
      "holder": {
        "type": "projectRole",
        "parameter": "10002"
      },
      "self": "http://example.com/rest/api/2/permissionscheme/10000/permission/10003"
    },
    {
      "id": 10004,
      "permission": "EDIT_ISSUES",
      "holder": {
        "type": "user",
        "parameter": "5d10b2484c2015710a1a8b00"
      },
      "self": "http://example.com/rest/api/2/permissionscheme/10000/permission/10004"
    }
  ]
}
```

### 401 Unauthorized - Returned if user is not logged in.

### 403 Forbidden - Returned if user is not allowed to view permission schemes.

### 404 Not Found

