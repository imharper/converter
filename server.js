const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const sharp = require('sharp');
const mammoth = require('mammoth');
const pdf2pic = require('pdf2pic');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use('/converted', express.static('converted'));

// Создаем необходимые директории
fs.ensureDirSync('uploads');
fs.ensureDirSync('converted');
fs.ensureDirSync('temp-conversion');

// Настройка multer для загрузки файлов (поддержка множественных файлов)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB лимит на файл
    files: 10 // максимум 10 файлов
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|bmp|tiff|pdf|docx|doc/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Неподдерживаемый тип файла'));
    }
  }
});

// Функция для получения оригинального имени файла без расширения с поддержкой русского языка
const getBaseFileName = (originalName) => {
  // Декодируем имя файла из Buffer если нужно
  let decodedName = originalName;
  try {
    // Проверяем, если строка содержит кракозябры, пытаемся декодировать
    if (decodedName.includes('Ð') || decodedName.includes('â') || decodedName.includes('Ã')) {
      decodedName = Buffer.from(decodedName, 'latin1').toString('utf8');
    }
  } catch (error) {
    console.log('Ошибка декодирования имени файла:', error.message);
    decodedName = originalName;
  }
  
  const parsed = path.parse(decodedName);
  // Очищаем имя файла от специальных символов, но оставляем русские буквы, цифры, дефисы и подчеркивания
  const cleanName = parsed.name.replace(/[^\w\u0400-\u04FF\-\s]/g, '_').replace(/\s+/g, '_');
  return cleanName;
};

// Функция конвертации через LibreOffice
const convertWithLibreOffice = async (inputPath, outputDir, outputFormat, originalName) => {
  try {
    console.log(`Конвертирую ${inputPath} в ${outputFormat}...`);
    
    // Создаем временную директорию
    const tempDir = path.join('temp-conversion', Date.now().toString());
    fs.ensureDirSync(tempDir);
    
    // Команда LibreOffice для конвертации
    let filterName;
    let extension;
    
    switch (outputFormat.toLowerCase()) {
      case 'pdf':
        filterName = 'writer_pdf_Export';
        extension = 'pdf';
        break;
      case 'docx':
        filterName = 'Office Open XML Text';
        extension = 'docx';
        break;
      case 'odt':
        filterName = 'writer8';
        extension = 'odt';
        break;
      default:
        throw new Error(`Неподдерживаемый формат: ${outputFormat}`);
    }
    
    // Устанавливаем переменные окружения для Java
    const env = {
      ...process.env,
      JAVA_HOME: '/usr/lib/jvm/java-24-openjdk',
      PATH: `/usr/lib/jvm/java-24-openjdk/bin:${process.env.PATH}`,
      HOME: process.env.HOME
    };
    
    // Выполняем конвертацию с правильными параметрами
    const command = `libreoffice --headless --convert-to ${extension} --outdir "${tempDir}" "${inputPath}"`;
    console.log('Выполняю команду:', command);
    
    const { stdout, stderr } = await execAsync(command, { 
      env: env,
      timeout: 45000 // 45 секунд timeout
    });
    
    console.log('Конвертация stdout:', stdout);
    if (stderr) console.log('Конвертация stderr:', stderr);
    
    // Ждем немного для завершения операции
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Находим конвертированный файл
    const files = fs.readdirSync(tempDir);
    console.log('Файлы в temp директории:', files);
    
    const convertedFile = files.find(file => file.endsWith(`.${extension}`));
    
    if (!convertedFile) {
      // Для PDF в DOCX используем fallback метод
      if (outputFormat === 'docx') {
        throw new Error('LibreOffice_fallback_needed');
      }
      throw new Error('Не удалось найти конвертированный файл');
    }
    
    // Создаем имя выходного файла на основе оригинального
    const baseFileName = getBaseFileName(originalName);
    const outputFileName = `${baseFileName}_converted.${extension}`;
    const tempFilePath = path.join(tempDir, convertedFile);
    const finalOutputPath = path.join(outputDir, outputFileName);
    
    // Перемещаем файл в финальную директорию
    fs.moveSync(tempFilePath, finalOutputPath);
    
    // Очищаем временную директорию
    fs.removeSync(tempDir);
    
    console.log(`Конвертация завершена: ${finalOutputPath}`);
    return {
      success: true,
      outputPath: finalOutputPath,
      outputFileName: outputFileName
    };
    
  } catch (error) {
    console.error('Ошибка конвертации:', error);
    throw error;
  }
};

