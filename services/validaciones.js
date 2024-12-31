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

// Validar Huesped con la API de Cloudbeds
async function validarHuesped(habitacion, nombre, apellido, fechaDesayuno) {
  try {
    const statuses = ["checked_in", "confirmed"];
    let reservas = [];

    for (const status of statuses) {
      const endpoint = '/getReservations';
      const params = {
        roomName: habitacion,
        status: status,
        includeGuestsDetails: true
      };

      // Consulta la reserva en Cloudbeds por habitación y status
      const response = await realizarSolicitud(endpoint, params);
      if (response && response.data) {
        reservas = reservas.concat(response.data);
      } else {
        console.log(`No se encontraron reservas válidas en Cloudbeds`);
      }
    }

    if (reservas.length === 0) {
      console.error('La respuesta de la API no contiene reservas válidas:');
      return false;
    }

    // Crear un Map para almacenar los huéspedes
    const huespedesMap = new Map();

    reservas.forEach(reserva => {
      if (reserva.guestList) {
        Object.values(reserva.guestList).forEach(guest => {
          const key = `${sanitizarTexto(guest.guestFirstName)}_${sanitizarTexto(guest.guestLastName)}_${guest.roomName}`;
          huespedesMap.set(key, {
            startDate: new Date(reserva.startDate),
            endDate: new Date(reserva.endDate)
          });
        });
      }
    });

    // Crear la clave de búsqueda
    const searchKey = `${sanitizarTexto(nombre)}_${sanitizarTexto(apellido)}_${habitacion}`;

    // Buscar en el Map
    const reserva = huespedesMap.get(searchKey);

    if (reserva) {
      const huespedValido = reserva.startDate < fechaDesayuno && fechaDesayuno <= reserva.endDate;
      return huespedValido;
    } else {
      console.log(`No se encontró una reserva válida para ${nombre} ${apellido} en habitación ${habitacion}`);
      return false;
    }
  } catch (error) {
    console.error('Error al validar el huésped en Cloudbeds:', error.response?.data || error.message);
    return false;
  }
}

// Valida si ya tiene una reserva para el desayuno en la fecha especificada y devuelve la reserva
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
    validarDisponibilidad,
    sanitizarTexto
};