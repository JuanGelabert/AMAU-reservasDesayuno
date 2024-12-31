const mongoose = require('mongoose');

const ReservaSchema = new mongoose.Schema({
    habitacion: { type: String, required: true },
    nombre: { type: String, required: true },
    apellido: { type: String, required: true },
    fecha: { type: Date, required: true },
    turno: { type: String, required: true },
    menu: { type: String },
    comentarios: { type: String }
});

// Crear un índice único para evitar duplicados
ReservaSchema.index({ habitacion: 1, nombre: 1, apellido: 1, fecha: 1, turno: 1 }, { unique: true });

module.exports = mongoose.model('Reserva', ReservaSchema);
