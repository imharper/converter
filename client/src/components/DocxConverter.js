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
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import { 
  Download, 
  Description, 
  CheckCircle, 
  CloudUpload,
  Error as ErrorIcon,
  PictureAsPdf
} from '@mui/icons-material';

const DocxConverter = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [outputFormat, setOutputFormat] = useState('pdf');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    const validFiles = acceptedFiles.filter(file => 
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.type === 'application/msword'
    );
    
    if (validFiles.length === 0) {
      setError('Пожалуйста, выберите DOCX файлы');
      return;
    }

    setSelectedFiles(validFiles);
    setResult(null);
    setError(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc']
    },
    multiple: true
  });

  const handleConvert = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      setError('Пожалуйста, выберите DOCX файлы');
      return;
    }

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    
    try {
      let response;
      let endpoint;

      if (outputFormat === 'pdf' && selectedFiles.length > 1) {
        // Множественная конвертация DOCX в PDF
        selectedFiles.forEach(file => {
          formData.append('files', file);
        });
        
        endpoint = 'http://localhost:5000/api/convert/docxs-to-pdf';
        
        response = await axios.post(endpoint, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else if (outputFormat === 'pdf') {
        // Одиночная конвертация DOCX в PDF
        formData.append('file', selectedFiles[0]);
        endpoint = 'http://localhost:5000/api/convert/docx-to-pdf';
        
        response = await axios.post(endpoint, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        // Для HTML/TXT используем старый endpoint
        formData.append('file', selectedFiles[0]);
        formData.append('format', outputFormat);
        endpoint = 'http://localhost:5000/api/convert/docx';
        
        response = await axios.post(endpoint, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      setResult(response.data);
    } catch (error) {
      setError(error.response?.data?.error || 'Ошибка при конвертации DOCX');
      if (error.response?.data?.suggestion) {
        setError(error.response.data.error + '. ' + error.response.data.suggestion);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = (url, filename) => {
    const link = document.createElement('a');
    link.href = `http://localhost:5000${url}`;
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

  const getConvertButtonText = () => {
    if (isLoading) {
      if (selectedFiles.length > 1) {
        return `Конвертируем ${selectedFiles.length} файлов...`;
      }
      return 'Выполняется конвертация...';
    }
    
    const fileText = selectedFiles.length > 1 ? `${selectedFiles.length} файлов` : 'файл';
    return `Конвертировать ${fileText} в ${outputFormat.toUpperCase()}`;
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <Description sx={{ mr: 1 }} />
        Конвертация DOCX
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
              label="DOCX"
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
                ? 'Отпустите DOCX файлы здесь...'
                : 'Перетащите DOCX файлы сюда или нажмите для выбора'
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
                    <Description color="primary" />
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
              <MenuItem value="pdf">PDF (высокое качество)</MenuItem>
              <MenuItem value="html">HTML</MenuItem>
              <MenuItem value="txt">Текст</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        {outputFormat === 'pdf' && (
          <Grid item xs={12} sm={6}>
            <Alert severity="success" sx={{ mt: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PictureAsPdf sx={{ mr: 1 }} />
                Максимальное сохранение форматирования
              </Box>
            </Alert>
          </Grid>
        )}
      </Grid>

      {/* Convert Button */}
      <Button
        variant="contained"
        size="large"
        onClick={handleConvert}
        disabled={!selectedFiles.length || isLoading}
        startIcon={isLoading ? <CircularProgress size={20} /> : <Description />}
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

      {/* Success Result for Single File */}
      {result && !result.results && (
        <Alert severity="success" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <CheckCircle sx={{ mr: 1, color: 'success.main' }} />
            DOCX успешно конвертирован!
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
                {result.fileSize && (
                  <Typography variant="body2">
                    <strong>Размер:</strong> {formatFileSize(result.fileSize)}
                  </Typography>
                )}
              </Box>
            </Grid>
            {result.conversionMethod && (
              <Grid item xs={12} sm={6}>
                <Box sx={{ p: 2, bgcolor: 'success.50', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Качество конвертации:
                  </Typography>
                  <Typography variant="body2">
                    <strong>Метод:</strong> {result.conversionMethod}
                  </Typography>
                  {result.quality && (
                    <Typography variant="body2" sx={{ color: 'success.main' }}>
                      <strong>{result.quality}</strong>
                    </Typography>
                  )}
                </Box>
              </Grid>
            )}
          </Grid>

          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={() => handleDownload(result.downloadUrl, result.filename)}
            sx={{ mt: 1 }}
          >
            Скачать {result.filename}
          </Button>
          
          {result.warnings && result.warnings.length > 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography variant="body2">
                Предупреждения при конвертации: {result.warnings.length}
              </Typography>
            </Alert>
          )}
        </Alert>
      )}
    </Box>
  );
};

export default DocxConverter; 