// Функция конвертации PDF в DOCX через python pdf2docx библиотеку (высокое качество)
const convertPdfToDocxWithPdf2docx = async (inputPath, outputDir, originalName) => {
  try {
    console.log('Используем Python pdf2docx для высококачественной конвертации...');
    
    const baseFileName = `${getBaseFileName(originalName)}`;
    const outputFileName = `${baseFileName}_converted.docx`;
    const outputPath = path.join(outputDir, outputFileName);
    
    // Команда для выполнения Python скрипта через venv
    const pythonScript = path.join(__dirname, 'pdf_converter.py');
    const venvPython = path.join(__dirname, 'venv', 'bin', 'python');
    
    console.log('🔍 Диагностика путей:');
    console.log('  Python script:', pythonScript);
    console.log('  Venv Python:', venvPython);
    console.log('  Venv exists:', fs.existsSync(venvPython));
    console.log('  Script exists:', fs.existsSync(pythonScript));
    console.log('  Input file exists:', fs.existsSync(inputPath));
    
    // Проверяем, существует ли venv Python, если нет - используем системный
    const pythonExecutable = fs.existsSync(venvPython) ? venvPython : 'python3';
    const command = `"${pythonExecutable}" "${pythonScript}" "${inputPath}" "${outputPath}" --json`;
    
    console.log('🚀 Выполняю команду:', command);
    
    try {
      const { stdout, stderr } = await execAsync(command, { 
        timeout: 60000, // 60 секунд timeout
        env: {
          ...process.env,
          ...(fs.existsSync(venvPython) ? {
            VIRTUAL_ENV: path.join(__dirname, 'venv'),
            PATH: `${path.join(__dirname, 'venv', 'bin')}:${process.env.PATH}`
          } : {})
        }
      });
      
      console.log('📤 Python stdout length:', stdout.length);
      console.log('📤 Python stdout:', JSON.stringify(stdout));
      
      if (stderr) {
        console.log('⚠️ Python stderr:', stderr);
      }
      
      // Проверяем, что stdout не пустой
      if (!stdout || stdout.trim().length === 0) {
        throw new Error('Python скрипт не вернул результат. Проверьте, что pdf2docx установлен в venv.');
      }
      
      // Парсим JSON результат от Python скрипта
      let result;
      try {
        result = JSON.parse(stdout.trim());
      } catch (parseError) {
        console.error('❌ Ошибка парсинга JSON от Python скрипта:', parseError);
        console.log('📤 Raw Python stdout:', stdout);
        console.log('📤 Trimmed stdout:', stdout.trim());
        throw new Error(`Ошибка парсинга результата Python скрипта: ${parseError.message}`);
      }
      
      if (!result.success) {
        throw new Error(result.error || 'Python конвертация не удалась');
      }
      
      console.log(`✅ pdf2docx конвертация завершена: ${result.statistics?.total_pages || 'Unknown'} страниц`);
      
      return {
        success: true,
        outputPath: outputPath,
        outputFileName: outputFileName,
        method: 'pdf2docx library (Python)',
        statistics: {
          pages: result.statistics?.total_pages || 'Unknown',
          converted_pages: result.statistics?.converted_pages || 'Unknown',
          format: result.statistics?.format || 'High-quality PDF to DOCX conversion',
          preserves: result.statistics?.preserves || ['formatting', 'tables', 'images', 'text structure'],
          file_size: result.file_size
        }
      };
      
    } catch (execError) {
      console.error('❌ Ошибка выполнения Python команды:', execError);
      throw new Error(`Ошибка выполнения Python скрипта: ${execError.message}`);
    }
    
  } catch (error) {
    console.error('❌ Ошибка в pdf2docx конвертации:', error);
    throw error;
  }
};

// API Routes

