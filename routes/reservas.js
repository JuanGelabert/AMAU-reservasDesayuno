const express = require('express');
const multer = require('multer');
const { crearReserva, modificarReserva, consultarReserva, reservarGrupo, generarReporte } = require('../controllers/reservasController');
const { validarDisponibilidad } = require('../services/validaciones');
const router = express.Router();
let bloqueo = { bloquear: false }

//Configuración de Multer para guardar archivos
const upload = multer({ dest: 'uploads/'})

// Subir Archivo de Grupos
router.post('/upload', upload.single('file'), reservarGrupo)

// Crear Reserva
router.post('/reservar', crearReserva);

// Modificar Reserva
router.put('/reservar/:id', modificarReserva);

// Consultar Reserva
router.get('/reservas', consultarReserva);

// Generar Reporte
router.get('/reporte', generarReporte);

// Validar Disponibilidad
router.get('/disponibilidad', validarDisponibilidad);

// Bloquear app
router.get('/bloqueo', (req, res) => {
    res.status(200).json(bloqueo)
})
router.post('/bloqueo', (req, res) => {
    bloqueo.bloquear = req.body.bloquear
    res.status(200).json(bloqueo)
})

module.exports = router;
