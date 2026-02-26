/**
 * ARCHIVO COMPLETO: api/upload.js
 * Servidor serverless para subir juegos a Itch.io.
 */
const { IncomingForm } = require('formidable');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

// Configuración necesaria para que Vercel no intente procesar el body automáticamente
export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    const form = new IncomingForm();

    form.parse(req, async (err, fields, files) => {
        if (err) {
            console.error("Error formidable:", err);
            return res.status(500).json({ error: "Error al procesar el formulario" });
        }

        // Acceso a los campos (en formidable v3 son arrays)
        const gameFile = Array.isArray(files.gameFile) ? files.gameFile[0] : files.gameFile;
        const playerName = Array.isArray(fields.playerName) ? fields.playerName[0] : fields.playerName;

        if (!gameFile || !playerName) {
            return res.status(400).json({ error: "Faltan datos en el envío" });
        }

        const API_KEY = process.env.ITCH_API_KEY; 
        const USERNAME = process.env.ITCH_USERNAME;
        const GAME_SLUG = process.env.ITCH_GAME_SLUG;

        try {
            const formData = new FormData();
            formData.append('file', fs.createReadStream(gameFile.filepath), {
                filename: `${playerName.replace(/\s+/g, '_')}_game.html`,
                contentType: 'text/html'
            });

            // Endpoint de la API de Itch.io
            const itchRes = await axios.post(
                `https://itch.io/api/1/${API_KEY}/game/${USERNAME}/${GAME_SLUG}/upload`,
                formData,
                { 
                    headers: {
                        ...formData.getHeaders()
                    }
                }
            );

            return res.status(200).json({ 
                success: true, 
                msg: `¡Juego de ${playerName} subido con éxito!`,
                details: itchRes.data 
            });

        } catch (error) {
            console.error("Error en Itch.io:", error.response?.data || error.message);
            return res.status(500).json({ 
                error: "Fallo en la comunicación con Itch.io",
                details: error.response?.data || error.message 
            });
        }
    });
}
