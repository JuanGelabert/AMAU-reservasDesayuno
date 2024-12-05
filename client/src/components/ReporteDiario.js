import React, { useState } from 'react';
import axios from 'axios';
import ReporteTurno from './ReporteTurno'

function ReporteDiario() {
  const [fecha, setFecha] = useState('');
  const [totalesDia, setTotalesDia] = useState(null);
  const [reporte, setReporte] = useState([]);

  const handleChangeFecha = (event) => {
    setFecha(event.target.value);
  };

  const handleReporte = (event) => {
    event.preventDefault();
    axios.get(`http://localhost:3000/api/reporte?fecha=${fecha}`)
      .then(response => {
        setTotalesDia(response.data.totalesDia);
        setReporte(response.data.reporte);
      })
      .catch(error => {
        console.error('Error fetching reporte:', error);
      });
  };

  return (
    <div className="mb-6">
      <h3 className="text-xl font-semibold mb-2">Reporte Diario</h3>
      <form onSubmit={handleReporte} className="space-y-4">
        <div>
          <label className="block text-gray-700">Fecha:</label>
          <input type="date" value={fecha} onChange={handleChangeFecha} required className="w-full p-2 border rounded" />
        </div>
        <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded">Generar Reporte</button>
      </form>
      
      {totalesDia && (
        <div className="text-justify mt-6">
          <h3 className="text-xl text-center font-semibold mb-2">Reporte del Día</h3>
          <div className="flex flex-col gap-2 md:flex-row justify-center md:space-x-10">
            <p><strong>Total Reservas: </strong> {totalesDia.totalReservas}</p>
            <p><strong>Total Sin TACC: </strong> {totalesDia.totalSinTacc}</p>
            <p><strong>Total Vegano: </strong> {totalesDia.totalVegano}</p>
          </div>
        </div>
      )}
      {reporte.length > 0 && (
        <div className="mt-6">
          <h3 className="text-xl font-semibold mb-2">Reporte por Turnos</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {reporte.map((turno, index) => (
              <ReporteTurno key={index} turno={turno} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ReporteDiario;