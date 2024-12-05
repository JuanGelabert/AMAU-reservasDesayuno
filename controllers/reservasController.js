const Reserva = require('../models/Reserva');
const { validarHuesped, validarReservaExistente } = require('../services/validaciones');

const sanitizarTexto = (str) => {
    return str
        .normalize("NFD") // Normalizan para separar diacríticos
        .replace(/[\u0300-\u036f]/g, "") // Remover diacríticos
        .toLowerCase(); // Convertir a minúscula
};

exports.crearReserva = async (req, res) => {
    const { habitacion, nombre, apellido, fecha, turno, menu, comentarios } = req.body;

    // Validar huésped en la colección `huespedes`
    const huespedValido = await validarHuesped(habitacion, nombre, apellido);
    if (!huespedValido) {
        return res.status(400).send({ message: 'La habitación no está ocupada por la persona indicada.' });
    }

     // Verificar si ya existe una reserva para la fecha seleccionada
    const reservaExistente = await validarReservaExistente(habitacion, nombre, apellido, fecha);
    if (reservaExistente) {
        return res.status(200).send({
            message: 'Ya tienes una reserva para esta fecha.',
            reserva: reservaExistente,
            opciones: ['Modificar Reserva']
        });
    }

    // Crear Reserva
    try {
        const result = await Reserva.updateOne(
            { habitacion, nombre, apellido, fecha },
            { $set: { turno, menu, comentarios } },
            { upsert: true }
        );
        res.status(200).send(result);
    } catch (error) {
        res.status(500).send(error);
    }
};

// Modificar reserva
exports.modificarReserva = async (req, res) => {
    const { id } = req.params;
    const { habitacion, nombre, apellido, fecha, turno, menu, comentarios } = req.body;
    
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
        if (apellido) query.apellido = new RegExp(normalizarCadena(apellido), 'i');
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
}

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
            { $sort: { _id: 1 } } // Ordenar por el campo _id (que es turno) en orden ascendente
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