const mongoose = require('mongoose');

const HuespedSchema = new mongoose.Schema({
    habitacion: { type: Number, required: true },
    nombre: { type: String, required: true },
    apellido: { type: String, required: true },
    hospedado: { type: Boolean, required: true }
}, { collection: 'huespedes' });

const Huesped = mongoose.model('Huesped', HuespedSchema);

module.exports = Huesped;
