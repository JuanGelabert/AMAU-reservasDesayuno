import React, { useState } from 'react';
import axios from 'axios';
import moment from 'moment';
import 'moment/locale/es';
import ResultadoReserva from './ResultadoReserva';
import './styles.css'; // Importar el archivo de estilos

function BuscarReservas() {
  const [habitacion, setHabitacion] = useState('');
  const [fecha, setFecha] = useState('');
  const [reservas, setReservas] = useState([]);

  // Capitaliza la primera letra de cada palabra
  const capitalizar = (cadena) => {
    return cadena.split(' ').map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase()).join(' ');
  };

  // Maneja el cambio en el campo de habitación
  const handleChangeHabitacion = (event) => {
    setHabitacion(event.target.value);
  };

  // Maneja el cambio en el campo de fecha
  const handleChangeFecha = (event) => {
    setFecha(event.target.value);
  };

  // Maneja la búsqueda de reservas
  const handleBuscar = (event) => {
    event.preventDefault();

    // Construir la URL de búsqueda basada en los parámetros ingresados
    let url = 'http://localhost:3000/api/reservas?';
    if (habitacion) url += `habitacion=${habitacion}&`;
    if (fecha) url += `fecha=${fecha}&`;

    axios.get(url)
      .then(response => {
        moment.locale('es');
        const reservasFiltradas = response.data.reservas
          .map(reserva => ({
            ...reserva,
            nombre: capitalizar(reserva.nombre),
            apellido: capitalizar(reserva.apellido),
            fecha: moment(reserva.fecha).utc().format('ddd DD/MM').replace('.', '').replace(/^\w/, c => c.toUpperCase()) // Formatear fecha
          }));

        setReservas(reservasFiltradas);
      })
      .catch(error => {
        console.error('Error fetching reservas:', error);
      });
  };

  return (
    <div className="container">
      <h2 className="title text-center">Buscar Reserva</h2>
      <form onSubmit={handleBuscar} className="space-y-2">
        <div>
          <label className="block font-semibold text-gray-700">Habitación:</label>
          <input type="number" value={habitacion} onChange={handleChangeHabitacion} className="w-full p-2 border rounded" />
        </div>
        <div>
          <label className="block font-semibold text-gray-700">Fecha:</label>
          <input type="date" value={fecha} onChange={handleChangeFecha} className="w-full p-2 border rounded" />
        </div>
        <button type="submit" className="btn">Buscar</button>
      </form>

      {reservas.length > 0 && (
        <div className="mt-6">
          <h3 className="text-xl font-semibold mb-2 text-center">Resultados de la Búsqueda</h3>
          <div className="grid grid-cols-1 gap-4">
            {reservas.map((reserva, index) => (
              <ResultadoReserva key={index} reserva={reserva} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default BuscarReservas;
