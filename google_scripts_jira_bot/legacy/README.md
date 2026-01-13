# Google Sheets Jira/Confluence Bot

Набор скриптов Google Apps Script для синхронизации данных из Jira и Confluence в Google Sheets с возможностью поиска и фильтрации.

## Структура проекта

### Основные скрипты

- **`config.js`** - Общие константы и функции для работы с Jira/Confluence API (JIRA_BASE_URL, CONF_REST_API, jiraAuthHeader_, jiraFetch_, jiraFetchAbsolute_)
- **`setup_source_sheet.js`** - Создает и настраивает лист "Source" для данных Jira
- **`setup_source_confluence_sheet.js`** - Создает и настраивает лист "Source_Confluence" для данных Confluence
- **`setup_report_sheet.js`** - Создает лист "Report" для поиска и отображения результатов
- **`setup_group_sheet.js`** - Создает и настраивает лист "Groups" для аудита boards и permission schemes
- **`setup_rename_sheet.js`** - Создает лист "Rename" для редактирования названий spaces и boards
- **`jyra_sync.js`** - Синхронизирует данные из Jira API в лист "Source"
- **`confluence_sync.js`** - Синхронизирует данные из Confluence API в лист "Source_Confluence"
- **`group_sync.js`** - Синхронизирует данные о boards, permission schemes и доступах из Jira API в лист "Groups"
- **`rename_sync.js`** - Обрабатывает переименование spaces и boards в Jira
- **`search.js`** - Обрабатывает поиск и фильтрацию данных в листе "Report"

## Настройка

### 1. Создание Google Apps Script проекта

1. Откройте Google Sheets
2. Перейдите в `Расширения` → `Apps Script`
3. Создайте новый проект
4. Скопируйте содержимое всех `.js` файлов в соответствующие файлы скрипта

### 2. Настройка авторизации

1. В редакторе Apps Script перейдите в `Проект` → `Настройки проекта`
2. Найдите раздел "Свойства скрипта"
3. Добавьте свойство:
   - **Ключ**: `JIRA_AUTH`
   - **Значение**: `email:api_token` (например, `user@example.com:your_api_token`)

   Для получения API токена:
   - Перейдите на https://id.atlassian.com/manage-profile/security/api-tokens
   - Создайте новый токен
   - Используйте формат: `ваш_email:токен`

### 3. Настройка URL (если необходимо)

По умолчанию используется:
- Jira: `https://jarvisheart.atlassian.net/`
- Confluence: `https://jarvisheart.atlassian.net/wiki/rest/api`

Если ваш инстанс использует другой URL, измените константы в файле:
- `config.js` - измените `JIRA_BASE_URL` и `CONF_REST_API`

## Использование

### Первоначальная настройка листов

1. Запустите функцию `setupSourceSheet()` для создания листа "Source" (Jira)
2. Запустите функцию `setupSourceConfluenceSheet()` для создания листа "Source_Confluence"
3. Запустите функцию `setupReportSheet()` для создания листа "Report"
4. Запустите функцию `setupGroupSheet()` для создания листа "Groups" (аудит boards)
5. Запустите функцию `setupRenameSheet()` для создания листа "Rename" (редактирование названий)

### Синхронизация данных

#### Синхронизация Jira

1. Запустите функцию `updateSourceFromJiraApi()`
2. Скрипт:
   - Получает все группы и их участников из Jira
   - Получает роли проектов и связанные группы
   - Заполняет лист "Source" данными в формате:
     - Name, Surname, Email, ProjectKey, Group, Role

#### Синхронизация Confluence

1. Запустите функцию `updateSourceFromConfluenceApi()`
2. Скрипт:
   - Получает все глобальные пространства (spaces) из Confluence
   - Получает права доступа для каждого пространства
   - Заполняет лист "Source_Confluence" данными в формате:
     - Name, Surname, Email, SpaceKey, SpaceName, Permission, GrantedVia, GrantedBy

#### Аудит Boards и Permission Schemes

1. Запустите функцию `updateGroupsFromJiraApi()`
2. Скрипт:
   - Получает все проекты (spaces) из Jira
   - Для каждого проекта получает все boards (доски)
   - Получает владельца проекта (Space Owner)
   - Получает permission scheme для каждого проекта
   - Извлекает группы и их роли из проектов
   - Заполняет лист "Groups" данными в формате:
     - Space Name, Space Key, Board Name, Board ID, Space Owner, Group, Roles, Permission Schema

#### Редактирование названий Spaces и Boards

1. Запустите функцию `setupRenameSheet()` для создания листа "Rename"
2. Скрипт автоматически загрузит все уникальные spaces и boards из листа "Groups"
3. В листе "Rename" структура колонок:
   - **Space Name** - Название проекта (для справки)
   - **Group** - Группы, связанные с проектом (для понимания к какому space относится)
   - **Type** - Выпадающий список: "Space" или "Board" (динамически меняет заголовки колонок)
   - **Current Name** - Текущее название (меняется на "Current Space Name" или "Current Board Name" в зависимости от Type)
   - **New Name** - Новое название (меняется на "New Space Name" или "New Board Name" в зависимости от Type)
   - **Status** - Статус обработки
4. Заголовки колонок автоматически меняются в зависимости от выбранного Type в первой строке данных
5. Для переименования одной строки:
   - Выберите ячейку в строке, которую хотите переименовать
   - Запустите функцию `processCurrentRowRename()` из редактора скриптов
   - Или вызовите `processSingleRename(rowNumber)`, где rowNumber - индекс строки (0 для первой строки данных)
