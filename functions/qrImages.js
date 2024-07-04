const fs = require('fs').promises;
const path = require('path');

const directoryPath = path.join(__dirname, '../'); // Ruta real a las imágenes, la raíz del proyecto

// Función para buscar archivos .qr.png en un directorio
const getQRImages = async () => {
    try {
        const files = await fs.readdir(directoryPath);
        const qrImages = files.filter(file => file.endsWith('.qr.png'));
        return qrImages.map(file => ({
            name: file,
            path: `/qr-images/${file}` // Ruta para acceder a la imagen desde el navegador
        }));
    } catch (err) {
        console.error('Error al buscar archivos .qr.png:', err);
        throw err;
    }
};

// Función para obtener la ruta de una imagen .qr.png específica
const getQRImagePath = async (imageName) => {
    try {
        const imagePath = path.join(directoryPath, imageName);
        const stats = await fs.stat(imagePath);
        if (stats.isFile()) {
            return imagePath;
        }
        return null;
    } catch (err) {
        console.error(`Error al obtener imagen .qr.png ${imageName}:`, err);
        throw err;
    }
};

module.exports = { getQRImages, getQRImagePath };
