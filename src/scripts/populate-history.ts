import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.model';
import Recipe from '../models/Recipe.model';
import CookingHistory from '../models/CookingHistory.model';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Script para poblar la base de datos con un usuario de prueba
 * y su historial de recetas (las primeras 5 recetas disponibles)
 */
async function populateUserWithHistory() {
    try {
        // Conectar a MongoDB
        await mongoose.connect(process.env.MONGO_URI!);
        console.log('✅ Conectado a MongoDB');

        // 1. Crear usuario de prueba
        const testUser = {
            name: 'Usuario Test',
            email: 'test@example.com',
            password: 'password123',
            role: 'user' as const,
            profile: {
                age: 28,
                weight: 70,
                height: 170,
                activityLevel: 'medium' as const,
                goal: 'maintain' as const,
                dietType: 'normal' as const,
                allergies: ['nueces', 'mariscos'],
                dailyCalories: 2200,
                macros: {
                    protein: 150,
                    carbs: 250,
                    fat: 70
                }
            },
            weeklyBudget: 1500
        };

        // Verificar si el usuario ya existe
        let user = await User.findOne({ email: testUser.email });
        
        if (!user) {
            // Encriptar contraseña manualmente para el script
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(testUser.password, salt);
            
            user = await User.create({
                ...testUser,
                password: hashedPassword
            });
            console.log('✅ Usuario creado:', user.email);
        } else {
            console.log('ℹ️ Usuario ya existe:', user.email);
        }

        // 2. Obtener las primeras 5 recetas disponibles
        const recipes = await Recipe.find().limit(5).lean();
        
        if (recipes.length === 0) {
            console.log('❌ No hay recetas disponibles en la base de datos');
            process.exit(1);
        }

        console.log(`📚 Encontradas ${recipes.length} recetas`);

        // 3. Eliminar historial previo del usuario (opcional)
        await CookingHistory.deleteMany({ userId: user._id });
        console.log('🧹 Historial anterior eliminado');

        // 4. Crear historial para cada receta
        const mealTimes = ['desayuno', 'comida', 'cena', 'snack'] as const;
        const historyEntries = [];

        for (let i = 0; i < recipes.length; i++) {
            const recipe = recipes[i];
            
            // Generar fecha aleatoria en los últimos 30 días
            const cookedAt = new Date();
            cookedAt.setDate(cookedAt.getDate() - Math.floor(Math.random() * 30));

            // Preparar ingredientes usados
            const ingredientsUsed = recipe.ingredients.map(ing => ({
                name: ing.name,
                quantityUsed: ing.quantity,
                unit: ing.unit,
                leftover: Math.random() > 0.7 ? Math.floor(ing.quantity * 0.2) : 0 // 30% de probabilidad de sobrante
            }));

            // Crear entrada de historial
            const historyEntry = {
                userId: user._id,
                recipeId: recipe._id,
                recipeName: recipe.title,
                cookedAt,
                rating: Math.floor(Math.random() * 5) + 1, // Rating aleatorio 1-5
                ingredientsUsed,
                estimatedCost: recipe.estimatedCost,
                caloriesConsumed: recipe.nutrition.calories,
                mealTime: mealTimes[Math.floor(Math.random() * mealTimes.length)],
                createdAt: cookedAt
            };

            historyEntries.push(historyEntry);
        }

        // 5. Insertar todas las entradas de historial
        const createdHistory = await CookingHistory.insertMany(historyEntries);
        console.log(`✅ Creadas ${createdHistory.length} entradas en el historial`);

        // 6. Mostrar resumen
        console.log('\n📊 RESUMEN:');
        console.log('===========');
        console.log(`Usuario ID: ${user._id}`);
        console.log(`Email: ${user.email}`);
        console.log(`Password: ${testUser.password}`);
        console.log('\nHistorial creado:');
        
        createdHistory.forEach((history, index) => {
            console.log(`\n${index + 1}. ${history.recipeName}`);
            console.log(`   📅 Fecha: ${history.cookedAt.toLocaleDateString()}`);
            console.log(`   ⭐ Rating: ${history.rating}`);
            console.log(`   🍽️ Comida: ${history.mealTime}`);
            console.log(`   🔥 Calorías: ${history.caloriesConsumed}`);
            console.log(`   💰 Costo: $${history.estimatedCost}`);
        });

        console.log('\n✅ Script completado exitosamente');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

// Ejecutar script
populateUserWithHistory();