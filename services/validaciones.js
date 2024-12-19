require('dotenv').config();
const Reserva = require('../models/Reserva');
const { realizarSolicitud } = require('../config/cloudbeds');

// Función para sanitizar los textos y comparar de manera correcta
const sanitizarTexto = (str) => {
    return str
        .normalize("NFD") // Normalizar para separar diacríticos 
        .replace(/[\u0300-\u036f]/g, "") // Remover diacriticos 
        .toLowerCase(); // Convertir a minuscula
}

/** 
    * Valida si un huésped está alojado en una habitación en una fecha específica.
    * @param {string} habitacion - Número de habitación.
    * @param {string} nombre - Nombre del huésped.
    * @param {string} apellido - Apellido del huésped. 
    * @param {Date} fechaDesayuno - Fecha del desayuno.
    * @returns {boolean} - Verdadero si el huésped está alojado y la fecha es válida, falso en caso contrario.
 */

async function validarHuesped(habitacion, nombre, apellido, fechaDesayuno) {
    try {
        const endpoint = '/getReservations';
        const params = {
            roomName: habitacion,
            status: "checked_in",
            includeGuestsDetails: true
        };

        // Consulta la reserva en Cloudbeds por habitación y status
        const response = await realizarSolicitud(endpoint, params);
        reservas = response.data

        // En la reserva encontrada se validan habitacion, nombre, apellido y fecha
        const huespedValido = reservas.some(reserva => {
            return Object.values(reserva.guestList).some(guest => {
                return sanitizarTexto(guest.guestFirstName) === sanitizarTexto(nombre) &&
                    sanitizarTexto(guest.guestLastName) === sanitizarTexto(apellido) &&
                    guest.roomName === habitacion &&
                    new Date(reserva.startDate) < fechaDesayuno && fechaDesayuno <= new Date(reserva.endDate);
            });
        });

        return huespedValido;
    } catch (error) {
        console.error('Error al validar el huésped en Cloudbeds:', error.response?.data || error.message);
        return false;
    }
}

// Valida si ya tiene una reserva para el desayuno en la fecha especificada
async function validarReservaExistente(habitacion, nombre, apellido, fecha) {
    try {
        const reserva = await Reserva.findOne({
            habitacion,
            nombre: sanitizarTexto(nombre),
            apellido: sanitizarTexto(apellido),
            fecha
        });

        return reserva;
    } catch (error) {
        console.log("Error al validar la reserva", error);
        return null;
    }
}

// Validación de disponibilidad de turnos por fecha
async function validarDisponibilidad(req, res) {
    const { fecha } = req.query
    const cupo = 24 // Máximo 24 cupos por turno

    try {
        const reservas = await Reserva.aggregate([
            { $match: { fecha: new Date(fecha) } },
            {
                $group: {
                    _id: "$turno",
                    count: { $sum: 1 }
                }
            }
        ])

        const disponibilidad = reservas.reduce((acc, turno) => {
            acc[turno._id] = cupo - turno.count;
            return acc;
        }, {})
        
        res.status(200).json(disponibilidad)
    } catch (error) {
        console.log('Error al obtener la disponibilidad: ', error);
        res.status(500).send(error)
    }
}

module.exports = {
    validarHuesped,
    validarReservaExistente,
    validarDisponibilidad
};