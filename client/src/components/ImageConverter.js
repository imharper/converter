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
  Slider,
  Alert,
  CircularProgress,
  Link,
  Chip,
  Grid
} from '@mui/material';
import {
  CloudUpload,
  Download,
  PhotoLibrary
} from '@mui/icons-material';

const ImageConverter = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [outputFormat, setOutputFormat] = useState('png');
  const [quality, setQuality] = useState(90);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      setSelectedFile(file);
      setResult(null);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp', '.tiff', '.webp']
    },
    multiple: false
  });

  const handleConvert = async () => {
    if (!selectedFile) {
      setError('Пожалуйста, выберите файл');
      return;
    }

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('format', outputFormat);
    formData.append('quality', quality);

    try {
      const response = await axios.post('http://localhost:5000/api/convert/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setResult(response.data);
    } catch (error) {
      setError(error.response?.data?.error || 'Ошибка при конвертации');
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

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <PhotoLibrary sx={{ mr: 1 }} />
        Конвертация Изображений
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
        
        {selectedFile ? (
          <Box>
            <Typography variant="h6" color="primary">
              {selectedFile.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formatFileSize(selectedFile.size)}
            </Typography>
            <Chip 
              label={selectedFile.type}
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
                ? 'Отпустите файл здесь...'
                : 'Перетащите изображение сюда или нажмите для выбора'
              }
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Поддерживаемые форматы: JPEG, PNG, GIF, BMP, TIFF, WebP
            </Typography>
          </Box>
        )}
      </Paper>

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
              <MenuItem value="png">PNG</MenuItem>
              <MenuItem value="jpeg">JPEG</MenuItem>
              <MenuItem value="webp">WebP</MenuItem>
              <MenuItem value="avif">AVIF</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <Typography gutterBottom>
            Качество: {quality}%
          </Typography>
          <Slider
            value={quality}
            onChange={(e, newValue) => setQuality(newValue)}
            aria-labelledby="quality-slider"
            valueLabelDisplay="auto"
            step={5}
            marks
            min={10}
            max={100}
          />
        </Grid>
      </Grid>

      {/* Convert Button */}
      <Button
        variant="contained"
        size="large"
        onClick={handleConvert}
        disabled={!selectedFile || isLoading}
        startIcon={isLoading ? <CircularProgress size={20} /> : <CloudUpload />}
        sx={{ mb: 3 }}
      >
        {isLoading ? 'Конвертация...' : 'Конвертировать'}
      </Button>

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Success Result */}
      {result && (
        <Alert severity="success" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Конвертация завершена!
          </Typography>
          {result.originalName && (
            <Typography variant="body2" sx={{ mb: 2 }}>
              <strong>Исходный файл:</strong> {result.originalName} → <strong>Новый файл:</strong> {result.filename}
            </Typography>
          )}
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
    </Box>
  );
};

export default ImageConverter; 