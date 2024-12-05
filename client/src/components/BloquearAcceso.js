import React, { useState, useEffect } from 'react';
import axios from 'axios';

function BloquearAcceso() {
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
    <div>
      
      <button onClick={handleBloqueo} className={`w-full p-2 rounded ${bloquear ? 'bg-red-500' : 'bg-green-500'} text-white`}>
        {bloquear ? 'Desbloquear Acceso' : 'Bloquear Acceso'}
      </button>
    </div>
  );
}

export default BloquearAcceso;