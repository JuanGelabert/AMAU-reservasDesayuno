const fs = require('fs');
const xlsx = require('xlsx');
const Reserva = require('../models/Reserva');
const { realizarSolicitud } = require('../config/cloudbeds');

const sanitizarTexto = (str) => {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
};

// Reservas Grupales a partir de Excel
exports.reservarGrupo = async (req, res) => {
  try {
    const file = req.file;
    const workbook = xlsx.readFile(file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    let lastHabitacion = null;

    const reservas = await Promise.all(data.flatMap(async (row) => {
      if (!row.Nombre || !row.Apellido || !row.Ingreso || !row.Salida || !row.Turno) {
        console.error('Fila omitida debido a campos faltantes:', row);
        return [];
      }

      if (row.Habitacion) {
        lastHabitacion = row.Habitacion;
      } else {
        row.Habitacion = lastHabitacion;
      }

      const ingreso = new Date((row.Ingreso - 25569) * 86400 * 1000);
      const salida = new Date((row.Salida - 25569) * 86400 * 1000);

      const fechaDesayuno = new Date();

      // Consultar las reservas del huésped en la habitación
      const endpoint = `/properties/${process.env.CLOUDBEDS_PROPERTY_ID}/reservations`;
      const params = {
        start_date: ingreso.toISOString().split('T')[0],
        end_date: salida.toISOString().split('T')[0]
      };
      const reservasHuesped = await realizarSolicitud(endpoint, params);

      const reservaValida = reservasHuesped.reservations.find(reserva => 
        reserva.roomNumber === row.Habitacion &&
        reserva.sanitizarTexto(guestFirstName) === sanitizarTexto(row.Nombre) &&
        reserva.sanitizarTexto(guestLastName) === sanitizarTexto(row.Apellido) &&
        ['confirmed', 'checked_in', 'pending'].includes(reserva.status.toLowerCase()) &&
        new Date(reserva.checkIn) < fechaDesayuno &&
        fechaDesayuno <= new Date(reserva.checkOut)
      );

      if (!reservaValida) {
        console.error('Huésped no válido para la fecha:', row.Nombre, row.Apellido);
        return [];
      }

      const reservasDias = await Promise.all([...Array((salida - ingreso) / (1000 * 60 * 60 * 24) + 1).keys()].map(async i => {
        const fecha = new Date(ingreso);
        fecha.setDate(fecha.getDate() + i);

        const menuText = (row.Menu || '').toLowerCase();
        const menu = menuText.includes('celiaco') ||
          menuText.includes('celiaca') ||
          menuText.includes('sin tacc') ? 'Sin Tacc' :
          menuText.includes('vegano') ||
          menuText.includes('vegana') ? 'Vegano' : '';

        const reservaExistente = await Reserva.findOne({
          habitacion: row.Habitacion,
          nombre: row.Nombre,
          apellido: row.Apellido,
          fecha: fecha,
        });
        if (reservaExistente) {
          console.log('Reserva ya existe para:', row.Nombre, row.Apellido, fecha);
          return null;
        }

        return {
          habitacion: row.Habitacion,
          nombre: row.Nombre,
          apellido: row.Apellido,
          fecha: fecha,
          turno: row.Turno,
          menu: menu
        };
      }));

      return reservasDias.filter(reserva => reserva);
    }));

    if (reservas.length > 0) {
      await Reserva.insertMany(reservas.flat());
    }

    fs.unlinkSync(file.path); // Eliminar el archivo después de procesarlo
    res.status(200).json({ message: 'Reservas creadas exitosamente' });
  } catch (error) {
    console.error('Error al procesar archivo:', error);
    res.status(500).json({ message: 'Error al procesar archivo' });
  }
};

// Generar Reporte
exports.generarReporte = async (req, res) => {
  const { fecha } = req.query;

  try {
    const reporte = await Reserva.aggregate([
      { $match: { fecha: new Date(fecha) } },
      {
        $group: {
          _id: "$turno",
          totalReservas: { $sum: 1 },
          totalSinTacc: { $sum: { $cond: [{ $regexMatch: { input: "$menu", regex: /Sin Tacc/i } }, 1, 0] } },
          totalVegano: { $sum: { $cond: [{ $regexMatch: { input: "$menu", regex: /Vegano/i } }, 1, 0] } },
          comentarios: { $push: "$comentarios" }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    const totalesDia = await Reserva.aggregate([
      { $match: { fecha: new Date(fecha) } },
      {
        $group: {
          _id: null,
          totalReservas: { $sum: 1 },
          totalSinTacc: { $sum: { $cond: [{ $regexMatch: { input: "$menu", regex: /Sin Tacc/i } }, 1, 0] } },
          totalVegano: { $sum: { $cond: [{ $regexMatch: { input: "$menu", regex: /Vegano/i } }, 1, 0] } }
        }
      }
    ]);
    const formattedReport = reporte.map(turno => ({
      turno: turno._id,
      totalReservas: turno.totalReservas,
      totalSinTacc: turno.totalSinTacc,
      totalVegano: turno.totalVegano,
      comentarios: turno.comentarios.filter(comentario => comentario)
    }));
    res.status(200).send({ totalesDia: totalesDia[0], reporte: formattedReport });
  } catch (error) {
    res.status(500).send(error);
  }
};