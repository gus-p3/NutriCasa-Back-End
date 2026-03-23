import express, { Application } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import morgan from 'morgan';
import connectDB from './config/db';

// Imports de Rutas
import authRoutes from './routes/authRoutes';
import inventoryRoutes from './routes/inventoryRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import recipesRoutes from './routes/recipes/recipes.routes';
import feedbackRoutes from './routes/feedback/feedback.routes';
import historyRoutes from './routes/history/history.routes';


import aiRoutes from './routes/iaRecipe/recipe_ia.routes';

class Server {
    public app: Application;

    constructor() {
        dotenv.config();
        this.app = express();
        this.config();
        this.routes();
    }

    private async config(): Promise<void> {
        // Configuraciones de puerto
        this.app.set('port', process.env.PORT || 3000);

        // Middlewares
        this.app.use(morgan('dev'));
        this.app.use(cors({
            origin: ['http://localhost:5173', 'https://nutricasa-front-end-production.up.railway.app'],
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization'],
        }));
        this.app.use(express.json({ limit: '30mb' })); 
        this.app.use(express.urlencoded({ extended: false }));
        this.app.use(cookieParser());
    }

    private routes(): void {
        // Health check
        this.app.get('/health', (req, res) => {
            res.status(200).json({
                status: 'OK',
                timestamp: new Date().toISOString(),
                environment: process.env.NODE_ENV,
            });
        });

        // Rutas de la API
        this.app.use('/api/auth', authRoutes);
        this.app.use('/api/inventory', inventoryRoutes);
        this.app.use('/api/recipes', recipesRoutes);6
        this.app.use('/api/dashboard', dashboardRoutes);
        this.app.use('/api/feedback', feedbackRoutes);
        this.app.use('/api/history', historyRoutes);

        this.app.use('/api/ai', aiRoutes);

        // Manejo de rutas no encontradas (404)
        this.app.use((req, res) => {
            res.status(404).json({ message: 'Ruta no encontrada en Nutricasa' });
        });
    }

    public async start(): Promise<void> {
        try {
            await connectDB();
            const PORT = this.app.get('port');
            this.app.listen(PORT, '0.0.0.0', () => {
                console.log(`⭐ Servidor Nutricasa corriendo en puerto ${PORT}`);
            });
        } catch (error) {
            console.error('❌ Error al iniciar el servidor:', error);
        }
    }
}

const server = new Server();
server.start();

export default server.app;