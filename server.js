const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('./config/db');
const cors = require('cors');
const reservaRoutes = require('./routes/reservas');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors())
app.use(bodyParser.json());
app.use('/api', reservaRoutes);

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
