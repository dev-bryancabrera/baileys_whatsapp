const express = require("express");
const { createFunction } = require("./functions/functions");
const { getQRImages, getQRImagePath } = require("./functions/qrImages"); // Importar funciones de manejo de imágenes
const { saveRegistros, getRegistros } = require("./functions/clientes"); // Importar funciones clientes
const bodyParser = require("body-parser");
const path = require("path");
const { Console } = require("console");
const fs = require("fs").promises;
const app = express();
const port = 4010;
const cors = require("cors");

app.use(express.json()); // Middleware para parsear JSON
app.use(cors()); // Middleware para habilitar CORS

/* Endpoint para activar que se pueda realizar los envios */
app.post("/ejecutar", async (req, res) => {
  const { id_externo, parametro } = req.body;

  if (id_externo && parametro) {
    const filePath = path.join(__dirname, `functions/${id_externo}.js`);

    try {
      const createdFunction = require(filePath);

      const result = await createdFunction(app, parametro);
      console.log("Resultado de la función:", result);

      res.send({ result });
    } catch (error) {
      console.error("Error al ejecutar la función:", error);
      res.status(500).send({
        result: false,
        success: "",
        error: "Error al ejecutar la función",
      });
    }
  } else {
    const sms = "Por favor, proporciona el id y un parámetro";
    console.log(sms);
    res.status(400).send({
      result: false,
      success: "",
      error: sms,
    });
  }
});

/* Endpoint para activar los envios a todos los usuarios */
app.get("/activar-envios", async (req, res) => {
  try {
    const registros = await getRegistros();

    if (registros && registros.length > 0) {
      const resultados = [];

      const idsExternos = registros.map((registro) => registro.id_externo);

      for (const id_externo of idsExternos) {
        const filePath = path.join(__dirname, `functions/${id_externo}.js`);

        try {
          const createdFunction = require(filePath);

          const parametro = "default";
          const result = await createdFunction(app, parametro);
          console.log(`Resultado de la función ${id_externo}:`, result);

          resultados.push({ id_externo, result });
        } catch (error) {
          console.error(`Error al ejecutar la función ${id_externo}:`, error);
          resultados.push({
            id_externo,
            error: "Error al ejecutar la función",
          });
        }
      }

      res.send({ resultados });
    } else {
      const sms = "No se encontraron registros para ejecutar.";
      console.log(sms);
      res.status(404).send({
        result: false,
        success: "",
        error: sms,
      });
    }
  } catch (error) {
    console.error(
      "Error al obtener los registros o ejecutar las funciones:",
      error
    );
    res.status(500).send({
      result: false,
      success: "",
      error: "Error al obtener los registros o ejecutar las funciones",
    });
  }
});

/* --------------------------- Manejo de QR -------------------------------- */
/* Endpoint para ver la lista de los qr con que se vinculo */
app.get("/qr-images-list", async (req, res) => {
  try {
    const qrImages = await getQRImages();
    res.json(qrImages);
  } catch (err) {
    console.error("Error al obtener imágenes .qr.png:", err);
    res.status(500).json({
      result: false,
      success: "",
      error: "Error al obtener imágenes .qr.png",
    });
  }
});

/* Endpoint para visualizar el qr generado */
app.get("/qr-images/:imageName", async (req, res) => {
  const { imageName } = req.params;
  try {
    const imagePath = await getQRImagePath(imageName);
    if (!imagePath) {
      res.status(404).send("Imagen no encontrada");
      return;
    }
    res.sendFile(imagePath);
  } catch (err) {
    console.error("Error al obtener imagen .qr.png:", err);
    res.status(500).json({
      result: false,
      success: "",
      error: "Error al obtener imagen .qr.png",
    });
  }
});
/* --------------------------- FIN Manejo de QR -------------------------------- */

/* --------------------------- Manejo de usurios -------------------------------- */

// Middleware para manejar errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Algo salió mal!");
});

app.get("/", async (req, res) => {
  try {
    console.log(
      `---------------------------------- Bienvenido la api esta en funcionamiento ----------------------------------`
    );
    res.json({
      result: true,
      success: "Bienvenido la api esta en funcionamiento",
      error: "",
    });
  } catch (err) {
    console.error("********************* No hay conexión:", err);
    res.status(500).json({
      result: false,
      success: "",
      error: "No hay conexión",
    });
  }
});

// Ruta para obtener todos los registros
app.get("/registros", async (req, res) => {
  try {
    const registros = await getRegistros();
    console.log(
      `---------------------------------- Registros Encontrados ----------------------------------`
    );
    res.json({
      result: true,
      success: "datos obtenidos",
      data: registros,
    });
  } catch (err) {
    console.error("********************* Error al obtener registros:", err);
    res.status(500).json({
      result: false,
      success: "",
      error: "Error al obtener registros",
    });
  }
});

// Ruta para obtener un registro por su id_externo
app.get("/registros/:id_externo", async (req, res) => {
  const { id_externo } = req.params;
  try {
    const registros = await getRegistros();
    const registro = registros.find((r) => r.id_externo === id_externo);
    if (!registro) {
      console.log(
        `---------------------------------- Registro no encontrado ${id_externo} ----------------------------------`
      );
      res.status(404).json({ error: "Registro no encontrado" });
      return;
    }
    console.log(
      `---------------------------------- Registro encontrado ${id_externo} ----------------------------------`
    );
    res.json({
      result: true,
      success: "datos obtenidos",
      data: registro,
    });
  } catch (err) {
    console.error(
      `********************* Error al obtener registro ${id_externo}:`,
      err
    );
    res.status(500).json({
      result: false,
      success: "",
      error: "Error al obtener registro",
    });
  }
});

