# PostgreSQL 18 - Базовая настройка

## Статус установки

✅ PostgreSQL 18.1 установлен и запущен  
✅ База данных `jira_db` создана  
✅ PostgreSQL добавлен в PATH

## Подключение

### Через psql (командная строка)

```bash
# Подключиться к базе данных jira_db
psql -d jira_db

# Или к базе postgres (системная)
psql -d postgres
```

### Параметры подключения

- **Host:** localhost (127.0.0.1)
- **Port:** 5432 (по умолчанию)
- **User:** ваш системный пользователь (mykytamokhynia)
- **Database:** jira_db
- **Password:** не требуется (локальное подключение)

## Базовые команды PostgreSQL

### В psql консоли:

```sql
-- Показать все базы данных
\l

-- Подключиться к другой базе
\c jira_db

-- Показать все таблицы
\dt

-- Показать структуру таблицы
\d table_name

-- Выйти из psql
\q
```

### Создание таблицы (пример)

```sql
-- Подключиться к базе
\c jira_db

-- Создать простую таблицу
CREATE TABLE permission_schemes (
    id SERIAL PRIMARY KEY,
    jira_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Показать таблицы
\dt
```

## Управление сервисом

```bash
# Запустить PostgreSQL
brew services start postgresql@18

# Остановить PostgreSQL
brew services stop postgresql@18

# Перезапустить PostgreSQL
brew services restart postgresql@18

# Проверить статус
brew services list | grep postgresql@18
```

## Переменные окружения (для Node.js)

Добавьте в `.env` файл:

```env
# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=jira_db
DB_USER=mykytamokhynia
DB_PASSWORD=
```

## Полезные ссылки

- [PostgreSQL Documentation](https://www.postgresql.org/docs/18/)
- [psql Commands](https://www.postgresql.org/docs/18/app-psql.html)

