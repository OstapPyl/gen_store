# Інструкція резервного копіювання та відновлення (Backup & Restore)

> [!WARNING]
> Локальна копія `orders.sqlite` на ноутбуці містить виключно замовлення і не замінює повноцінного резервного копіювання сервера (товари, фотографії, користувачі, налаштування).

---

## 1. Резервне копіювання бази даних PostgreSQL

### Створення дампу (Backup)
```bash
pg_dump -U postgres -h localhost -d gen_store -F c -b -v -f "/backups/gen_store_$(date +%Y%m%d_%H%M%S).dump"
```
Або у вигляді відкритого SQL-файлу:
```bash
pg_dump -U postgres -d gen_store > "/backups/gen_store_backup.sql"
```

### Відновлення (Restore)
```bash
# Для бінарного формату:
pg_restore -U postgres -d gen_store -v "/backups/gen_store_20261108.dump"

# Для SQL формату:
psql -U postgres -d gen_store < "/backups/gen_store_backup.sql"
```

---

## 2. Резервне копіювання медіафайлів (зображення та PDF)

Каталог `public/uploads` містить фотографії товарів та завантажені інструкції.

### Створення архіву:
```bash
tar -czvf "/backups/uploads_$(date +%Y%m%d).tar.gz" -C ./public uploads
```

### Відновлення:
```bash
tar -xzvf "/backups/uploads_20261108.tar.gz" -C ./public
```

---

## 3. Регулярний автоматичний бекап (Cron на сервері)

Рекомендований розклад у `crontab -e`:
```bash
# Щоночі о 03:00 робити дамп бази даних та архів медіа
0 3 * * * pg_dump -U postgres gen_store | gzip > /backups/db_$(date +\%F).sql.gz
15 3 * * * tar -czf /backups/uploads_$(date +\%F).tar.gz -C /app/public uploads
```
