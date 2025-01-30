const fs = require('fs');
const xlsx = require('xlsx');
const Reserva = require('../models/Reserva');
const { validarHuesped, validarReservaExistente, sanitizarTexto } = require('../services/validaciones');

// Reservas Grupales a partir de Excel
exports.reservarGrupo = async (req, res) => {
  try {
    const filePath = req.file.path;
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    let data = xlsx.utils.sheet_to_json(sheet);

    // Propagar los valores de celdas combinadas
    data = propagarValoresCombinados(data);

    const reservasDias = await Promise.all(data.map(async (row) => {
      if (!row.Ingreso || !row.Salida || !row.Turno || !row.Habitacion || !row.Nombre || !row.Apellido) {
        console.error('Fila omitida debido a campos faltantes:', row);
        return [];
      }

      const ingreso = convertirFechaExcel(row.Ingreso);
      const salida = convertirFechaExcel(row.Salida);

      let menu = '';
      const menuText = row.Menu ? row.Menu.toLowerCase() : '';
      if (menuText.includes("celiaco") || menuText.includes("celiaca") || menuText.includes("sin tacc")) {
        menu = "Sin Tacc";
      } else if (menuText.includes("vegano") || menuText.includes("vegana")) {
        menu = "Vegano";
      }

      // Crear un array para almacenar todas las reservas diarias
      const reservasDiarias = [];
      const duplicados = [];

      for (let fecha = new Date(ingreso); fecha <= salida; fecha.setDate(fecha.getDate() + 1)) {
        const fechaDesayuno = new Date(fecha);

        // Validar Huésped y Reserva para la fecha específica
        const huespedValido = await validarHuesped(row.Habitacion, row.Nombre, row.Apellido, fechaDesayuno);
        if (!huespedValido) {
          console.log(`Huésped ${row.Nombre} ${row.Apellido} en habitación ${row.Habitacion} no válido para la fecha ${fechaDesayuno}`);
          continue;
        }

        const reservaExistente = await validarReservaExistente(row.Habitacion, row.Nombre, row.Apellido, fechaDesayuno);
        if (reservaExistente) {
          console.log(`Ya existe una reserva para el huésped ${row.Nombre} ${row.Apellido} en la fecha ${fechaDesayuno}`);
          duplicados.push({
            habitacion: row.Habitacion,
            nombre: capitalizar(sanitizarTexto(row.Nombre)),
            apellido: capitalizar(sanitizarTexto(row.Apellido)),
            fecha: fechaDesayuno,
            turno: `${row.Turno}:00`,
            menu: menu,
            comentarios: row.Comentarios || ''
          });
          continue;
        }

        // Agregar la reserva diaria al array
        reservasDiarias.push({
          habitacion: row.Habitacion,
          nombre: capitalizar(sanitizarTexto(row.Nombre)),
          apellido: capitalizar(sanitizarTexto(row.Apellido)),
          fecha: fechaDesayuno,
          turno: `${row.Turno}:00`,
          menu: menu,
          comentarios: row.Comentarios || ''
        });
      }

      return { reservasDiarias, duplicados };
    }));

    const reservas = reservasDias.flatMap(result => result.reservasDiarias);
    const duplicados = reservasDias.flatMap(result => result.duplicados);

    if (duplicados.length > 0) {
      // Mostrar alerta de duplicados
      return res.status(400).json({ message: 'Se encontraron reservas duplicadas', duplicados });
    }

    if (reservas.length > 0) {
      try {
        await Reserva.insertMany(reservas, { ordered: false });
      } catch (error) {
        if (error.code === 11000) {
          console.error('Error de duplicado al insertar reservas:', error);
          fs.unlinkSync(filePath); // Eliminar el archivo después de procesarlo
          return res.status(400).json({ message: 'Se encontraron reservas duplicadas durante la inserción', error });
        } else {
          throw error;
        }
      }
      fs.unlinkSync(filePath); // Eliminar el archivo después de procesarlo
      return res.status(200).json({ message: 'Reservas creadas exitosamente' });
    }

    fs.unlinkSync(filePath); // Eliminar el archivo después de procesarlo
    res.status(200).json({ message: 'No se encontraron reservas para crear' });

  } catch (error) {
    console.error('Error al procesar archivo:', error);
    fs.unlinkSync(req.file.path); // Asegurarse de eliminar el archivo en caso de error
    res.status(500).json({ message: 'Error al procesar archivo', error: error.message });
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
          totalSinTacc: {
            $sum: {
              $cond: [
                { $regexMatch: { input: "$menu", regex: /Sin Tacc/i } },
                1,
                0,
              ],
            },
          },
          totalVegano: {
            $sum: {
              $cond: [
                { $regexMatch: { input: "$menu", regex: /Vegano/i } },
                1,
                0,
              ],
            },
          },
          comentarios: { $push: "$comentarios" },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    const totalesDia = await Reserva.aggregate([
      { $match: { fecha: new Date(fecha) } },
      {
        $group: {
          _id: null,
          totalReservas: { $sum: 1 },
          totalSinTacc: {
            $sum: {
              $cond: [
                { $regexMatch: { input: "$menu", regex: /Sin Tacc/i } },
                1,
                0,
              ],
            },
          },
          totalVegano: {
            $sum: {
              $cond: [
                { $regexMatch: { input: "$menu", regex: /Vegano/i } },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);
    const formattedReport = reporte.map((turno) => ({
      turno: turno._id,
      totalReservas: turno.totalReservas,
      totalSinTacc: turno.totalSinTacc,
      totalVegano: turno.totalVegano,
      comentarios: turno.comentarios.filter((comentario) => comentario),
    }));
    res
      .status(200)
      .send({ totalesDia: totalesDia[0], reporte: formattedReport });
  } catch (error) {
    res.status(500).send(error);
  }
};

/** Procesamiento del Excel */
// Función para convertir fechas de Excel a objetos Date
function convertirFechaExcel(fechaExcel) {
  const date = new Date((fechaExcel - 25569) * 86400 * 1000);
  date.setUTCHours(0, 0, 0, 0); // Asegurarse de que la hora sea 00:00:00
  return date;
}

// Propagar valores de celdas combinadas para asegurarse de que cada fila tenga el valor correcto de la celda combinada.
function propagarValoresCombinados(data) {
  let lastHabitacion = null;
  return data.map(row => {
    if (row.Habitacion) {
      lastHabitacion = row.Habitacion;
    } else {
      row.Habitacion = lastHabitacion;
    }
    return row;
  });
}

// Capitaliza la primera letra de cada palabra
const capitalizar = (cadena) => {
  return cadena.split(' ').map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase()).join(' ');
};