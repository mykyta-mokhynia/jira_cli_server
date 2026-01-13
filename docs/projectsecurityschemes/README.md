# Project Permission Schemes

Этот ресурс представляет схемы разрешений для проекта. Используйте этот ресурс для:

- получения деталей уровней безопасности issue проекта, доступных вызывающему пользователю
- получения схемы разрешений, связанной с проектом, или назначения другой схемы разрешений проекту
- получения деталей схемы безопасности issue проекта

См. [Managing project permissions](https://support.atlassian.com/jira-service-management-cloud/docs/manage-project-permissions/) для получения дополнительной информации о схемах разрешений.

## Operations

### GET /rest/api/3/project/{projectKeyOrId}/issuesecuritylevelscheme
Получить схему безопасности issue проекта.

### GET /rest/api/3/project/{projectKeyOrId}/permissionscheme
Получить назначенную схему разрешений проекта.

### PUT /rest/api/3/project/{projectKeyOrId}/permissionscheme
Назначить схему разрешений проекту.

### GET /rest/api/3/project/{projectKeyOrId}/securitylevel
Получить уровни безопасности issue проекта.


