const template = (id) => {
  return `    
const express = require("express");
const { createBot, createProvider, createFlow } = require("@bot-whatsapp/bot");
const BaileysProvider = require("@bot-whatsapp/provider/baileys");
const JsonFileAdapter = require("@bot-whatsapp/database/json");
const { getRegistros } = require("./clientes");
      
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

    // Función de reintento con límite de intentos y manejo de timeout
    const retryWithTimeout = async (fn, retries, timeout) => {
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          console.log(\`Intento \${attempt} de \${retries}\`);
          const result = await Promise.race([
            fn(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Timeout excedido')), timeout)
            )
          ]);
          return result; // Éxito
        } catch (error) {
          console.error(\`Error en intento \${attempt}: \${error.message}\`);
          if (attempt === retries) throw new Error('Se alcanzó el número máximo de reintentos');
        }
      }
    };

    // Endpoint para envío de mensajes
    app.post('/send${id}', async (req, res) => {
      try {
        const registros = await getRegistros();
        const registro = registros.find(r => r.id_externo === "${id}");
        if (!registro) {
          console.log("---------------------------------- Registro no encontrado ${id} ----------------------------------")
          res.status(404).json({ error: 'Registro no encontrado' });
          return;
        } else {
          const { phone, message, tipo } = req.body;
          let chatId = "";

          if (phone && message && tipo) {
            phone.length > 12 
              ? (chatId = "" + phone + "@g.us")
              : (chatId = "" + phone + "@c.us");               

            switch (tipo) {
              case 1:
                try {
                  await adapterProvider.sendText(chatId, message);
                  console.log({
                    De: "cliente-${id}",
                    Para: chatId,
                    Message: message,
                    Fecha: Date(),
                  });
                  res.json({ 
                   result: true, 
                   success: "Message sent successfully",
                  });
                } catch (error) {
                  console.error({
                    De: "cliente-${id}",
                    Para: chatId,
                    Message: "*-*-*-*-*-* Mensaje no enviado *-*-*-*-*-*",
                    Fecha: Date(),
                  });
                  res.status(500).json({
                    result: false,
                    errorsms: 'Error sending message: ' + error.message,
                  });
                }
                break;

              default:
                console.log(
                  "--------- cliente-${id} : Tipo no reconocido ---------"
                );
                res
                  .status(400)
                  .json({ result: false, error: 'Tipo no reconocido' });
                break;
            }
          } else {
            console.log(
              "--------- cliente-${id} : Falta algun parametro en su archivo json ---------"
            );
            res.status(400).json({ 
              result: false, 
              error: 'Falta algun parametro en su archivo json',
            });
          }
        }
      } catch (error) {
        console.log('cliente-${id} : Error desconocido')
        console.log(error.message)
        res.status(500);
        res.json({ result: false, errorsms: error.message });
      }         
    });        

    // Endpoint para mensajería masiva
    app.post("/mass-messaging${id}", async (req, res) => {
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

        const { messages } = req.body; // Recibe un array de mensajes
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
          res.status(400).json({
            result: false,
            error: "Falta el array de mensajes en el cuerpo de la solicitud",
          });
          return;
        }

        let resultados = [];

        for (const { phone, message, tipo } of messages) {
          if (phone && message && tipo) {
            let chatId = phone.length > 12 ? \`\${phone}@g.us\` : \`\${phone}@c.us\`;

            try {
              // Añadir el trabajo de mensajes masivos a la cola
              await sendQueue.add({ chatId, message, tipo });
              console.log({
                De: "cliente-${id}",
                Para: chatId,
                Message: message,
                Fecha: Date(),
              });
              resultados.push({
                phone,
                result: true,
                success: "Message added to queue",
              });

            } catch (error) {
              console.log({
                De: "cliente-${id}",
                Para: chatId,
                Message: "*-*-*-*-*-* Mensaje no enviado *-*-*-*-*-*",
                Fecha: Date(),
              });
              resultados.push({
                phone,
                result: false,
                error: "Error adding message to queue: " + error.message,
              });
            }
          } else {
            console.log(\`--------- cliente-${id} : Falta algún parámetro para el teléfono \${phone} ---------\`);
            resultados.push({
              phone,
              result: false,
              error: "Falta algún parámetro en su archivo json",
            });
          }
        }

        res.json({ result: true, results: resultados });
      } catch (error) {
        console.log("cliente-${id} : Error desconocido");
        console.log(error.message);
        res.status(500).json({ result: false, error: error.message });
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

    // Endpoint para mensajería masiva
    app.post("/mass-messaging${id}", async (req, res) => {
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

        const { messages } = req.body; // Recibe un array de mensajes
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
          res.status(400).json({
            result: false,
            error: "Falta el array de mensajes en el cuerpo de la solicitud",
          });
          return;
        }

        let resultados = [];

        for (const { phone, message, tipo } of messages) {
          if (phone && message && tipo) {
            let chatId = phone.length > 12 ? \`\${phone}@g.us\` : \`\${phone}@c.us\`;

            try {
              // Añadir el trabajo de mensajes masivos a la cola
              await sendQueue.add({ chatId, message, tipo });
              console.log({
                De: "cliente-${id}",
                Para: chatId,
                Message: message,
                Fecha: Date(),
              });
              resultados.push({
                phone,
                result: true,
                success: "Message added to queue",
              });

            } catch (error) {
              console.log({
                De: "cliente-${id}",
                Para: chatId,
                Message: "*-*-*-*-*-* Mensaje no enviado *-*-*-*-*-*",
                Fecha: Date(),
              });
              resultados.push({
                phone,
                result: false,
                error: "Error adding message to queue: " + error.message,
              });
            }
          } else {
            console.log(
              \`--------- cliente-${id} : Falta algún parámetro para el teléfono \${phone} ---------\`
            );
            resultados.push({
              phone,
              result: false,
              error: "Falta algún parámetro en su archivo json",
            });
          }
        }

        res.json({ result: true, results: resultados });
      } catch (error) {
        console.log("cliente-${id} : Error desconocido");
        console.log(error.message);
        res.status(500).json({ 
          result: false, 
          error: error.message,
        });
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
