import rateLimit from 'express-rate-limit';

// Limitador global (200 peticiones por minuto)
export const globalLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, 
    max: 200, 
    message: { 
        message: 'Demasiadas peticiones, por favor intente más tarde.' 
    },
    standardHeaders: true, 
    legacyHeaders: false,
});

// Limitador estricto para inicio de sesión, registro (10 peticiones por 15 minutos)
export const strictAuthLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 10, 
    message: { 
        message: 'Demasiados intentos desde esta IP, por favor intente nuevamente después de 15 minutos.' 
    },
    standardHeaders: true, 
    legacyHeaders: false,
});
