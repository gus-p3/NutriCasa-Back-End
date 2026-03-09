import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db';
import authRoutes from './routes/authRoutes';
import morgan from 'morgan';



dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Rutas
app.use('/api/auth', authRoutes);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`⭐ Servidor corriendo en puerto ${PORT}`));

export default app;