# POST /api/2/permissionscheme

## Create a new permission scheme

Создать новую схему разрешений. Этот метод может создавать схемы с определенным набором разрешений или без них.

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
  method: 'POST',
  headers: {
    'Authorization': `Basic ${Buffer.from(
      'email@example.com:<api_token>'
    ).toString('base64')}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
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
- **Описание:** Параметр для расширения ответа

---

## Request body

**Content-Type:** `application/json`

### Схема запроса

#### Пример: Создание схемы без разрешений

```json
{
  "name": "Custom Permission Scheme",
  "description": "Custom permission scheme for project management"
}
```

#### Пример: Создание схемы с разрешениями

```json
{
  "name": "Project Manager Scheme",
  "description": "Permission scheme for project managers",
  "permissions": [
    {
      "permission": "ADMINISTER_PROJECTS",
      "holder": {
        "type": "group",
        "parameter": "jira-administrators"
      }
    },
    {
      "permission": "BROWSE_PROJECTS",
      "holder": {
        "type": "group",
        "parameter": "jira-users"
      }
    },
    {
      "permission": "CREATE_ISSUES",
      "holder": {
        "type": "projectRole",
        "parameter": "10002"
      }
    },
    {
      "permission": "EDIT_ISSUES",
      "holder": {
        "type": "projectRole",
        "parameter": "10001"
      }
    },
    {
      "permission": "DELETE_ISSUES",
      "holder": {
        "type": "group",
        "parameter": "project-admins"
      }
    }
  ]
}
```

### Поля

- `description` (string) - Описание схемы разрешений
- `expand` (string) - Параметр расширения
- `id` (integer) - ID схемы разрешений
- `name` (string) - Название схемы разрешений
- `permissions` (array<PermissionGrantBean>) - Массив разрешений
- `self` (string) - Ссылка на ресурс

---

## Responses

### 201 Created - Returned if the scheme is created successfully.

**Content-Type:** `application/json`

**Схема:** PermissionSchemeBean

#### Пример ответа

```json
{
  "id": 10000,
  "name": "Project Manager Scheme",
  "description": "Permission scheme for project managers",
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
```

### 401 Unauthorized - Returned if user is not logged in.

### 403 Forbidden - Returned if user is not allowed to create permission schemes.