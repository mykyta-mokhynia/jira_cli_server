# POST /api/2/permissionscheme/{schemeId}/permission

## Create a permission grant in a scheme

Создает разрешение в схеме разрешений.

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

#### Пример: Разрешение для группы

```json
{
  "permission": "ADMINISTER_PROJECTS",
  "holder": {
    "type": "group",
    "parameter": "jira-administrators"
  }
}
```

#### Пример: Разрешение для пользователя

```json
{
  "permission": "BROWSE_PROJECTS",
  "holder": {
    "type": "user",
    "parameter": "5d10b2484c2015710a1a8b00"
  }
}
```

#### Пример: Разрешение для роли проекта

```json
{
  "permission": "CREATE_ISSUES",
  "holder": {
    "type": "projectRole",
    "parameter": "10002"
  }
}
```

### Поля

- `holder` (PermissionHolderBean) - Держатель разрешения
- `id` (integer) - ID разрешения
- `permission` (string) - Тип разрешения
- `self` (string) - Ссылка на ресурс

---

## Responses

### 201 Created - Returned if the scheme permission is created successfully.

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

### 403 Forbidden - Returned if user is not allowed to create permission grants.

