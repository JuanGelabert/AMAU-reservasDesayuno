// Importar mongoose y dotenv
const mongoose = require('mongoose');
require('dotenv').config();

// URL de conexión a MongoDB
const dbURI = process.env.MONGO_URI;

// Opciones de conexión
const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
};

// Conectar a MongoDB
mongoose.connect(dbURI)
    .then(() => console.log('Conectado a MongoDB'))
    .catch((err) => console.error('Error al conectar a MongoDB', err));

// Exportar la conexión
module.exports = mongoose;