6. Статус выполнения отображается в колонке "Status":
   - "Pending" - ожидает обработки
   - "Completed" - успешно обновлено
   - "Error" - произошла ошибка (детали в заметке ячейки)
   - "Skipped" - пропущено (названия одинаковые)

### Поиск и фильтрация

1. Откройте лист "Report"
2. В ячейке **A2** выберите тип данных:
   - "Jira projects" - для поиска по данным Jira
   - "Confluence projects" - для поиска по данным Confluence
3. В ячейке **B2** введите поисковый запрос:
   - Email пользователя
   - Имя или фамилию
   - Название группы (для Jira)
   - Space key или Space name (для Confluence)
4. В ячейке **C2** выберите режим:
   - "Привʼязка до проектів" - показывает все проекты/пространства пользователя
   - "Без прив'язки" - показывает только уникальные группы/пространства
5. В ячейке **B3** выберите источник данных:
   - "LIVE" - использует актуальные данные из листов Source
   - Дата - использует резервную копию (если доступна)

Результаты поиска отображаются начиная с строки 5.

## Структура данных

### Лист "Source" (Jira)

| Name | Surname | Email | ProjectKey | Group | Role |
|------|---------|-------|------------|-------|------|

### Лист "Source_Confluence"

| Name | Surname | Email | SpaceKey | SpaceName | Permission | GrantedVia | GrantedBy |
|------|---------|-------|----------|-----------|------------|------------|-----------|

- **Permission**: Admin, Edit, View
- **GrantedVia**: User, Group
- **GrantedBy**: Email пользователя или название группы

### Лист "Groups" (Аудит Boards)

| Space Name | Space Key | Board Name | Board ID | Space Owner | Person/Group | Person Type | Permission Schema |
|------------|-----------|------------|----------|-------------|--------------|-------------|-------------------|

- **Space Name/Key**: Название и ключ проекта Jira
- **Board Name/ID**: Название и ID доски (board) в проекте
- **Space Owner**: Владелец проекта (lead)
- **Person/Group**: Имя пользователя или название группы
- **Person Type**: "User" или "Group"
- **Permission Schema**: Название схемы разрешений проекта

**Примечание**: Если у проекта нет boards, в колонках Board Name и Board ID будут пустые значения. Для каждого проекта создаются строки для всех пользователей и групп из permission scheme.

### Лист "Rename" (Редактирование названий)

| Space Name | Group | Type | Current Name | New Name | Status |
|------------|-------|------|--------------|----------|--------|

- **Space Name**: Название проекта (для справки)
- **Group**: Группы, связанные с проектом (для понимания к какому space относится)
- **Type**: Выпадающий список "Space" или "Board" (динамически меняет заголовки колонок 4 и 5)
- **Current Name**: Текущее название (меняется на "Current Space Name" или "Current Board Name" в зависимости от Type)
- **New Name**: Новое название (меняется на "New Space Name" или "New Board Name" в зависимости от Type)
- **Status**: Статус обработки (Pending, Completed, Error, Skipped)

**Примечание**: Заголовки колонок "Current Name" и "New Name" автоматически обновляются при изменении Type в первой строке данных.

### Лист "Report"

- **Строка 1**: Заголовки (Type, Search, Mode, Status)
- **Строка 2**: Параметры поиска
- **Строка 3**: Источник данных
- **Строка 4**: Заголовки результатов
- **Строка 5+**: Результаты поиска

## Автоматизация

### Поиск (search.js)

Скрипт `search.js` содержит функцию `onEdit()`, которая автоматически:
- Обновляет результаты при изменении типа данных (A2)
- Обновляет результаты при изменении источника данных (B3)
- Выполняет поиск при изменении запроса (B2) или режима (C2)

### Редактирование названий (rename_sync.js)

Скрипт `rename_sync.js` содержит функцию `onEditRename()`, которая автоматически:
- Обновляет заголовки колонок при изменении Type в колонке C
- Заголовки меняются в зависимости от выбранного типа: "Current Space Name"/"New Space Name" или "Current Board Name"/"New Board Name"

**Примечание**: Для работы автоматического обновления заголовков необходимо установить триггер `onEditRename` для листа "Rename":
1. В редакторе Apps Script перейдите в `Триггеры` → `Добавить триггер`
2. Выберите функцию: `onEditRename`
3. Источник события: `Из таблицы`
4. Тип события: `При редактировании`

## Резервное копирование

Система поддерживает работу с резервными копиями данных через лист "Report_Backups". Для использования резервных копий:
1. Сохраните данные из листов "Source" или "Source_Confluence" в отдельные файлы
2. Добавьте записи в лист "Report_Backups" с форматом:
   - Дата, Тип (JIRA/CONFLUENCE), File ID, Дополнительная информация

## Примечания

- Скрипты используют REST API Jira и Confluence
- Для больших объемов данных синхронизация может занять некоторое время
- Рекомендуется периодически создавать резервные копии данных
- Убедитесь, что у вашего API токена есть необходимые права доступа

## Устранение неполадок

### Ошибка "JIRA_AUTH not set"
- Проверьте, что свойство `JIRA_AUTH` добавлено в настройках проекта
- Убедитесь, что формат правильный: `email:token`

### Ошибка "Source sheet missing" или "Groups sheet missing"
- Запустите соответствующую функцию setup: `setupSourceSheet()`, `setupSourceConfluenceSheet()` или `setupGroupSheet()`

### Ошибка "HTTP 401" или "HTTP 403"
- Проверьте правильность API токена
- Убедитесь, что у токена есть права на чтение данных Jira/Confluence

### Медленная работа
- Для больших объемов данных синхронизация может занимать несколько минут
- Используйте резервные копии для быстрого доступа к историческим данным

