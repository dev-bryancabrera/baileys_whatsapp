const fs = require('fs').promises;
const path = require('path');
const registrosFilePath = path.join(__dirname, 'registros.json');

// Función para obtener todos los registros desde el archivo JSON
const getRegistros = async () => {
    try {
        const data = await fs.readFile(registrosFilePath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        if (err.code === 'ENOENT') {
            return [];
        }
        throw err;
    }
}

// Función para guardar los registros en el archivo JSON
const saveRegistros = async (registros) => {
    await fs.writeFile(registrosFilePath, JSON.stringify(registros, null, 2));
}

module.exports = { getRegistros, saveRegistros };
