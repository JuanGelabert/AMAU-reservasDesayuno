import React from 'react';

function ReporteTurno({ turno }) {
    return (
        <div className="p-4 border rounded bg-gray-50">
            <p><strong>Turno: </strong> {turno.turno} hs</p>
            <p><strong>Reservas: </strong> {turno.totalReservas}</p>
            <p><strong>Sin TACC: </strong> {turno.totalSinTacc}</p>
            <p><strong>Vegano: </strong> {turno.totalVegano}</p>
            <p><strong>Comentarios: </strong></p>
            <ul className="list-disc pl-5">
                {turno.comentarios.map((comentario, i) => (
                    <li key={i}>{comentario}</li>
                ))}
            </ul>
        </div>
    );
}

export default ReporteTurno;
