const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { UPLOAD_LIMITS } = require('../config/constants');

// Configuración de almacenamiento para PDFs
const pdfStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '..', 'libros');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${cleanName}_${Date.now()}${ext}`);
  }
});

// Configuración de almacenamiento para portadas
const imgStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '..', 'img');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `portada_${cleanName}_${Date.now()}${ext}`);
  }
});

const uploadPdf = multer({
  storage: pdfStorage,
  limits: { fileSize: UPLOAD_LIMITS.PDF_MAX_BYTES },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos PDF'));
    }
  }
});

const uploadImg = multer({
  storage: imgStorage,
  limits: { fileSize: UPLOAD_LIMITS.IMAGE_MAX_BYTES },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif)$/i.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'));
    }
  }
});

// POST /api/upload/pdf
router.post('/pdf', uploadPdf.single('pdf'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se envió ningún archivo PDF' });
    }
    const relativeUrl = `libros/${req.file.filename}`;
    res.json({
      message: 'PDF subido exitosamente',
      url: relativeUrl,
      filename: req.file.filename,
      size: req.file.size
    });
  } catch (err) {
    console.error('Error en /api/upload/pdf:', err);
    res.status(500).json({ error: 'Error al procesar archivo' });
  }
});

// POST /api/upload/portada
router.post('/portada', uploadImg.single('imagen'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se envió ninguna imagen' });
    }
    const relativeUrl = `img/${req.file.filename}`;
    res.json({
      message: 'Portada subida exitosamente',
      url: relativeUrl,
      filename: req.file.filename,
      size: req.file.size
    });
  } catch (err) {
    console.error('Error en /api/upload/portada:', err);
    res.status(500).json({ error: 'Error al procesar imagen' });
  }
});

module.exports = router;
