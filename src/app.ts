import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db';
import authRoutes from './routes/authRoutes';
import inventoryRoutes from './routes/inventoryRoutes';
import recipeRoutes    from './routes/recipeRoutes';



dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/recipes',   recipeRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`⭐ Servidor corriendo en puerto ${PORT}`));

export default app;