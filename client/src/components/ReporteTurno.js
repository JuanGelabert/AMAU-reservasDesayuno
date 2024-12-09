import React from 'react';

const ReporteTurno = ({ turnoData }) => {
  const { turno, reservas } = turnoData;
  const totalReservas = reservas.length;
  const totalSinTacc = reservas.filter(reserva => reserva.menu.toLowerCase().includes('sin tacc')).length;
  const totalVegano = reservas.filter(reserva => reserva.menu.toLowerCase().includes('vegano')).length;

  return (
    <div className="p-4 bg-white border rounded border-gray-300 shadow flex justify-between">
      <div className="w-1/2">
        <h4 className="font-semibold"><strong>Turno:</strong> {turno} hs</h4>
        <p><strong>Reservas:</strong> {totalReservas}</p>
        <p><strong>Sin TACC:</strong> {totalSinTacc}</p>
        <p><strong>Vegano:</strong> {totalVegano}</p>
      </div>
      <div className="w-1/2 text-right">
        <h5 className="font-semibold">Comentarios:</h5>
        {reservas.some(reserva => reserva.comentarios) ? (
          <ul className="list-disc list-inside">
            {reservas.filter(reserva => reserva.comentarios).map((reserva, index) => (
              <li key={index}>{reserva.comentarios}</li>
            ))}
          </ul>
        ) : (
          <p>No hay comentarios</p>
        )}
      </div>
    </div>
  );
};

export default ReporteTurno;