// Конвертация изображений (одиночный файл)
app.post('/api/convert/image', upload.single('file'), async (req, res) => {
  try {
    const { file } = req;
    const { format, quality } = req.body;
    
    if (!file) {
      return res.status(400).json({ error: 'Файл не загружен' });
    }

    const baseFileName = getBaseFileName(file.originalname);
    const outputFilename = `${baseFileName}_converted.${format}`;
    const outputPath = path.join('converted', outputFilename);

    let sharpInstance = sharp(file.path);

    // Применяем конвертацию в зависимости от формата
    switch (format) {
      case 'jpeg':
      case 'jpg':
        sharpInstance = sharpInstance.jpeg({ quality: parseInt(quality) || 90 });
        break;
      case 'png':
        sharpInstance = sharpInstance.png({ quality: parseInt(quality) || 90 });
        break;
      case 'webp':
        sharpInstance = sharpInstance.webp({ quality: parseInt(quality) || 90 });
        break;
      case 'avif':
        sharpInstance = sharpInstance.avif({ quality: parseInt(quality) || 90 });
        break;
      default:
        return res.status(400).json({ error: 'Неподдерживаемый формат' });
    }

    await sharpInstance.toFile(outputPath);

    // Удаляем оригинальный файл
    fs.unlinkSync(file.path);

    res.json({
      success: true,
      downloadUrl: `/converted/${outputFilename}`,
      filename: outputFilename,
      originalName: Buffer.from(file.originalname, 'latin1').toString('utf8')
    });

  } catch (error) {
    console.error('Ошибка конвертации изображения:', error);
    res.status(500).json({ error: 'Ошибка при конвертации изображения' });
  }
});

// Конвертация множественных изображений
app.post('/api/convert/images', upload.array('files', 10), async (req, res) => {
  try {
    const { files } = req;
    const { format, quality } = req.body;
    
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'Файлы не загружены' });
    }

    const results = [];
    const errors = [];

    for (const file of files) {
      try {
        const baseFileName = getBaseFileName(file.originalname);
        const outputFilename = `${baseFileName}_converted.${format}`;
        const outputPath = path.join('converted', outputFilename);

        let sharpInstance = sharp(file.path);

        switch (format) {
          case 'jpeg':
          case 'jpg':
            sharpInstance = sharpInstance.jpeg({ quality: parseInt(quality) || 90 });
            break;
          case 'png':
            sharpInstance = sharpInstance.png({ quality: parseInt(quality) || 90 });
            break;
          case 'webp':
            sharpInstance = sharpInstance.webp({ quality: parseInt(quality) || 90 });
            break;
          case 'avif':
            sharpInstance = sharpInstance.avif({ quality: parseInt(quality) || 90 });
            break;
          default:
            throw new Error('Неподдерживаемый формат');
        }

        await sharpInstance.toFile(outputPath);
        fs.unlinkSync(file.path);

        results.push({
          originalName: Buffer.from(file.originalname, 'latin1').toString('utf8'),
          filename: outputFilename,
          downloadUrl: `/converted/${outputFilename}`,
          success: true
        });

      } catch (error) {
        errors.push({
          originalName: file.originalname,
          error: error.message
        });
        // Удаляем файл даже при ошибке
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      }
    }

    res.json({
      success: true,
      results: results,
      errors: errors,
      total: files.length,
      converted: results.length,
      failed: errors.length
    });

  } catch (error) {
    console.error('Ошибка конвертации изображений:', error);
    res.status(500).json({ error: 'Ошибка при конвертации изображений' });
  }
});

// Конвертация PDF в изображения
app.post('/api/convert/pdf-to-image', upload.single('file'), async (req, res) => {
  try {
    const { file } = req;
    const { format, quality } = req.body;
    
    if (!file) {
      return res.status(400).json({ error: 'PDF файл не загружен' });
    }

    const baseFileName = getBaseFileName(file.originalname);
    const convert = pdf2pic.fromPath(file.path, {
      density: 300,
      saveFilename: `${baseFileName}_page`,
      savePath: './converted/',
      format: format || 'png',
      width: 2480,
      height: 3508
    });

    const results = await convert.bulk(-1);
    
    // Удаляем оригинальный файл
    fs.unlinkSync(file.path);

    const downloadUrls = results.map(result => ({
      page: result.page,
      url: `/converted/${path.basename(result.path)}`
    }));

    res.json({
      success: true,
      pages: downloadUrls,
      totalPages: results.length,
      originalName: Buffer.from(file.originalname, 'latin1').toString('utf8')
    });

  } catch (error) {
    console.error('Ошибка конвертации PDF:', error);
    res.status(500).json({ error: 'Ошибка при конвертации PDF' });
  }
});

