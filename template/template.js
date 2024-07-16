const template = (id) => {
    return `    
const express = require('express');
const { createBot, createProvider, createFlow } = require('@bot-whatsapp/bot');
const BaileysProvider = require('@bot-whatsapp/provider/baileys');
const JsonFileAdapter = require('@bot-whatsapp/database/json');
const { getRegistros } = require('./clientes');

const main = async (app,parametro) => {
    try {
        const adapterDB = new JsonFileAdapter();
        const adapterFlow = createFlow([]);
        const adapterProvider = createProvider(BaileysProvider, {
            name: '${id}'
        });        

        await createBot({
            flow: adapterFlow,
            provider: adapterProvider,
            database: adapterDB,
        });

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
                        phone.length > 12 ?
                            chatId = "" + phone + "@g.us"
                            :
                            chatId = "" + phone + "@c.us"                

                        switch (tipo) {
                            case 1:
                                await adapterProvider.sendText(chatId, message)
                                    .then(() => {
                                        console.log({
                                            De: "cliente-${id}",
                                            Para: chatId,
                                            Message: message,
                                            Fecha: Date()
                                        });
                                        res.json({ result: true, success: 'Message sent successfully' });
                                    })
                                    .catch((error) => {
                                        console.log({
                                            De: "cliente-${id}",
                                            Para: chatId,
                                            Message: "*-*-*-*-*-* Mensaje no enviado *-*-*-*-*-*",
                                            Fecha: Date()
                                        });
                                        res.status(500);
                                        res.json({ result: false, errorsms: 'Error sending message: ' + error });
                                    });
                                break;                        
                            
                            default:
                                console.log('--------- cliente-${id} : Tipo no reconocido ---------')
                                res.status(400).json({ result: false, error: 'Tipo no reconocido' });
                                break;
                        }
                    } else {
                        console.log('--------- cliente-${id} : Falta algun parametro en su archivo json ---------')
                        res.status(400).json({ result: false, error: 'Falta algun parametro en su archivo json' });
                    }
                }
            } catch (error) {
                console.log('cliente-${id} : Error desconocido')
                console.log(error.message)
                res.status(500);
                res.json({ result: false, errorsms: error.message });
            }         
        });        

        app.post('/user${id}', async (req, res) => {
            try {
                const userId = adapterProvider.vendor.user.id;
                const userName = adapterProvider.vendor.user.name;
                console.log('--------- INFORMACION DEL cliente-${id} ENTREGADA ---------')
                res.json({ result: true, userId: userId, userName: userName });
            } catch (error) {
                console.log('cliente-${id} : Error desconocido')
                console.log(error.message)
                res.status(500);
                res.json({ result: false, errorsms: error.message });
            }
        });

        return {
            result: true,
            success: 'QR generado',
            error: ''
        };
    } catch (error) {
        console.error(error);
        return {
            result: false,
            success: '',
            error: 'Error al ejecutar la función: ' + error.message
        };
    }
};

module.exports = main; 

`;
}

module.exports = template