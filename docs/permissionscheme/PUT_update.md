# PUT /api/2/permissionscheme/{schemeId}

## Update a permission scheme

Обновляет схему разрешений. Если список разрешений присутствует, он будет установлен в схеме разрешений, что означает, что он перезапишет любые разрешения, которые существовали в схеме разрешений. Отправка пустого списка удалит все разрешения из схемы разрешений. Чтобы обновить только название и описание, не отправляйте список разрешений вообще. Чтобы добавить или удалить одно разрешение вместо обновления всего списка сразу, используйте ресурс {schemeId}/permission/.

**Примечания:**
- Forge и OAuth2 приложения не могут получить доступ к этому REST ресурсу

---

## Пример запроса

### Node.js

```javascript
// This code sample uses the 'node-fetch' library:
// https://www.npmjs.com/package/node-fetch
const fetch = require('node-fetch');

fetch('http://{baseurl}/rest/api/2/permissionscheme/{schemeId}', {
  method: 'PUT',
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

## Request body

**Content-Type:** `application/json`

### Схема запроса

#### Пример: Обновление только названия и описания

```json
{
  "name": "Updated Permission Scheme",
  "description": "Updated description for the permission scheme"
}
```

#### Пример: Обновление с полным списком разрешений

```json
{
  "name": "Updated Permission Scheme",
  "description": "Updated description",
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
    }
  ]
}
```

#### Пример: Удаление всех разрешений (пустой массив)

```json
{
  "name": "Empty Permission Scheme",
  "description": "Scheme with no permissions",
  "permissions": []
}
```

### Поля

- `description` (string) - Описание схемы разрешений
- `expand` (string) - Параметр расширения
- `id` (integer) - ID схемы разрешений
- `name` (string) - Название схемы разрешений
- `permissions` (array<PermissionGrantBean>) - Массив разрешений (если указан, перезапишет все существующие разрешения)
- `self` (string) - Ссылка на ресурс

---

## Responses

### 200 OK - Returned if the scheme is updated successfully.

**Content-Type:** `application/json`

**Схема:** PermissionSchemeBean

#### Пример ответа

```json
{
  "id": 10000,
  "name": "Updated Permission Scheme",
  "description": "Updated description",
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

### 403 Forbidden - Returned if user is not allowed to update permission schemes.

### 404 Not Found

