# DEL /api/2/permissionscheme/{schemeId}

## Delete a permission scheme by ID

Удаляет схему разрешений, идентифицированную по указанному ID.

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

---

## Responses

### 204 No Content - Returned if the permission scheme is successfully deleted.

### 401 Unauthorized - Returned if user is not logged in.

### 403 Forbidden - Returned if user is not allowed to delete permission schemes.

