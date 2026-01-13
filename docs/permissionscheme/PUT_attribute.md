# PUT /api/2/permissionscheme/{permissionSchemeId}/attribute/{key}

## Update or insert a scheme attribute (Experimental)

Обновляет или вставляет атрибут для схемы разрешений, указанной по ID схемы разрешений. Атрибут состоит из ключа и значения. Значение будет преобразовано в Boolean с помощью Boolean#valueOf.

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

fetch('http://{baseurl}/rest/api/2/permissionscheme/{permissionSchemeId}/attribute/{key}', {
  method: 'PUT',
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

### permissionSchemeId
- **Тип:** integer
- **Обязательно:** Да
- **Описание:** ID схемы разрешений

### key
- **Тип:** string
- **Обязательно:** Да
- **Описание:** Ключ атрибута

---

## Request body

**Content-Type:** `text/plain`

**Тип:** string

Значение атрибута, которое будет преобразовано в Boolean.

---

## Responses

### 204 No Content - Returned if the attribute is updated successfully.

### 401 Unauthorized - Returned if the user is not authenticated.

### 403 Forbidden - Returned if the user is not an admin.

### 500 Internal Server Error - Returned if there was an error related to attribute upsert.

