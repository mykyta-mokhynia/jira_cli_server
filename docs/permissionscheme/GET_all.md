# GET /api/2/permissionscheme

## Get all permission schemes

Возвращает список всех схем разрешений. По умолчанию возвращаются только сокращенные beans. Если нужно включить разрешения всех схем, укажите параметр expand `permissions`. Разрешения также будут включены, если указан любой другой параметр expand.

**Примечания:**
- Forge и OAuth2 приложения не могут получить доступ к этому REST ресурсу

---

## Пример запроса

### Node.js

```javascript
// This code sample uses the 'node-fetch' library:
// https://www.npmjs.com/package/node-fetch
const fetch = require('node-fetch');

fetch('http://{baseurl}/rest/api/2/permissionscheme', {
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

## Query parameters

### expand
- **Тип:** string
- **Описание:** Параметр для расширения ответа (например, `permissions`)

---

## Responses

### 200 OK - List of all permission schemes

**Content-Type:** `application/json`

**Схема:** PermissionSchemesBean

#### Пример ответа (без expand)

```json
{
  "permissionSchemes": [
    {
      "id": 10000,
      "name": "Default Permission Scheme",
      "self": "http://example.com/rest/api/2/permissionscheme/10000"
    },
    {
      "id": 10001,
      "name": "Project Manager Scheme",
      "self": "http://example.com/rest/api/2/permissionscheme/10001"
    }
  ]
}
```

#### Пример ответа (с expand=permissions)

```json
{
  "permissionSchemes": [
    {
      "id": 10000,
      "name": "Default Permission Scheme",
      "description": "Default scheme for all projects",
      "self": "http://example.com/rest/api/2/permissionscheme/10000",
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
        }
      ]
    }
  ]
}
```

### 401 Unauthorized - Returned if user is not logged in.

### 403 Forbidden - Returned if user is not allowed to view permission schemes.

### 404 Not Found - Returned if the scheme doesn't exist. 

