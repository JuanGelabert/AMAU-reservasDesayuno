import React, { useState } from 'react';
import axios from 'axios';
import { isFuture, isSameDay } from 'date-fns';
import moment from 'moment';
import 'moment/locale/es';

function BuscarReservas() {
  const [habitacion, setHabitacion] = useState('');
  const [fecha, setFecha] = useState('');
  const [reservas, setReservas] = useState([]);

  const capitalizar = (cadena) => {
    return cadena.split(' ').map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase()).join(' ');
  };

  const handleChangeHabitacion = (event) => {
    setHabitacion(event.target.value);
  };

  const handleChangeFecha = (event) => {
    setFecha(event.target.value);
  };

  const handleBuscar = (event) => {
    event.preventDefault();

    // Construir la URL de búsqueda basada en los parámetros ingresados
    let url = 'http://localhost:3000/api/reservas?';
    if (habitacion) url += `habitacion=${habitacion}&`;
    if (fecha) url += `fecha=${fecha}&`;

    axios.get(url)
      .then(response => {
        moment.locale('es');
        const hoy = new Date();
        const reservasFiltradas = response.data.reservas
          .filter(reserva => {
            const fechaReserva = reserva.fecha;
            return (isFuture(fechaReserva) || isSameDay(fechaReserva, hoy));
          })
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
    <div className="mb-6">
      <h3 className="text-xl font-semibold mb-2">Buscar Reservas</h3>
      <form onSubmit={handleBuscar} className="space-y-2">
        <div>
          <label className="block text-gray-700">Habitación:</label>
          <input type="number" value={habitacion} onChange={handleChangeHabitacion} className="w-full p-2 border rounded" />
        </div>
        <div>
          <label className="block text-gray-700">Fecha:</label>
          <input type="date" value={fecha} onChange={handleChangeFecha} className="w-full p-2 border rounded" />
        </div>
        <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded">Buscar</button>
      </form>
      
      {reservas.length > 0 && (
        <div className="mt-6">
          <h3 className="text-xl font-semibold mb-2 text-center">Resultados de la Búsqueda</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reservas.map((reserva, index) => (
              <div key={index} className="p-4 bg-white border rounded border-gray-300 shadow">
                <h4><strong>Fecha:</strong> {reserva.fecha}</h4>
                <p><strong>Habitación:</strong> {reserva.habitacion}</p>
                <p><strong>Nombre:</strong> {reserva.nombre}</p>
                <p><strong>Apellido:</strong> {reserva.apellido}</p>
                <p><strong>Turno:</strong> {reserva.turno} hs</p>
                <p><strong>Menú:</strong> {reserva.menu}</p>
                <p><strong>Comentarios:</strong> {reserva.comentarios}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default BuscarReservas;