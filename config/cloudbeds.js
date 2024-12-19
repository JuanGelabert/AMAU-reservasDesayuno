require('dotenv').config();
const axios = require('axios');

const apiKey = process.env.CLOUDBEDS_API_KEY;
const propertyId = process.env.CLOUDBEDS_PROPERTY_ID;
const apiBaseUrl = process.env.CLOUDBEDS_API_BASE_URL;

/**
 * Realiza una solicitud autenticada a la API de Cloudbeds.
 * @param {string} endpoint - El endpoint de la API a llamar.
 * @param {object} params - Los parámetros de consulta.
 * @returns {Promise<object>} - La respuesta de la API.
 */
async function realizarSolicitud(endpoint, params = {}) {
  try {
    const response = await axios.get(`${apiBaseUrl}${endpoint}`, {
      headers: {
        'x-api-key': apiKey,
        'X-PROPERTY-ID': propertyId
      },
      params
    });

    return response.data;
  } catch (error) {
    console.error('Error en la solicitud a la API de Cloudbeds:', error.response.data);
    throw new Error('No se pudo realizar la solicitud a la API');
  }
}

module.exports = {
  realizarSolicitud
};