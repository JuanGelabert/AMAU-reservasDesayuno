import React, { useState } from 'react';
import axios from 'axios';
import './styles.css'; // Importar el archivo de estilos

const CargarReservas = () => {
  const [file, setFile] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [mensajeColor, setMensajeColor] = useState('message-success'); // Estado para el color del mensaje

  // Maneja el cambio de archivo
  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  // Maneja la subida del archivo
  const handleUpload = () => {
    const formData = new FormData();
    formData.append('file', file);

    axios.post('http://localhost:3000/api/upload', formData)
      .then(response => {
        setMensaje('Archivo cargado exitosamente');
        setMensajeColor('message-success'); // Color verde para éxito
      })
      .catch(error => {
        setMensaje('Error al cargar el archivo');
        setMensajeColor('message-error'); // Color rojo para error
      });
  };

  // Abre la página de reservas individuales en una nueva pestaña
  const openReservaIndividual = () => {
    window.open("/", "_blank");
  };

  return (
    <div className="container">
      <h2 className="title text-center">Reservas Grupales</h2>
      
      <div className="mb-6">
        <p className="text-description text-center">Por favor, selecciona un archivo de Excel (.xlsx) con los datos del grupo</p>
        <input
          type="file"
          onChange={handleFileChange}
          className="input-file text-center"
        />
        <button
          onClick={handleUpload}
          className="btn"
        >
          Subir Archivo
        </button>
        {mensaje && (
          <p className={mensajeColor}>{mensaje}</p>
        )}
      </div>
      <div>
        <button
          onClick={openReservaIndividual}
          className="btn-secondary"
        >
          Reserva Individual
        </button>
      </div>
    </div>
  );
};

export default CargarReservas;