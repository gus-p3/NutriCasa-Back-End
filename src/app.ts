import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db';
import authRoutes from './routes/authRoutes';
import morgan from 'morgan';

dotenv.config();
connectDB();

const app = express();

// Configuración CORS más específica
app.use(cors({
  origin: ['http://localhost:5173', 'https://nutricasa-front-end-production.up.railway.app'], // Agrega tu frontend
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middlewares
app.use(morgan('dev'));
app.use(express.json());

// Health check endpoint (IMPORTANTE para Railway)
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// Rutas
app.use('/api/auth', authRoutes);

// Manejo de errores 404
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

// IMPORTANTE: Railway necesita 0.0.0.0
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`⭐ Servidor corriendo en puerto ${PORT}`));

export default app;