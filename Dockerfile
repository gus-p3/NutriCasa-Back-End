FROM node:20-alpine

# Set working directory
WORKDIR /app

# Archivos de pacman/npm
COPY package.json package-lock.json ./

# Carga limpia de librerías para producción
RUN npm ci

# Copia código fuente
COPY . .

# Generar carpeta dist compilada por typescript
RUN npm run build

# Exponer el puerto
EXPOSE 3000
EXPOSE 443

# Start the application
CMD ["node", "dist/app.js"]
