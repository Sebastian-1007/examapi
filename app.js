require('dotenv').config();
const express = require('express');
const https = require('https');
const http = require('http');
const fs = require('fs');
const bodyParser = require('body-parser');
const routes = require('./routes');

// Configuración del certificado (ajusta las rutas según tu configuración)
const privateKey = fs.readFileSync('/etc/nginx/ssl/key.pem', 'utf8');
const certificate = fs.readFileSync('/etc/nginx/ssl/cert.pem', 'utf8');
const credentials = { key: privateKey, cert: certificate };

const app = express();

// Configuración Swagger (original)
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de Usuarios',
      version: '1.0.0',
      description: 'API para gestión de usuarios con autenticación',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 4000}`,
        description: 'Servidor local HTTP'
      },
      {
        url: `https://localhost:${process.env.HTTPS_PORT || 4001}`,
        description: 'Servidor local HTTPS'
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./routes.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Middlewares originales
app.use(bodyParser.json());
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// Rutas originales
app.use('/api', routes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Puertos
const HTTP_PORT = process.env.PORT || 4000;
const HTTPS_PORT = process.env.HTTPS_PORT || 4001;

// Servidor HTTP (original)
http.createServer(app).listen(HTTP_PORT, () => {
  console.log(`Servidor HTTP escuchando en puerto ${HTTP_PORT}`);
  console.log(`Documentación Swagger (HTTP) disponible en: http://localhost:${HTTP_PORT}/api-docs`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`El puerto HTTP ${HTTP_PORT} ya está en uso.`);
  } else {
    console.error('Error al iniciar servidor HTTP:', err.message);
  }
});

// Servidor HTTPS (nuevo)
https.createServer(credentials, app).listen(HTTPS_PORT, () => {
  console.log(`Servidor HTTPS escuchando en puerto ${HTTPS_PORT}`);
  console.log(`Documentación Swagger (HTTPS) disponible en: https://localhost:${HTTPS_PORT}/api-docs`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`El puerto HTTPS ${HTTPS_PORT} ya está en uso.`);
  } else {
    console.error('Error al iniciar servidor HTTPS:', err.message);
  }
});