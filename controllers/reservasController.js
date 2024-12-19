const Reserva = require('../models/Reserva');
const { validarHuesped, validarReservaExistente } = require('../services/validaciones');

/**
 * Sanitiza un texto eliminando diacríticos y convirtiéndolo a minúsculas.
 * @param {string} str - El texto a sanitizar.
 * @returns {string} - El texto sanitizado.
 */
const sanitizarTexto = (str) => {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
};

// Crear una nueva reserva
exports.crearReserva = async (req, res) => {
  const { habitacion, nombre, apellido, fecha, turno, menu, comentarios } = req.body;

  // Validar huésped utilizando la API de Cloudbeds
  const huespedValido = await validarHuesped(habitacion, nombre, apellido, new Date(fecha));
  if (!huespedValido) {
    return res.status(400).send({ message: 'La habitación no está ocupada por la persona indicada o la fecha es inválida.' });
  }

  // Verificar si ya existe una reserva para la fecha seleccionada
  try {
    const reservaExistente = await validarReservaExistente(habitacion, nombre, apellido, fecha);

    if (reservaExistente) {
      return res.status(200).send({
        message: 'Ya tienes una reserva para esta fecha.',
        reserva: reservaExistente,
        opciones: ['Modificar Reserva']
      });
    }

    // Si no tiene reserva para la fecha crea una nueva reserva
    const result = await Reserva.updateOne({
        habitacion: habitacion,
        nombre: nombre,
        apellido: apellido,
        fecha
      },
      { $set: { turno, menu, comentarios } },
      { upsert: true });
    
    res.status(200).send(result)
  } catch (error) {
    res.status(500).send(error);
  }
};

// Modificar reserva
exports.modificarReserva = async (req, res) => {
  const { id } = req.params;
  const { habitacion, nombre, apellido, fecha, turno, menu, comentarios } = req.body;

  // Validar huésped utilizando la API de Cloudbeds
  const huespedValido = await validarHuesped(habitacion, nombre, apellido, new Date(fecha));
  if (!huespedValido) {
    return res.status(400).send({ message: 'La habitación no está ocupada por la persona indicada o la fecha es inválida.' });
  }

  try {
    const updatedReserva = await Reserva.findByIdAndUpdate(
      id,
      { habitacion, nombre, apellido, fecha, turno, menu, comentarios },
      { new: true }
    );
    if (!updatedReserva) {
      return res.status(404).send({ message: 'Reserva no encontrada' });
    }
    res.status(200).send(updatedReserva);
  } catch (error) {
    res.status(500).send({ message: 'Error al modificar la reserva', error });
  }
};

// Consultar reserva
exports.consultarReserva = async (req, res) => {
  try {
    const { habitacion, apellido, fecha } = req.query;
    const query = {};
    if (habitacion) query.habitacion = habitacion;
    if (apellido) query.apellido = new RegExp(sanitizarTexto(apellido), 'i');
    if (fecha) {
      const fechaInicio = new Date(new Date(fecha).setUTCHours(0, 0, 0, 0));
      const fechaFin = new Date(new Date(fecha).setUTCHours(23, 59, 59, 999));
      query.fecha = { $gte: fechaInicio, $lte: fechaFin };
    } else {
      query.fecha = { $gte: new Date() }; // Solo futuras reservas si no se proporciona fecha
    }

    const reservas = await Reserva.find().where(query).sort({ fecha: 1 });
    res.json({ reservas });

  } catch (error) {
    console.error('Error al obtener reservas:', error);
    res.status(500).send('Error al obtener reservas');
  }
};
