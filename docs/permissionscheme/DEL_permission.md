# DEL /api/2/permissionscheme/{schemeId}/permission/{permissionId}

## Delete a permission grant from a scheme

Удаляет разрешение из схемы разрешений.

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
  method: 'DELETE',
  headers: {
    'Authorization': `Basic ${Buffer.from(
      'email@example.com:<api_token>'
    ).toString('base64')}`
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

## Responses

### 204 No Content - Returned if the permission grant is deleted successfully.

### 401 Unauthorized - Returned if user is not logged in.

### 403 Forbidden - Returned if user is not allowed to delete permission grants.

