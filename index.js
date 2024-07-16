const express = require('express');
const { createFunction } = require('./functions/functions');
const { getQRImages, getQRImagePath } = require('./functions/qrImages'); // Importar funciones de manejo de imágenes
const { saveRegistros, getRegistros } = require('./functions/clientes'); // Importar funciones clientes
const bodyParser = require('body-parser');
const path = require('path');
const { Console } = require('console');
const fs = require('fs').promises;
const app = express();
const port = 4010;
const cors = require('cors');


app.use(express.json()); // Middleware para parsear JSON
app.use(cors()); // Middleware para habilitar CORS

// Ruta para ejecutar la función en el archivo creado
app.post('/ejecutar', async (req, res) => {
    const { id_externo, parametro } = req.body;

    if (id_externo && parametro) {
        const filePath = path.join(__dirname, `functions/${id_externo}.js`);

        try {
            // Cargar la función desde el archivo creado
            const createdFunction = require(filePath);

            // Ejecutar la función con el parámetro proporcionado
            const result = await createdFunction(app, parametro);
            console.log('Resultado de la función:', result);

            res.send({ result });
        } catch (error) {
            console.error('Error al ejecutar la función:', error);
            res.status(500).send({
                result: false,
                success: '',
                error: 'Error al ejecutar la función'
            });
        }
    } else {
        const sms = 'Por favor, proporciona el id y un parámetro';
        console.log(sms);
        res.status(400).send({
            result: false,
            success: '',
            error: sms
        });
    }
});

/* --------------------------- Manejo de QR -------------------------------- */
// Rutas para manejar imágenes .qr.png
app.get('/qr-images-list', async (req, res) => {
    try {
        const qrImages = await getQRImages();
        res.json(qrImages);
    } catch (err) {
        console.error('Error al obtener imágenes .qr.png:', err);
        res.status(500).json({
            result: false,
            success: '',
            error: 'Error al obtener imágenes .qr.png'
        });
    }
});

app.get('/qr-images/:imageName', async (req, res) => {
    const { imageName } = req.params;
    try {
        const imagePath = await getQRImagePath(imageName);
        if (!imagePath) {
            res.status(404).send('Imagen no encontrada');
            return;
        }
        res.sendFile(imagePath);
    } catch (err) {
        console.error('Error al obtener imagen .qr.png:', err);
        res.status(500).json({
            result: false,
            success: '',
            error: 'Error al obtener imagen .qr.png'
        });
    }
});
/* --------------------------- FIN Manejo de QR -------------------------------- */


/* --------------------------- Manejo de usurios -------------------------------- */

// Middleware para manejar errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Algo salió mal!');
});

app.get('/', async (req, res) => {
    try {
        console.log(`---------------------------------- Bienvenido la api esta en funcionamiento ----------------------------------`)
        res.json({
            result: true,
            success: 'Bienvenido la api esta en funcionamiento',
            error: ''
        });
    } catch (err) {
        console.error('********************* No hay conexión:', err);
        res.status(500).json({
            result: false,
            success: '',
            error: 'No hay conexión'
        });
    }
});

// Ruta para obtener todos los registros
app.get('/registros', async (req, res) => {
    try {
        const registros = await getRegistros();
        console.log(`---------------------------------- Registros Encontrados ----------------------------------`)
        res.json({
            result: true,
            success: 'datos obtenidos',
            data: registros
        });
    } catch (err) {
        console.error('********************* Error al obtener registros:', err);
        res.status(500).json({
            result: false,
            success: '',
            error: 'Error al obtener registros'
        });
    }
});

// Ruta para obtener un registro por su id_externo
app.get('/registros/:id_externo', async (req, res) => {
    const { id_externo } = req.params;
    try {
        const registros = await getRegistros();
        const registro = registros.find(r => r.id_externo === id_externo);
        if (!registro) {
            console.log(`---------------------------------- Registro no encontrado ${id_externo} ----------------------------------`)
            res.status(404).json({ error: 'Registro no encontrado' });
            return;
        }
        console.log(`---------------------------------- Registro encontrado ${id_externo} ----------------------------------`)
        res.json({
            result: true,
            success: 'datos obtenidos',
            data: registro
        });
    } catch (err) {
        console.error(`********************* Error al obtener registro ${id_externo}:`, err);
        res.status(500).json({
            result: false,
            success: '',
            error: 'Error al obtener registro'
        });
    }
});