// Ruta para crear un nuevo registro
app.post("/registros", async (req, res) => {
  const { nombre, id_externo } = req.body;
  const nuevoRegistro = req.body;
  let sms = "Nuevo registro";
  try {
    const registros = await getRegistros();
    const registro = registros.find((r) => r.id_externo === id_externo);
    if (!registro) {
      if (nombre && id_externo) {
        let name = createFunction(id_externo);
        sms = `Función ${name} creada`;
        console.log(
          `---------------------------------- ${sms} ----------------------------------`
        );

        registros.push(nuevoRegistro);
        await saveRegistros(registros);

        res.json({
          result: true,
          success: "Registro creado correctamente",
          registro: nuevoRegistro,
        });
      } else {
        sms = `Por favor, proporciona un nombre y un ID`;
        console.log(
          `---------------------------------- ${sms} ----------------------------------`
        );
        res.status(400).send({
          result: false,
          success: "",
          error: sms,
        });
      }
    } else {
      sms = `Ya existe un registro con el mismo ID`;
      console.log(
        `---------------------------------- ${sms} ----------------------------------`
      );
      res.status(400).send({
        result: false,
        success: "",
        error: sms,
      });
    }
  } catch (err) {
    console.error("********************* Error al crear registro:", err);
    res.status(500).json({
      result: false,
      success: "",
      error: "Error al crear registro",
    });
  }
});

/* Endpoint para eliminar un registro */
app.delete("/registros/:id_externo/:tipo", async (req, res) => {
  const { id_externo } = req.params;

  const nombreArchivo = `${id_externo}.js`;
  const rutaArchivo = path.join(__dirname, "functions", nombreArchivo);
  const rutaImagen = path.join(__dirname, `${id_externo}.qr.png`);
  const rutaCarpeta = path.join(__dirname, `${id_externo}_sessions`);

  try {
    // Verificar y eliminar el archivo principal
    if (await fileExists(rutaArchivo)) {
      await fs.unlink(rutaArchivo);
      console.log(`Archivo ${rutaArchivo} eliminado correctamente.`);
    } else {
      console.warn(`Archivo ${rutaArchivo} no encontrado.`);
    }

    // Verificar y eliminar la imagen
    if (await fileExists(rutaImagen)) {
      await fs.unlink(rutaImagen);
      console.log(`Imagen ${rutaImagen} eliminada correctamente.`);
    } else {
      console.warn(`Imagen ${rutaImagen} no encontrada.`);
    }

    // Verificar y eliminar el directorio
    if (await fileExists(rutaCarpeta)) {
      const stats = await fs.stat(rutaCarpeta);
      if (stats.isDirectory()) {
        await fs.rm(rutaCarpeta, { recursive: true });
        console.log(`Directorio ${rutaCarpeta} eliminado correctamente.`);
      } else {
        console.warn(
          `La ruta ${rutaCarpeta} existe, pero no es un directorio.`
        );
      }
    } else {
      console.warn(`Directorio ${rutaCarpeta} no encontrado.`);
    }

    let registros = await getRegistros();
    registros = registros.filter((r) => r.id_externo !== id_externo);
    await saveRegistros(registros);

    res.json({
      result: true,
      id: id_externo,
      success: "Registro eliminado correctamente",
      error: "",
    });

    console.log(
      `---------------------------------- SE ELIMINARON LOS REGISTROS PARA ${id_externo} ----------------------------------`
    );

    console.log("Reiniciando la aplicación...");
    process.exit(0);
  } catch (err) {
    console.error(`Error al eliminar registro ${id_externo}:`, err);
    res.status(500).json({
      result: false,
      success: "",
      error: "Error al eliminar registro",
    });
  }
});

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch (err) {
    if (err.code === "ENOENT") {
      return false;
    }
    throw err;
  }
}

/* --------------------------- Fin Manejo de usurios -------------------------------- */

/* Activar automaticamente los envios */
const ejecutarActivarEnvios = async () => {
  try {
    const registros = await getRegistros();

    if (registros && registros.length > 0) {
      const resultados = [];
      const idsExternos = registros.map((registro) => registro.id_externo);

      for (const id_externo of idsExternos) {
        const filePath = path.join(__dirname, `functions/${id_externo}.js`);

        try {
          const createdFunction = require(filePath);
          const parametro = "1"; // Puedes cambiar esto si es necesario
          const result = await createdFunction(app, parametro);
          console.log(`Resultado de la función ${id_externo}:`, result);
          resultados.push({ id_externo, result });
        } catch (error) {
          console.error(`Error al ejecutar la función ${id_externo}:`, error);
          resultados.push({
            id_externo,
            error: "Error al ejecutar la función",
          });
        }
      }

      console.log({ resultados }); // Puedes enviar estos resultados a algún lugar si es necesario
    } else {
      const sms = "No se encontraron registros para ejecutar.";
      console.log(sms);
    }
  } catch (error) {
    console.error(
      "Error al obtener los registros o ejecutar las funciones:",
      error
    );
  }
};

// Puerto en el que escucha el servidor
app.listen(port, () => {
  ejecutarActivarEnvios();
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
