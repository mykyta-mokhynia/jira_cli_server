# Permission Schemes

## Operations

### GET /api/2/permissionscheme
Получить список всех схем разрешений в системе.

### POST /api/2/permissionscheme
Создать новую схему разрешений.

### GET /api/2/permissionscheme/{permissionSchemeId}/attribute/{attributeKey}
Получить значение конкретного атрибута схемы разрешений.

### PUT /api/2/permissionscheme/{permissionSchemeId}/attribute/{key}
Обновить значение атрибута схемы разрешений.

### GET /api/2/permissionscheme/{schemeId}
Получить информацию о конкретной схеме разрешений по ID.

### PUT /api/2/permissionscheme/{schemeId}
Обновить существующую схему разрешений.

### DEL /api/2/permissionscheme/{schemeId}
Удалить схему разрешений.

### GET /api/2/permissionscheme/{schemeId}/permission
Получить список всех разрешений в схеме.

### POST /api/2/permissionscheme/{schemeId}/permission
Добавить новое разрешение в схему.

### GET /api/2/permissionscheme/{schemeId}/permission/{permissionId}
Получить информацию о конкретном разрешении в схеме.

### DEL /api/2/permissionscheme/{schemeId}/permission/{permissionId}
Удалить разрешение из схемы.
