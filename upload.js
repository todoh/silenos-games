/**
 * ARCHIVO COMPLETO: api/upload.js
 * Servidor serverless para subir juegos a la cuenta del dueño.
 */
const { IncomingForm } = require('formidable');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Solo POST');

    const form = new IncomingForm();
    form.parse(req, async (err, fields, files) => {
        if (err) return res.status(500).json({ error: "Error al leer archivo" });

        const gameFile = files.gameFile[0];
        const playerName = fields.playerName[0];

        // CONFIGURACIÓN QUE SACARÁS DE VERCEL SETTINGS
        const API_KEY = process.env.ITCH_API_KEY; 
        const USERNAME = process.env.ITCH_USERNAME;
        const GAME_SLUG = process.env.ITCH_GAME_SLUG;

        try {
            const formData = new FormData();
            // Le pasamos el stream del archivo y le ponemos el nombre del jugador para que no se sobrescriban
            formData.append('file', fs.createReadStream(gameFile.filepath), {
                filename: `${playerName}_game.html` 
            });

            // Endpoint de la API de Itch.io para subir archivos
            // Referencia: Wharf Protocol / Uploads
            const response = await axios.post(
                `https://itch.io/api/1/${API_KEY}/game/${USERNAME}/${GAME_SLUG}/upload`,
                formData,
                { headers: formData.getHeaders() }
            );

            return res.status(200).json({ 
                success: true, 
                msg: `¡Juego de ${playerName} subido con éxito!` 
            });

        } catch (error) {
            return res.status(500).json({ 
                error: "Fallo profundo. Revisa que el GAME_SLUG y la API_KEY sean correctos.",
                details: error.message 
            });
        }
    });
}