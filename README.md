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

## 🚀 Быстрый старт

### Предварительные требования
- **Node.js** 16+ и npm
- **Python 3.8+** с pip
- **LibreOffice** (для DOCX → PDF конвертации)

### Установка

1. **Клонируйте репозиторий**
```bash
git clone <repository-url>
cd file-converter-web-app
```

2. **Установите Node.js зависимости**
```bash
npm run install-all
```

3. **Настройте Python окружение**
```bash
# Создайте виртуальное окружение
python3 -m venv venv

# Активируйте его
source venv/bin/activate  # Linux/Mac
# или
venv\Scripts\activate     # Windows

# Установите Python зависимости
pip install pdf2docx PyPDF2 python-docx
```

4. **Установите LibreOffice** (опционально для DOCX → PDF)
```bash
# Ubuntu/Debian
sudo apt-get install libreoffice

# macOS
brew install --cask libreoffice

# Arch Linux
sudo pacman -S libreoffice-fresh
```

### Запуск

#### Режим разработки
```bash
# Запуск сервера и клиента одновременно
npm run dev
```

#### Производственный режим
```bash
# Сборка фронтенда
npm run build

# Запуск сервера
npm start
```

Приложение будет доступно по адресу `http://localhost:5000`

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

## 📋 Примеры использования

### Конвертация PDF в DOCX
```javascript
const formData = new FormData();
formData.append('file', pdfFile);

const response = await fetch('/api/convert/pdf-to-docx', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log('Файл готов:', result.downloadUrl);
```

### Пакетная конвертация изображений
```javascript
const formData = new FormData();
files.forEach(file => formData.append('files', file));
formData.append('format', 'webp');
formData.append('quality', '85');

const response = await fetch('/api/convert/images', {
  method: 'POST',
  body: formData
});
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

### Переменные окружения
```bash
NODE_ENV=production          # Режим production
PORT=5000                    # Порт сервера
UPLOAD_LIMIT=50              # Лимит размера файла (MB)
```

## 🐛 Устранение неполадок

### Python ошибки
```bash
# Переустановка Python зависимостей
source venv/bin/activate
pip install --upgrade pdf2docx PyPDF2 python-docx
```

### LibreOffice проблемы
```bash
# Проверка установки LibreOffice
libreoffice --version

# Тест конвертации
libreoffice --headless --convert-to pdf test.docx
```

### Проблемы с памятью
- Уменьшите количество одновременно обрабатываемых файлов
- Увеличьте лимит памяти Node.js: `node --max-old-space-size=4096 server.js`

## 📈 Производительность

### Оптимизация
- **Кеширование**: Результаты конвертации кешируются
- **Асинхронность**: Параллельная обработка файлов
- **Очистка**: Автоматическое удаление временных файлов

### Мониторинг
- Логирование всех операций
- Отслеживание времени конвертации
- Статистика использования

## 🤝 Вклад в проект

1. Форкните репозиторий
2. Создайте ветку для фичи: `git checkout -b feature/amazing-feature`
3. Закоммитьте изменения: `git commit -m 'Add amazing feature'`
4. Пусните в ветку: `git push origin feature/amazing-feature`
5. Откройте Pull Request

## 📄 Лицензия

Этот проект лицензирован под MIT License - см. файл [LICENSE](LICENSE) для деталей.

## 👨‍💻 Автор

**Ваше имя**
- GitHub: [@yourusername](https://github.com/yourusername)
- Email: your.email@example.com

## 🙏 Благодарности

- [pdf2docx](https://github.com/dothinking/pdf2docx) - за отличную библиотеку PDF конвертации
- [LibreOffice](https://www.libreoffice.org/) - за мощный офисный пакет
- [Sharp](https://sharp.pixelplumbing.com/) - за быструю обработку изображений

---

⭐ **Поставьте звезду, если проект оказался полезным!**