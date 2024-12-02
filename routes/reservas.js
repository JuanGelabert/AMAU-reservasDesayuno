const express = require('express');
const { crearReserva, modificarReserva, generarReporte } = require('../controllers/reservasController');
const { validarDisponibilidad } = require('../services/validaciones');

const router = express.Router();
let bloqueo = {bloquear: false}

//Crear Reserva
router.post('/reservar', crearReserva);

// Modificar Reserva
router.put('/reservar/:id', modificarReserva);

router.get('/reporte', generarReporte);

router.get('/disponibilidad', validarDisponibilidad)

router.get('/bloqueo', (req, res) => {
    res.status(200).json(bloqueo)
})
router.post('/bloqueo', (req, res) => {
    bloqueo.bloquear = req.body.bloquear
    res.status(200).json(bloqueo)
})

module.exports = router;
