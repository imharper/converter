import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import {
  Box,
  Typography,
  Paper,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Chip,
  Grid,
  Card,
  CardContent,
  CardActions,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import {
  Download,
  PictureAsPdf,
  Photo,
  Description,
  CheckCircle,
  Error as ErrorIcon,
  CloudUpload
} from '@mui/icons-material';

const PdfConverter = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [outputFormat, setOutputFormat] = useState('docx');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [conversionProgress, setConversionProgress] = useState(0);

  const API_BASE_URL = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:5000/api' 
    : '/api';

  const onDrop = useCallback((acceptedFiles) => {
    const pdfFiles = acceptedFiles.filter(file => file.type === 'application/pdf');
    if (pdfFiles.length === 0) {
      setError('Пожалуйста, выберите PDF файлы');
      return;
    }

    setSelectedFiles(pdfFiles);
    setResult(null);
    setError(null);
    setConversionProgress(0);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: true
  });

  const handleConvert = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      setError('Пожалуйста, выберите PDF файлы');
      return;
    }

    setIsLoading(true);
    setError(null);
    setConversionProgress(0);

    const formData = new FormData();


    try {
      let response;
      let endpoint;

      if (selectedFiles.length > 1) {
        // Множественная конвертация
        selectedFiles.forEach(file => {
          formData.append('files', file);
        });
        formData.append('format', outputFormat);

        if (outputFormat === 'docx') {
          endpoint = `${API_BASE_URL}/convert/pdfs-to-docx`;
        } else {
          // Для изображений пока используем по одному файлу
          endpoint = `${API_BASE_URL}/convert/pdf-to-image`;
        }

        // Симуляция прогресса для множественной конвертации
        const progressInterval = setInterval(() => {
          setConversionProgress(prev => {
            if (prev < 85) return prev + 5;
            return prev;
          });
        }, 1000);

        response = await axios.post(endpoint, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        clearInterval(progressInterval);
        setConversionProgress(100);
      } else {
        // Одиночная конвертация
        formData.append('file', selectedFiles[0]);
        formData.append('format', outputFormat);

        if (outputFormat === 'docx') {
          endpoint = `${API_BASE_URL}/convert/pdf-to-docx`;
          
          const progressInterval = setInterval(() => {
            setConversionProgress(prev => {
              if (prev < 85) return prev + 15;
              return prev;
            });
          }, 800);

          response = await axios.post(endpoint, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });

          clearInterval(progressInterval);
          setConversionProgress(100);
        } else {
          endpoint = `${API_BASE_URL}/convert/pdf-to-image`;
          response = await axios.post(endpoint, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
        }
      }

      setResult(response.data);
    } catch (error) {
      setError(error.response?.data?.error || 'Ошибка при конвертации PDF');
      if (error.response?.data?.suggestion) {
        setError(error.response.data.error + '. ' + error.response.data.suggestion);
      }
    } finally {
      setIsLoading(false);
      setConversionProgress(0);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getConvertButtonText = () => {
    if (isLoading) {
      if (selectedFiles.length > 1) {
        return `Конвертируем ${selectedFiles.length} файлов...`;
      }
      return 'Выполняется конвертация...';
    }
    
    const fileText = selectedFiles.length > 1 ? `${selectedFiles.length} файлов` : 'файл';
    if (outputFormat === 'docx') return `Конвертировать ${fileText} в DOCX`;
    return `Конвертировать ${fileText} в изображения`;
  };

  const getConvertButtonIcon = () => {
    if (isLoading) return <CircularProgress size={20} />;
    if (outputFormat === 'docx') return <Description />;
    return <Photo />;
  };

  const handleDownload = (url, filename) => {
    const link = document.createElement('a');
    link.href = `${API_BASE_URL}${url}`;
    link.download = filename;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const removeFile = (index) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <PictureAsPdf sx={{ mr: 1 }} />
        Конвертация PDF
      </Typography>

      {/* Drag and Drop Area */}
      <Paper
        {...getRootProps()}
        sx={{
          p: 4,
          mb: 3,
          textAlign: 'center',
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'grey.300',
          bgcolor: isDragActive ? 'action.hover' : 'background.paper',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          '&:hover': {
            borderColor: 'primary.main',
            bgcolor: 'action.hover'
          }
        }}
      >
        <input {...getInputProps()} />
        <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
        
        {selectedFiles.length > 0 ? (
          <Box>
            <Typography variant="h6" color="primary">
              {selectedFiles.length === 1 
                ? selectedFiles[0].name 
                : `${selectedFiles.length} файлов выбрано`
              }
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedFiles.length === 1 
                ? formatFileSize(selectedFiles[0].size)
                : `Общий размер: ${formatFileSize(selectedFiles.reduce((sum, file) => sum + file.size, 0))}`
              }
            </Typography>
            <Chip 
              label="PDF"
              color="primary"
              variant="outlined"
              size="small"
              sx={{ mt: 1 }}
            />
          </Box>
        ) : (
          <Box>
            <Typography variant="h6" gutterBottom>
              {isDragActive
                ? 'Отпустите PDF файлы здесь...'
                : 'Перетащите PDF файлы сюда или нажмите для выбора'
              }
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Можно выбрать один или несколько файлов (до 10)
            </Typography>
          </Box>
        )}
      </Paper>

      {/* File list for multiple files */}
      {selectedFiles.length > 1 && (
        <Paper sx={{ mb: 3, maxHeight: 300, overflow: 'auto' }}>
          <List>
            {selectedFiles.map((file, index) => (
              <React.Fragment key={index}>
                <ListItem>
                  <ListItemIcon>
                    <PictureAsPdf color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={file.name}
                    secondary={formatFileSize(file.size)}
                  />
                  <Button
                    size="small"
                    color="error"
                    onClick={() => removeFile(index)}
                  >
                    Удалить
                  </Button>
                </ListItem>
                {index < selectedFiles.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}

      {/* Conversion Settings */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Формат вывода</InputLabel>
            <Select
              value={outputFormat}
              label="Формат вывода"
              onChange={(e) => setOutputFormat(e.target.value)}
            >
              <MenuItem value="docx">DOCX (документ)</MenuItem>
              <MenuItem value="png">PNG (изображения)</MenuItem>
              <MenuItem value="jpeg">JPEG (изображения)</MenuItem>
              <MenuItem value="jpg">JPG (изображения)</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Progress Bar for conversion */}
      {isLoading && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" gutterBottom>
            Обработка {selectedFiles.length > 1 ? 'файлов' : 'файла'}: {conversionProgress}%
          </Typography>
          <LinearProgress variant="determinate" value={conversionProgress} />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {outputFormat === 'docx' 
              ? 'Конвертируем страницы в изображения и создаем DOCX с полным сохранением внешнего вида...'
              : 'Конвертируем страницы в изображения...'
            }
          </Typography>
        </Box>
      )}

      {/* Convert Button */}
      <Button
        variant="contained"
        size="large"
        onClick={handleConvert}
        disabled={!selectedFiles.length || isLoading}
        startIcon={getConvertButtonIcon()}
        sx={{ mb: 3 }}
      >
        {getConvertButtonText()}
      </Button>

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Success Result for Multiple Files */}
      {result && result.results && (
        <Box>
          <Alert severity="success" sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <CheckCircle sx={{ mr: 1, color: 'success.main' }} />
              Конвертация завершена! {result.converted} из {result.total} файлов успешно
            </Typography>
          </Alert>
          
          {/* Results */}
          {result.results.length > 0 && (
            <Paper sx={{ mb: 3, p: 2 }}>
              <Typography variant="h6" gutterBottom color="success.main">
                Успешно конвертированы:
              </Typography>
              <Grid container spacing={2}>
                {result.results.map((file, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Card variant="outlined">
                      <CardContent sx={{ pb: 1 }}>
                        <Typography variant="body2" noWrap title={file.originalName}>
                          <strong>{file.originalName}</strong>
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          → {file.filename}
                        </Typography>
                        {file.fileSize && (
                          <Typography variant="caption" display="block">
                            {formatFileSize(file.fileSize)}
                          </Typography>
                        )}
                      </CardContent>
                      <CardActions>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Download />}
                          onClick={() => handleDownload(file.downloadUrl, file.filename)}
                          fullWidth
                        >
                          Скачать
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          )}

          {/* Errors */}
          {result.errors && result.errors.length > 0 && (
            <Paper sx={{ mb: 3, p: 2 }}>
              <Typography variant="h6" gutterBottom color="error.main">
                Ошибки конвертации:
              </Typography>
              <List dense>
                {result.errors.map((error, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <ErrorIcon color="error" />
                    </ListItemIcon>
                    <ListItemText
                      primary={error.originalName}
                      secondary={error.error}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}
        </Box>
      )}

      {/* Success Result for Single File DOCX */}
      {result && !result.results && outputFormat === 'docx' && (
        <Alert severity="success" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <CheckCircle sx={{ mr: 1, color: 'success.main' }} />
            PDF успешно конвертирован в DOCX!
          </Typography>
          
          <Grid container spacing={2} sx={{ mt: 1, mb: 2 }}>
            <Grid item xs={12} sm={6}>
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Информация о файле:
                </Typography>
                <Typography variant="body2">
                  <strong>Исходный:</strong> {result.originalName}
                </Typography>
                <Typography variant="body2">
                  <strong>Новый:</strong> {result.filename}
                </Typography>
                <Typography variant="body2">
                  <strong>Размер:</strong> {formatFileSize(result.fileSize)}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ p: 2, bgcolor: 'success.50', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Статистика конвертации:
                </Typography>
                {result.statistics && (
                  <>
                    <Typography variant="body2">
                      <strong>Страниц:</strong> {result.statistics.pages}
                    </Typography>
                    {result.statistics.images && (
                      <Typography variant="body2">
                        <strong>Изображений:</strong> {result.statistics.images}
                      </Typography>
                    )}
                    {result.statistics.paragraphs && (
                      <Typography variant="body2">
                        <strong>Параграфов:</strong> {result.statistics.paragraphs}
                      </Typography>
                    )}
                    {result.statistics.headings && (
                      <Typography variant="body2">
                        <strong>Заголовков:</strong> {result.statistics.headings}
                      </Typography>
                    )}
                    {result.statistics.characters && (
                      <Typography variant="body2">
                        <strong>Символов:</strong> {result.statistics.characters?.toLocaleString()}
                      </Typography>
                    )}
                  </>
                )}
                <Typography variant="body2" sx={{ color: 'success.main' }}>
                  <strong>{result.quality}</strong>
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={() => handleDownload(result.downloadUrl, result.filename)}
            sx={{ mt: 1 }}
          >
            Скачать {result.filename}
          </Button>
        </Alert>
      )}

      {/* Success Result for Images */}
      {result && result.pages && (
        <Box>
          <Alert severity="success" sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Конвертация завершена! Создано {result.totalPages} изображений
            </Typography>
            <Typography variant="body2">
              Исходный файл: {result.originalName}
            </Typography>
          </Alert>
          
          <Typography variant="h6" gutterBottom>
            Скачать страницы:
          </Typography>
          
          <Grid container spacing={2}>
            {result.pages?.map((page, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card>
                  <CardContent>
                    <Typography variant="body1">
                      Страница {page.page}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Download />}
                      onClick={() => handleDownload(page.url, `страница_${page.page}.${outputFormat}`)}
                      fullWidth
                    >
                      Скачать
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );
};

export default PdfConverter; 