// Конвертация PDF в DOCX через pdf2docx
app.post('/api/convert/pdf-to-docx', upload.single('file'), async (req, res) => {
  try {
    const { file } = req;
    
    if (!file) {
      return res.status(400).json({ error: 'PDF файл не загружен' });
    }

    console.log('Начинаем конвертацию PDF в DOCX через pdf2docx...');
    
    // Используем только pdf2docx метод
    const result = await convertPdfToDocxWithPdf2docx(
      file.path,
      'converted',
      file.originalname
    );
    
    // Удаляем оригинальный файл
    fs.unlinkSync(file.path);

    // Получаем статистику файла
    const stats = fs.statSync(result.outputPath);

    res.json({
      success: true,
      downloadUrl: `/converted/${result.outputFileName}`,
      filename: result.outputFileName,
      originalName: Buffer.from(file.originalname, 'latin1').toString('utf8'),
      fileSize: stats.size,
      conversionMethod: result.method,
      quality: result.statistics?.format || 'High-quality PDF to DOCX conversion',
      statistics: result.statistics
    });

  } catch (error) {
    console.error('Ошибка конвертации PDF в DOCX:', error);
    res.status(500).json({ 
      error: `Ошибка при конвертации PDF в DOCX: ${error.message}`,
      suggestion: 'Убедитесь, что Python и pdf2docx установлены правильно. Проверьте, что PDF файл не поврежден и не защищен паролем.'
    });
  }
});

// Множественная конвертация PDF в DOCX через pdf2docx
app.post('/api/convert/pdfs-to-docx', upload.array('files', 10), async (req, res) => {
  try {
    const { files } = req;
    
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'PDF файлы не загружены' });
    }

    const results = [];
    const errors = [];

    for (const file of files) {
      try {
        console.log(`Конвертируем ${file.originalname} через pdf2docx...`);
        
        // Используем только pdf2docx метод
        const result = await convertPdfToDocxWithPdf2docx(
          file.path,
          'converted',
          file.originalname
        );
        
        fs.unlinkSync(file.path);
        const stats = fs.statSync(result.outputPath);

        results.push({
          originalName: Buffer.from(file.originalname, 'latin1').toString('utf8'),
          filename: result.outputFileName,
          downloadUrl: `/converted/${result.outputFileName}`,
          fileSize: stats.size,
          conversionMethod: result.method,
          statistics: result.statistics,
          success: true
        });

      } catch (error) {
        console.error(`Ошибка конвертации ${file.originalname}:`, error);
        errors.push({
          originalName: file.originalname,
          error: error.message
        });
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      }
    }

    res.json({
      success: true,
      results: results,
      errors: errors,
      total: files.length,
      converted: results.length,
      failed: errors.length
    });

  } catch (error) {
    console.error('Ошибка конвертации PDF файлов:', error);
    res.status(500).json({ error: 'Ошибка при конвертации PDF файлов' });
  }
});

// Высококачественная конвертация DOCX в PDF через LibreOffice
app.post('/api/convert/docx-to-pdf', upload.single('file'), async (req, res) => {
  try {
    const { file } = req;
    
    if (!file) {
      return res.status(400).json({ error: 'DOCX файл не загружен' });
    }

    console.log('Начинаем высококачественную конвертацию DOCX в PDF...');
    
    const result = await convertWithLibreOffice(
      file.path, 
      'converted', 
      'pdf',
      file.originalname
    );
    
    // Удаляем оригинальный файл
    fs.unlinkSync(file.path);

    // Получаем статистику файла
    const stats = fs.statSync(result.outputPath);

    res.json({
      success: true,
      downloadUrl: `/converted/${result.outputFileName}`,
      filename: result.outputFileName,
      originalName: Buffer.from(file.originalname, 'latin1').toString('utf8'),
      fileSize: stats.size,
      conversionMethod: 'Профессиональная конвертация',
      quality: 'Высокое качество с сохранением форматирования'
    });

  } catch (error) {
    console.error('Ошибка конвертации DOCX в PDF:', error);
    res.status(500).json({ 
      error: `Ошибка при конвертации DOCX в PDF: ${error.message}`,
      suggestion: 'Убедитесь, что DOCX файл не поврежден'
    });
  }
});

