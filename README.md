# 🔄 File Converter Web App

Мощное веб-приложение для конвертации файлов с поддержкой PDF, DOCX и изображений. Построено на современном стеке технологий с высококачественной обработкой документов.

## ✨ Возможности

### 📄 PDF ↔ DOCX
- **PDF → DOCX**: Высококачественная конвертация через Python библиотеку `pdf2docx`
  - ✅ Сохранение форматирования и структуры
  - ✅ Поддержка таблиц и изображений
  - ✅ Правильное распознавание текста
  - ✅ Сохранение макета документа

- **DOCX → PDF**: Профессиональная конвертация через LibreOffice
  - ✅ Высокое качество рендеринга
  - ✅ Сохранение форматирования
  - ✅ Поддержка сложных документов

### 🖼️ Конвертация изображений
- **Поддерживаемые форматы**: JPEG, PNG, WebP, AVIF, BMP, TIFF
- **Настройки качества**: Контроль сжатия для каждого формата
- **Пакетная обработка**: До 10 файлов одновременно

### 📊 Дополнительные возможности
- **PDF → Изображения**: Конвертация страниц PDF в изображения
- **DOCX → HTML/TXT**: Извлечение содержимого документов
- **Пакетная обработка**: Обработка нескольких файлов одновременно
- **Поддержка русского языка**: Корректная обработка кириллицы

## 🛠️ Технологический стек

### Backend
- **Node.js** с Express.js
- **Python 3** с pdf2docx для PDF конвертации
- **LibreOffice** для DOCX → PDF
- **Sharp** для обработки изображений
- **Multer** для загрузки файлов

### Frontend
- **React** с современными хуками
- **Material-UI** или аналогичный UI фреймворк
- **Axios** для HTTP запросов
- **Responsive Design** для мобильных устройств

### Дополнительные инструменты
- **pdf2docx** - Python библиотека для PDF → DOCX
- **mammoth** - для DOCX → HTML
- **pdf2pic** - для PDF → изображения
- **fs-extra** - расширенная работа с файлами


## 📁 Структура проекта

```
file-converter-web-app/
├── 📁 client/                 # React фронтенд
│   ├── 📁 src/
│   │   ├── 📁 components/     # React компоненты
│   │   ├── 📁 services/       # API сервисы
│   │   └── App.js            # Главный компонент
│   └── package.json
├── 📁 uploads/               # Временные загруженные файлы
├── 📁 converted/             # Готовые конвертированные файлы
├── 📁 venv/                  # Python виртуальное окружение
├── 🐍 pdf_converter.py      # Python скрипт для PDF → DOCX
├── 🐍 test_python.py        # Тест Python зависимостей
├── 🚀 server.js             # Node.js сервер
├── 📦 package.json          # Node.js зависимости
└── 📖 README.md             # Этот файл
```

## 🔌 API Endpoints

### Конвертация PDF
```http
POST /api/convert/pdf-to-docx        # PDF → DOCX (одиночный)
POST /api/convert/pdfs-to-docx       # PDF → DOCX (множественный)
POST /api/convert/pdf-to-image       # PDF → изображения
```

### Конвертация DOCX
```http
POST /api/convert/docx-to-pdf        # DOCX → PDF (одиночный)
POST /api/convert/docxs-to-pdf       # DOCX → PDF (множественный)
POST /api/convert/docx               # DOCX → HTML/TXT
```

### Конвертация изображений
```http
POST /api/convert/image              # Одиночное изображение
POST /api/convert/images             # Множественные изображения
```

### Утилиты
```http
GET /api/file-info/:filename         # Информация о файле
GET /api/download/:filename          # Скачивание файла
```


## ⚙️ Конфигурация

### Лимиты файлов
- **Максимальный размер**: 50MB на файл
- **Количество файлов**: До 10 в пакетной обработке
- **Таймаут**: 60 секунд на конвертацию

### Поддерживаемые форматы

#### Входные форматы
- **Документы**: PDF, DOCX, DOC
- **Изображения**: JPEG, PNG, GIF, BMP, TIFF, WebP, AVIF

#### Выходные форматы
- **Документы**: PDF, DOCX, HTML, TXT
- **Изображения**: JPEG, PNG, WebP, AVIF

## 🔧 Разработка

### Запуск тестов
```bash
# Тест Python зависимостей
python test_python.py

# Тест API endpoints
npm test
```

### Структура кода
- **server.js** - основной сервер с роутами
- **client/src/** - React компоненты
- **pdf_converter.py** - Python модуль для PDF обработки


## 📈 Производительность

### Оптимизация
- **Кеширование**: Результаты конвертации кешируются
- **Асинхронность**: Параллельная обработка файлов
- **Очистка**: Автоматическое удаление временных файлов

### Мониторинг
- Логирование всех операций
- Отслеживание времени конвертации
- Статистика использования