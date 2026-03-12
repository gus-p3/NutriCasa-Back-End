import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import connectDB from './config/db';
import authRoutes      from './routes/authRoutes';
import inventoryRoutes from './routes/inventoryRoutes';
import recipeRoutes    from './routes/recipeRoutes';
import dashboardRoutes from './routes/dashboardRoutes';

dotenv.config();
connectDB();

const app = express();

app.use(cors({
  origin: ['http://localhost:5173', 'https://nutricasa-front-end-production.up.railway.app'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(morgan('dev'));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// Rutas
app.use('/api/auth',      authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/recipes',   recipeRoutes);
app.use('/api/dashboard', dashboardRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

const PORT = process.env.PORT || 3000;
app.listen(Number(PORT), '0.0.0.0', () =>
  console.log(`⭐ Servidor corriendo en puerto ${PORT}`)
);

export default app;