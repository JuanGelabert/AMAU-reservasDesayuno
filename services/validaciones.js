const Huesped = require('../models/Huesped');
const Reserva = require('../models/Reserva');

// Función para sanitizar los textos y comparar de manera correcta
const sanitizarTexto = (str) => {
    return str
        .normalize("NFD") // Normalizar para separar diacríticos 
        .replace(/[\u0300-\u036f]/g, "") // Remover diacriticos 
        .toLowerCase(); // Convertir a minuscula
}

// Validación de Huesped hospedado en habitación
async function validarHuesped(habitacion, nombre, apellido) {

    try {
        const sanitizedNombre = sanitizarTexto(nombre);
        const sanitizedApellido = sanitizarTexto(apellido);
        
        // Obtener los huéspedes que están hospedados en la habitación
        const huespedes = await Huesped.find({ habitacion, hospedado: true });
        
        // Para cada huésped encontrado, sanitizar nombre y apellido y guardarlo en una nueva variable
        for (let huesped of huespedes) {
            const storedNombre = sanitizarTexto(huesped.nombre);
            const storedApellido = sanitizarTexto(huesped.apellido);

            // Si la consulta coincide con alguno de los huespedes de la habitacion devuelve true
            if (sanitizedNombre === storedNombre && sanitizedApellido === storedApellido) return true
        }

        return false;
    } catch (error) {
        return false;
    }
}

// Validación de reserva existente
async function validarReservaExistente(habitacion, nombre, apellido, fecha) {
    try {
        const reserva = await Reserva.findOne({ habitacion, nombre, apellido, fecha });
        return reserva;
    } catch (error) {
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

// // Función para validar huésped con la API de Cloudbeds
// async function validarHuesped(habitacion, nombre, apellido) {
//     try {
//         const response = await axios.get(`https://api.cloudbeds.com/v1/room/${habitacion}`, {
//             headers: { 'Authorization': `Bearer ${process.env.CLOUDBEDS_API_TOKEN}` }
//         });
//         const huespedes = response.data.huespedes;
//         return huespedes.some(huesped => huesped.nombre === nombre && huesped.apellido === apellido);
//     } catch (error) {
//         console.error('Error al validar huésped con Cloudbeds:', error);
//         return false;
//     }
// }

module.exports = {
    validarHuesped,
    validarReservaExistente,
    validarDisponibilidad
};