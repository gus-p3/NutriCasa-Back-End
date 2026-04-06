import express, { Application } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import http from 'http';
import https from 'https';
import helmet from 'helmet';
import connectDB from './config/db';

dotenv.config();

if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
    console.error('❌ FATAL ERROR: MONGO_URI y JWT_SECRET son obligatorios en las variables de entorno.');
    process.exit(1);
}

// Imports de Rutas
import authRoutes from './routes/authRoutes';
import inventoryRoutes from './routes/inventoryRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import recipesRoutes from './routes/recipes/recipes.routes';
import feedbackRoutes from './routes/feedback/feedback.routes';
import historyRoutes from './routes/history/history.routes';
import aiRoutes from './routes/iaRecipe/recipe_ia.routes';
import uploadRoutes from './routes/upload.routes';
import usersRoutes from './routes/users.routes';
import { globalLimiter } from './middlewares/rateLimitMiddleware';

class Server {
    public app: Application;

    constructor() {
        this.app = express();
        this.config();
        this.routes();
    }

    private async config(): Promise<void> {
        // Configuraciones de puerto
        this.app.set('port', process.env.PORT || 3000);

        // Seguridad con Helmet (CSP, X-Frame-Options, HSTS, etc.)
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    scriptSrc: ["'self'", "'unsafe-inline'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    imgSrc: ["'self'", "data:", "https:"],
                    connectSrc: ["'self'", "https:", "http:"],
                },
            },
            frameguard: { action: 'deny' }, // X-Frame-Options: DENY
            hidePoweredBy: true,
            hsts: {
                maxAge: 31536000, // 1 año en segundos
                includeSubDomains: true,
                preload: true
            },
            xContentTypeOptions: true, // nosniff
        }));

        this.app.use(morgan('dev'));

        // Forzar redirección HTTPS en Express
        this.app.use((req, res, next) => {
            // Si está siendo proxy por nginx/heroku que termine en HTTPS, o req.secure directo
            if (process.env.NODE_ENV === 'production' && !req.secure && req.headers['x-forwarded-proto'] !== 'https') {
                return res.redirect(301, 'https://' + req.headers.host + req.url);
            }
            next();
        });

        // Configurar CORS
        const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
        this.app.use(cors({
            origin: (origin, callback) => {
                // Listado de dominios locales/de produccion válidos
                const whitelist = [allowedOrigin, 'http://localhost:5173'];
                if (!origin || whitelist.includes(origin)) {
                    callback(null, true);
                } else {
                    callback(new Error('No permitido por CORS'));
                }
            },
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization'],
        }));
        this.app.use(express.json({ limit: '30mb' })); 
        this.app.use(express.urlencoded({ extended: false }));
        this.app.use(cookieParser());
        this.app.use(globalLimiter);
        
        // Servir archivos estáticos de la carpeta uploads
        this.app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
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
        this.app.use('/api/recipes', recipesRoutes);
        this.app.use('/api/dashboard', dashboardRoutes);
        this.app.use('/api/feedback', feedbackRoutes);
        this.app.use('/api/history', historyRoutes);
        this.app.use('/api/ai', aiRoutes);
        this.app.use('/api/upload', uploadRoutes);
        this.app.use('/api/users', usersRoutes);

        // Manejo de rutas no encontradas (404)
        this.app.use((req, res) => {
            res.status(404).json({ message: 'Ruta no encontrada en Nutricasa' });
        });
    }

    public async start(): Promise<void> {
        try {
            await connectDB();
            const PORT = this.app.get('port');

            // Leer rutas de Let's Encrypt o credenciales SSL
            const sslOptions = {
                key: fs.existsSync('/etc/letsencrypt/live/nutricasa/privkey.pem') 
                    ? fs.readFileSync('/etc/letsencrypt/live/nutricasa/privkey.pem') : undefined,
                cert: fs.existsSync('/etc/letsencrypt/live/nutricasa/fullchain.pem') 
                    ? fs.readFileSync('/etc/letsencrypt/live/nutricasa/fullchain.pem') : undefined,
            };

            // Arrancar HTTPS si están las llaves, sino HTTP estandar
            if (sslOptions.key && sslOptions.cert && process.env.NODE_ENV === 'production') {
                https.createServer(sslOptions, this.app).listen(443, '0.0.0.0', () => {
                   console.log('⭐ Servidor Nutricasa corriendo en modo HTTPS (443) protegido con Let\'s Encrypt');
                });
                
                // Servidor redireccionador en el puerto especificado u 80
                http.createServer(this.app).listen(PORT, '0.0.0.0', () => {
                    console.log(`⭐ Servidor Redireccionador HTTP corriendo en el puerto ${PORT}`);
                });
            } else {
                http.createServer(this.app).listen(PORT, '0.0.0.0', () => {
                    console.log(`⭐ Servidor Nutricasa corriendo en puerto HTTP inseguro ${PORT} (SSL no encontrado o entorno Dev)`);
                });
            }

        } catch (error) {
            console.error('❌ Error al iniciar el servidor:', error);
        }
    }
}

const server = new Server();
server.start();

export default server.app;