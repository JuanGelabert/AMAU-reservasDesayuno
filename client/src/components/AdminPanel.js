import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReporteTurno from './ReporteTurno';

function AdminPanel() {
    const [fecha, setFecha] = useState('');
    const [totalesDia, setTotalesDia] = useState(null);
    const [reporte, setReporte] = useState([]);
    const [bloquear, setBloquear] = useState(false);

    useEffect(() => {
        axios.get('http://localhost:3000/api/bloqueo')
            .then(response => {
                setBloquear(response.data.bloquear);
            })
            .catch(error => {
                console.error('Error fetching bloqueo:', error);
            });
    }, []);

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

    const handleBloqueo = () => {
        setBloquear(!bloquear);
        axios.post('http://localhost:3000/api/bloqueo', { bloquear: !bloquear })
            .then(response => {
                console.log('Bloqueo actualizado:', response.data);
            })
            .catch(error => {
                console.error('Error updating bloqueo:', error);
            });
    };

    return (
        <div className="max-w-4xl mx-auto mt-10 p-6 bg-[#fafafa] rounded-lg shadow-md">
            <h2 className="text-3xl font-bold mb-4 text-center">Panel de Administración</h2>
            <div className="mb-6">
                <h3 className="text-xl font-semibold mb-2">Generar Reporte</h3>
                <form onSubmit={handleReporte} className="space-y-4">
                    <div>
                        <label className="block text-gray-700">Fecha:</label>
                        <input type="date" value={fecha} onChange={handleChangeFecha} required className="w-full p-2 border rounded" />
                    </div>
                    <button type="submit" className="w-full bg-green-500 text-white p-2 rounded">Generar Reporte</button>
                </form>
                {totalesDia && (
                    <div className="text-justify mt-6">
                        <h3 className="text-xl text-center font-semibold mb-2">Reporte del Día</h3>
                        <div className="flex justify-center space-x-10">
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
            <div>
                <h3 className="text-xl font-semibold mb-2">Bloquear Acceso</h3>
                <button onClick={handleBloqueo} className={`w-full p-2 rounded ${bloquear ? 'bg-red-500' : 'bg-blue-500'} text-white`}>
                    {bloquear ? 'Desbloquear Acceso' : 'Bloquear Acceso'}
                </button>
            </div>
        </div>
    );
}

export default AdminPanel;