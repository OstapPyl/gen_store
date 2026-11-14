# Автоматична синхронізація замовлень на ноутбук Windows

Утиліта синхронізації дозволяє власнику магазину мати актуальну локальну копію всіх замовлень у файлі `orders.sqlite` на власному ноутбуці.

Синхронізація є **односторонньою (сервер → ноутбук)**, працює за надійним курсором змін (`updated_at`), виконує транзакційний upsert без дублювання записів та стійка до переривання інтернет-з'єднання.

---

## 1. Секрет доступу

На ноутбуці створіть локальний файл `.env.local` (або системну змінну середовища Windows):

```env
SYNC_SERVER_URL="https://ваш-домен-магазину.ua"
SYNC_API_TOKEN="ваш_захищений_токен_з_сервера"
SYNC_SQLITE_PATH="C:\\Users\\LOQ\\Documents\\GenStore\\orders.sqlite"
```

Секретний токен `SYNC_API_TOKEN` має права **виключно на читання** потрібних полів замовлень.

---

## 2. Перевірка одноразового запуску

У терміналі PowerShell перевірте роботу утиліти:

```powershell
npm run sync -- --once
```

Якщо все налаштовано вірно, ви побачите:
```
[Gen Sync Client] Підключення до: https://...
[Gen Sync Client] Локальна база: ...\orders.sqlite
[Gen Sync Client] Синхронізацію завершено. Оновлено/завантажено замовлень: N
```

---

## 3. Налаштування Планувальника завдань Windows (Task Scheduler)

Для того, щоб синхронізація відбувалася автоматично кожні 5 хвилин та при вході в Windows:

### Спосіб А: Автоматичне створення через PowerShell (від імені адміністратора)

Відкрийте PowerShell від імені адміністратора та виконайте команду:

```powershell
$Action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument '/c "cd /d D:\twohundredtwentyfive && npm run sync -- --once"'
$TriggerLogon = New-ScheduledTaskTrigger -AtLogOn
$TriggerRepeat = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 5)
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -RunOnlyIfNetworkAvailable -StartWhenAvailable

Register-ScheduledTask -TaskName "GenStoreSyncOrders" -Action $Action -Trigger @($TriggerLogon, $TriggerRepeat) -Settings $Settings -Description "Автоматична синхронізація замовлень магазину Gen у orders.sqlite"
```

### Спосіб Б: Через графічний інтерфейс Windows

1. Натисніть `Win + R`, введіть `taskschd.msc` та натисніть Enter.
2. У правій панелі оберіть **«Створити завдання...»** (Create Task).
3. **Вкладка «Загальні» (General)**:
   - Ім'я: `GenStoreSyncOrders`
   - Оберіть: *«Виконувати тільки для користувача, який увійшов у систему»*.
4. **Вкладка «Тригери» (Triggers)**:
   - Додайте перший тригер: *«При вході в систему»* (At log on).
   - Додайте другий тригер: *«За розкладом»* (On a schedule) → Щоденно → відзначте галочку *«Повторювати завдання кожні: 5 хвилин»* протягом доби.
5. **Вкладка «Дії» (Actions)**:
   - Дія: *«Запуск програми»* (Start a program).
   - Програма або сценарій: `cmd.exe`
   - Додати аргументи: `/c npm run sync -- --once`
   - Робоча папка: `D:\twohundredtwentyfive` (шлях до проєкту).
6. **Вкладка «Умови» (Conditions)**:
   - Встановіть галочку: *«Запускати лише за наявності мережного підключення»*.
7. Натисніть **«ОК»**.

---

## 4. Експорт локальної бази у Microsoft Excel (XLSX)

Ви можете у будь-який момент вивантажити всі накопичені на ноутбуці замовлення в Excel:

```powershell
npm run export-xlsx
```

Файл `orders_export.xlsx` буде сформовано з аркушами:
- **«Замовлення»**: номери замовлень, телефони (у текстовому форматі `@`), клієнти, ТТН, адреси, коментарі.
- **«Товари замовлень»**: найменування товарів, артикули, ціни на момент купівлі, кількості.
- Поля захищені від ін'єкцій формул Excel.