// Конвертация DOCX в HTML/текст (оставляем старый метод для этих форматов)
app.post('/api/convert/docx', upload.single('file'), async (req, res) => {
  try {
    const { file } = req;
    const { format } = req.body;
    
    if (!file) {
      return res.status(400).json({ error: 'DOCX файл не загружен' });
    }

    let result;
    let outputFilename;
    let outputPath;
    const baseFileName = getBaseFileName(file.originalname);

    switch (format) {
      case 'html':
        result = await mammoth.convertToHtml({ path: file.path });
        outputFilename = `${baseFileName}_converted.html`;
        outputPath = path.join('converted', outputFilename);
        fs.writeFileSync(outputPath, result.value);
        break;
      case 'txt':
        result = await mammoth.extractRawText({ path: file.path });
        outputFilename = `${baseFileName}_converted.txt`;
        outputPath = path.join('converted', outputFilename);
        fs.writeFileSync(outputPath, result.value);
        break;
      case 'pdf':
        // Редирект на высококачественную конвертацию DOCX в PDF
        return res.redirect(307, '/api/convert/docx-to-pdf');
      default:
        return res.status(400).json({ error: 'Неподдерживаемый формат вывода' });
    }

    // Удаляем оригинальный файл
    fs.unlinkSync(file.path);

    res.json({
      success: true,
      downloadUrl: `/converted/${outputFilename}`,
      filename: outputFilename,
      originalName: Buffer.from(file.originalname, 'latin1').toString('utf8'),
      warnings: result.messages || []
    });

  } catch (error) {
    console.error('Ошибка конвертации DOCX:', error);
    res.status(500).json({ error: 'Ошибка при конвертации DOCX' });
  }
});

// Получение информации о файле
app.get('/api/file-info/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filepath = path.join('converted', filename);
    
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: 'Файл не найден' });
    }

    const stats = fs.statSync(filepath);
    res.json({
      filename,
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime
    });

  } catch (error) {
    console.error('Ошибка получения информации о файле:', error);
    res.status(500).json({ error: 'Ошибка при получении информации о файле' });
  }
});

// Скачивание файла
app.get('/api/download/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filepath = path.join('converted', filename);
    
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: 'Файл не найден' });
    }

    res.download(filepath, filename);

  } catch (error) {
    console.error('Ошибка скачивания файла:', error);
    res.status(500).json({ error: 'Ошибка при скачивании файла' });
  }
});

// Множественная конвертация DOCX в PDF
app.post('/api/convert/docxs-to-pdf', upload.array('files', 10), async (req, res) => {
  try {
    const { files } = req;
    
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'DOCX файлы не загружены' });
    }

    const results = [];
    const errors = [];

    for (const file of files) {
      try {
        console.log(`Конвертируем ${file.originalname} в PDF...`);
        
        const result = await convertWithLibreOffice(
          file.path, 
          'converted', 
          'pdf',
          file.originalname
        );
        
        fs.unlinkSync(file.path);
        const stats = fs.statSync(result.outputPath);

        results.push({
          originalName: Buffer.from(file.originalname, 'latin1').toString('utf8'),
          filename: result.outputFileName,
          downloadUrl: `/converted/${result.outputFileName}`,
          fileSize: stats.size,
          conversionMethod: 'Профессиональная конвертация',
          success: true
        });

      } catch (error) {
        console.error(`Ошибка конвертации ${file.originalname}:`, error);
        errors.push({
          originalName: file.originalname,
          error: error.message
        });
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      }
    }

    res.json({
      success: true,
      results: results,
      errors: errors,
      total: files.length,
      converted: results.length,
      failed: errors.length
    });

  } catch (error) {
    console.error('Ошибка конвертации DOCX файлов:', error);
    res.status(500).json({ error: 'Ошибка при конвертации DOCX файлов' });
  }
});

// Serve React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
}); 