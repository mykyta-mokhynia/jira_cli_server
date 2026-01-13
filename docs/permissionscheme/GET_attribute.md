# GET /api/2/permissionscheme/{permissionSchemeId}/attribute/{attributeKey}

## Get scheme attribute by key (Experimental)

Возвращает атрибут для схемы разрешений, указанной по ID схемы разрешений и ключу атрибута.

**Примечания:**
- Forge и OAuth2 приложения не могут получить доступ к этому REST ресурсу
- **Экспериментальный endpoint**

---

## Пример запроса

### Node.js

```javascript
// This code sample uses the 'node-fetch' library:
// https://www.npmjs.com/package/node-fetch
const fetch = require('node-fetch');

fetch('http://{baseurl}/rest/api/2/permissionscheme/{permissionSchemeId}/attribute/{attributeKey}', {
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

### permissionSchemeId
- **Тип:** integer
- **Обязательно:** Да
- **Описание:** ID схемы разрешений

### attributeKey
- **Тип:** string
- **Обязательно:** Да
- **Описание:** Ключ атрибута

---

## Responses

### 200 OK - Permission scheme attribute

### 401 Unauthorized - Returned if the user is not authenticated.

### 403 Forbidden - Returned if the user is not an admin.

### 404 Not Found - Returned if there is no such attribute. 

