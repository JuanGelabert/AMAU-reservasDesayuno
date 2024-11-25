const mongoose = require('mongoose');

const ReservaSchema = new mongoose.Schema({
    habitacion: { type: Number, required: true },
    nombre: { type: String, required: true },
    apellido: { type: String, required: true },
    fecha: { type: Date, required: true },
    turno: { type: String, required: true },
    menu: { type: String },
    comentarios: { type: String }
});

const Reserva = mongoose.model('Reserva', ReservaSchema);

module.exports = Reserva;