// Ruta para crear un nuevo registro
app.post('/registros', async (req, res) => {
    const { nombre, id_externo } = req.body;
    const nuevoRegistro = req.body;
    let sms = 'Nuevo registro';
    try {
        const registros = await getRegistros();
        const registro = registros.find(r => r.id_externo === id_externo);
        if (!registro) {
            if (nombre && id_externo) {
                let name = createFunction(id_externo);
                sms = `Función ${name} creada`;
                console.log(`---------------------------------- ${sms} ----------------------------------`);

                registros.push(nuevoRegistro);
                await saveRegistros(registros);

                res.json({
                    result: true,
                    success: 'Registro creado correctamente',
                    registro: nuevoRegistro
                });
            } else {
                sms = `Por favor, proporciona un nombre y un ID`;
                console.log(`---------------------------------- ${sms} ----------------------------------`);
                res.status(400).send({
                    result: false,
                    success: '',
                    error: sms
                });
            }
        } else {
            sms = `Ya existe un registro con el mismo ID`;
            console.log(`---------------------------------- ${sms} ----------------------------------`);
            res.status(400).send({
                result: false,
                success: '',
                error: sms
            });
        }

    } catch (err) {
        console.error('********************* Error al crear registro:', err);
        res.status(500).json({
            result: false,
            success: '',
            error: 'Error al crear registro'
        });
    }
});

// Ruta para eliminar un registro existente por su id_externo
// app.put('/registros/:id_externo', async (req, res) => {
//     const { id_externo } = req.params;
//     const datosActualizados = req.body;
//     console.log(datosActualizados)
//     try {
//         let registros = await getRegistros();
//         const indice = registros.findIndex(r => r.id_externo === id_externo);
//         if (indice === -1) {
//             res.status(404).json({ error: 'Registro no encontrado' });
//             return;
//         }
//         registros[indice] = { ...registros[indice], ...datosActualizados };
//         await saveRegistros(registros);
//         res.json({ message: 'Registro actualizado correctamente', registro: registros[indice] });
//     } catch (err) {
//         console.error(`Error al actualizar registro ${id_externo}:`, err);
//         res.status(500).json({ error: 'Error al actualizar registro' });
//     }
// });

// Ruta para eliminar un registro por su id_externo
app.delete('/registros/:id_externo/:tipo', async (req, res) => {
    const { id_externo, tipo } = req.params;
    const nombreArchivo = `${id_externo}.js`;
    try {
        if (tipo && tipo == 1) {
            let registros = await getRegistros();
            registros = registros.filter(r => r.id_externo !== id_externo);
            await saveRegistros(registros);

            console.log(`---------------------------------- 1 SE ELIMINARON LAS FUNCIONES PARA ${id_externo} ----------------------------------`)
            res.json({
                result: true,
                id: id_externo,
                success: 'Registro eliminado correctamente 1',
                error: ''
            });
        } else {
            // Construir la ruta completa al archivo a eliminar
            const rutaArchivo = path.join(__dirname, 'functions', nombreArchivo);
            // Verificar si el archivo existe
            await fs.access(rutaArchivo);

            // Construir la ruta completa a la imagen a eliminar
            const rutaImagen = path.join(__dirname, `${id_externo}.qr.png`);
            // Verificar si el archivo existe
            await fs.access(rutaImagen);

            const rutaCarpeta = path.join(__dirname, `${id_externo}_sessions`);
            const stats = await fs.stat(rutaCarpeta);
            if (stats.isDirectory()) {
                await fs.rm(rutaCarpeta, { recursive: true });
                console.log(`El directorio ${rutaCarpeta} existe y fuerón eliminados`);
                let registros = await getRegistros();
                registros = registros.filter(r => r.id_externo !== id_externo);
                await saveRegistros(registros);

                // eliminar archivo
                await fs.unlink(rutaArchivo);

                // eliminar imagen
                await fs.access(rutaImagen);
                console.log(`---------------------------------- SE ELIMINARON LAS FUNCIONES PARA ${id_externo} ----------------------------------`)
                res.json({
                    result: true,
                    id: id_externo,
                    success: 'Registro eliminado correctamente',
                    error: ''
                });
            } else {
                console.log(`La ruta ${directorioAVerificar} existe pero no es un directorio.`);
                res.status(400).json({
                    result: false,
                    success: '',
                    error: `La ruta ${directorioAVerificar} existe pero no es un directorio.`
                });
            }
        }
    } catch (err) {
        if (err.code === 'ENOENT') {
            console.error(`********************* El archivo ${nombreArchivo} no existe.`);
            res.status(404).json({
                result: false,
                success: '',
                error: `El archivo ${nombreArchivo} no existe`
            });
        } else {
            console.error(` ********************* Error al eliminar registro ${id_externo}:`, err);
            res.status(500).json({
                result: false,
                success: '',
                error: 'Error al eliminar registro'
            });
        }
    }
});

/* --------------------------- Fin Manejo de usurios -------------------------------- */

// Puerto en el que escucha el servidor
app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});
