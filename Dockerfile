# Usa la imagen oficial de Node.js con la versión 16.16.0
FROM node:18-bullseye as bot

# Establece el directorio de trabajo en el contenedor
WORKDIR /usr/src/app

# Copia el archivo package.json y package-lock.json
COPY package*.json ./

# Instala las dependencias (usa --force si es necesario)
RUN npm i --force

# Copia el resto del código de tu aplicación
COPY . .

# Expone el puerto en el que corre la aplicación
EXPOSE 1194

# Comando para iniciar la aplicación
CMD ["npm", "start"]