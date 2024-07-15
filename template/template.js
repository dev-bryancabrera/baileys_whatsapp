const template = (id) => {
    return `    
const express = require('express');
const { createBot, createProvider, createFlow } = require('@bot-whatsapp/bot');
const BaileysProvider = require('@bot-whatsapp/provider/baileys');
const JsonFileAdapter = require('@bot-whatsapp/database/json');

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
                const { phone, message } = req.body;
                let chatId = "";
                phone.length > 12 ?
                    chatId = "" + phone + "@g.us"
                    :
                    chatId = "" + phone + "@c.us"

                await adapterProvider.sendText(chatId,message)
                    .then(() => {
                        res.json({ result: true, success: 'Message sent successfully' });
                    })
                    .catch((error) => {
                        res.status(500);
                        res.json({ result: false, errorsms: 'Error sending message: ' + error });
                    });

                console.log({
                    De: "cliente-${id}",
                    Para: chatId,
                    Message: message,
                    Fecha: Date()
                });
            } catch (error) {
                res.status(500);
                res.json({ result: false, errorsms: error.message });
            }         
        });        

        app.post('/user${id}', async (req, res) => {
            try {
                const userId = adapterProvider.vendor.user.id;
                const userName = adapterProvider.vendor.user.name;
                res.json({ result: true, userId: userId, userName: userName });
            } catch (error) {
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