import React, { useState } from 'react';
import axios from 'axios';
import moment from 'moment';
import 'moment/locale/es';
import ReporteTurno from './ReporteTurno';
import './styles.css'; // Importar el archivo de estilos

const ReporteDiario = () => {
  const [fecha, setFecha] = useState('');
  const [resumen, setResumen] = useState({
    totalReservas: 0,
    totalSinTacc: 0,
    totalVegano: 0
  });
  const [turnos, setTurnos] = useState([]);

  // Maneja el cambio en el campo de fecha
  const handleChangeFecha = (event) => {
    setFecha(event.target.value);
  };

  // Maneja la generación del reporte diario
  const handleGenerarReporte = (event) => {
    event.preventDefault();

    axios.get(`http://localhost:3000/api/reservas?fecha=${fecha}`)
      .then(response => {
        moment.locale('es');
        const reservas = response.data.reservas.map(reserva => ({
          ...reserva,
          fecha: moment(reserva.fecha).format('ddd DD/MM/YYYY').replace('.', '').replace(/^\w/, c => c.toUpperCase())
        }));

        const totalReservas = reservas.length;
        const totalSinTacc = reservas.filter(reserva => reserva.menu.toLowerCase().includes('sin tacc')).length;
        const totalVegano = reservas.filter(reserva => reserva.menu.toLowerCase().includes('vegano')).length;

        setResumen({
          totalReservas,
          totalSinTacc,
          totalVegano
        });

        // Agrupar reservas por turnos
        const turnosAgrupados = reservas.reduce((acc, reserva) => {
          if (!acc[reserva.turno]) {
            acc[reserva.turno] = [];
          }
          acc[reserva.turno].push(reserva);
          return acc;
        }, {});

        // Convertir a array de turnos
        const turnosArray = Object.keys(turnosAgrupados).map(turno => ({
          turno,
          reservas: turnosAgrupados[turno]
        }));

        setTurnos(turnosArray);
      })
      .catch(error => {
        console.error('Error fetching reservas:', error);
      });
  };

  return (
    <div className="container">
      <h2 className="title text-center">Reporte diario</h2>
      <form onSubmit={handleGenerarReporte} className="space-y-2">
        <div className='my-9'>
          <label className="block text-gray-700 font-semibold">Fecha:</label>
          <input type="date" value={fecha} onChange={handleChangeFecha} className="w-full p-2 border rounded" />
        </div>
        <button type="submit" className="btn">Generar Reporte</button>
      </form>

      {resumen.totalReservas > 0 && (
        <div className="mt-6">
          <h3 className="text-xl font-semibold mb-2">Reporte del Día</h3>
          <p><strong>Total Reservas:</strong> {resumen.totalReservas}</p>
          <p><strong>Total Sin TACC:</strong> {resumen.totalSinTacc}</p>
          <p><strong>Total Vegano:</strong> {resumen.totalVegano}</p>
        </div>
      )}

      {turnos.length > 0 && (
        <div className="mt-6">
          <h3 className="text-xl font-semibold mb-2">Reporte por Turnos</h3>
          <div className="grid grid-cols-1 gap-4">
            {turnos.map((turnoData, index) => (
              <ReporteTurno key={index} turnoData={turnoData} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReporteDiario;
