const template = (id) => {
  return `    
const express = require("express");
const { createBot, createProvider, createFlow } = require("@bot-whatsapp/bot");
const BaileysProvider = require("@bot-whatsapp/provider/baileys");
const JsonFileAdapter = require("@bot-whatsapp/database/json");
const { getRegistros } = require("./clientes");
const Queue = require('bull'); // Importar Bull para manejar colas

// Crear una cola de mensajes
const sendQueue = new Queue('message-queue-${id}');

// Variable para almacenar el estado de la conexión
let proveedorConectado = false;
let adapterProvider = null; // Reutilizar el adaptador del proveedor

const main = async (app, parametro) => {
  try {
    if (!proveedorConectado) {
      const adapterDB = new JsonFileAdapter();
      const adapterFlow = createFlow([]);
      adapterProvider = createProvider(BaileysProvider, {
        name: "${id}",
      });

      await createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
      });

      proveedorConectado = true; // Marcar como conectado
      console.log("Proveedor conectado y listo");
    } else {
      console.log("Ya conectado al proveedor, evitando reconexión.");
    }

    // Configurar la cola para procesar mensajes
    if (!sendQueue.processed) {
      sendQueue.process(async (job) => {
        const { chatId, message, tipo } = job.data;
        try {

          // Esperar 20 segundos antes de procesar el trabajo
          await new Promise((resolve) => setTimeout(resolve, 20000));

          switch (tipo) {
            case 1:
              await adapterProvider.sendText(chatId, message);
              console.log({
                De: "cliente-${id}",
                Para: chatId,
                Message: message,
                Fecha: Date(),
              });
              return { success: true, message: "Message sent successfully" };

            default:
              console.error("--------- cliente-${id} : Tipo no reconocido ---------");
              throw new Error("Tipo no reconocido");
          }
        } catch (error) {
          console.error({
            De: "cliente-${id}",
            Para: chatId,
            Message: "*-*-*-*-*-* Mensaje no enviado *-*-*-*-*-*",
            Fecha: Date(),
          });
          throw new Error("Error sending message: " + error.message);
        }
      });

      // Marcar el procesador como registrado
      sendQueue.processed = true;
    }

    // Endpoint para envío de mensajes
    app.post("/send${id}", async (req, res) => {
      try {
        const registros = await getRegistros();
        const registro = registros.find((r) => r.id_externo === "${id}");
        if (!registro) {
          console.log(
            "---------------------------------- Registro no encontrado ${id} ----------------------------------"
          );
          res.status(404).json({ error: "Registro no encontrado" });
          return;
        }

        const { phone, message, tipo } = req.body;
        if (!phone || !message || !tipo) {
          console.log("--------- cliente-${id} : Falta algun parametro en su archivo json ---------");
          return res.status(400).json({
            result: false,
            error: "Falta algun parametro en su archivo json",
          });
        }

        let chatId = phone.length > 12 ? phone + "@g.us" : phone + "@c.us";

        // Añadir el trabajo a la cola
        await sendQueue.add(
          { chatId, message, tipo },
          {
            delay: 5000, // 5 segundos de retraso
            attempts: 3, // Reintenta hasta 3 veces en caso de fallo
            backoff: 1000, // Espera 1 segundo entre reintentos
          }
        );

        console.log("Mensaje en cola para ser enviado...");
        res.json({ result: true, success: "Mensaje en cola para ser enviado" });
      } catch (error) {
        console.log("cliente-${id} : Error desconocido");
        console.log(error.message);
        res.status(500).json({ result: false, errorsms: error.message });
      }
    });

    // Endpoint para obtener información del usuario
    app.post("/user${id}", async (req, res) => {
      try {
        const userId = adapterProvider.vendor.user.id;
        const userName = adapterProvider.vendor.user.name;
        console.log(
          "--------- INFORMACION DEL cliente-${id} ENTREGADA ---------"
        );
        res.json({ result: true, userId, userName });
      } catch (error) {
        console.log("cliente-${id} : Error desconocido");
        console.log(error.message);
        res.status(500).json({ result: false, errorsms: error.message });
      }
    });

    return {
      result: true,
      success: "QR generado",
      error: "",
    };
  } catch (error) {
    console.error(error);
    return {
      result: false,
      success: "",
      error: "Error al ejecutar la función: " + error.message,
    };
  }
};

module.exports = main;
      `;
};

module.exports = template;
