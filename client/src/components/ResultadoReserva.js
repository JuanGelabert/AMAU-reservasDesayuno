import React from 'react';

const ResultadoReserva = ({ reserva }) => {
  const { fecha, habitacion, nombre, apellido, turno, menu, comentarios } = reserva;

  return (
    <div className="p-4 bg-white border rounded border-gray-300 shadow flex justify-between">
      <div className="w-1/2">
        <h4 className="font-semibold"><strong>Fecha:</strong> {fecha}</h4>
        <p><strong>Habitación:</strong> {habitacion}</p>
        <p><strong>Nombre:</strong> {nombre}</p>
        <p><strong>Apellido:</strong> {apellido}</p>
        <p><strong>Turno:</strong> {turno} hs</p>
        <p><strong>Menú:</strong> {menu}</p>
      </div>
      <div className="w-1/2 text-right">
        <h5 className="font-semibold mt-2">Comentarios:</h5>
        {comentarios ? (
          <p>{comentarios}</p>
        ) : (
          <p>No hay comentarios</p>
        )}
      </div>
    </div>
  );
};

export default ResultadoReserva;
