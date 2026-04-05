//recipes.services.ts
import User from '../../models/User.model';
import Inventory from '../../models/Inventory.model';
import Recipe from '../../models/Recipe.model';
import CookingHistory from '../../models/CookingHistory.model';
import NutritionLog from '../../models/NutritionLog.model';

interface IngredientStatus {
    name: string;
    requiredQuantity: number;
    unit: string;
    status: 'green' | 'yellow' | 'red';
    availableQuantity?: number;
    alternativeUsed?: string;
}

interface SuggestedRecipeResult {
    _id: string;
    title: string;
    description: string;
    imageUrl: string;
    category: string;
    dietTypes: string[];
    allergens: string[];
    ingredients: IngredientStatus[];
    nutrition: any;
    prepTimeMinutes: number;
    estimatedCost: number;
    difficulty: string;
    ratings: any;
    matchScore: number;
}

export class RecipesService {
    /**
     * Normaliza un nombre de ingrediente para búsqueda con regex
     * - Convierte a minúsculas
     * - Elimina tildes y diacríticos
     * - Maneja plurales y variaciones comunes
     */
    private static normalizeIngredientName(name: string): string {
        return name
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") // Elimina tildes
            .replace(/[-\s]/g, " ") // Normaliza espacios
            .trim();
    }

    /**
     * Crea un patrón regex para buscar un ingrediente
     * Detecta plurales y variaciones comunes
     */
    private static createIngredientRegex(ingredientName: string): RegExp {
        const normalized = this.normalizeIngredientName(ingredientName);

        // Palabras comunes que pueden aparecer
        const variations = [
            normalized,
            normalized.replace(/s$/, ''), // quita plural
            normalized + 's', // añade plural
            normalized.replace(/e$/, '') // quita 'e' final (ej. huevo -> huev)
        ];

        // Crear regex que coincida con cualquiera de las variaciones
        const uniqueVariations = [...new Set(variations)];
        const pattern = uniqueVariations.join('|');

        return new RegExp(`^(${pattern})$`, 'i');
    }

    /**
     * Convierte cantidades entre unidades compatibles
     */
    private static convertQuantity(
        quantity: number,
        fromUnit: string,
        toUnit: string
    ): number | null {
        // Normalizar unidades comunes
        const normalizeUnit = (u: string) => {
            if (!u) return '';
            const low = u.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
            if (['pieza', 'piezas', 'pza', 'pzas', 'pz'].includes(low)) return 'piezas';
            if (['taza', 'tazas', 'tz', 'tzs'].includes(low)) return 'tazas';
            if (['cucharada', 'cucharadas', 'cda', 'cdas'].includes(low)) return 'cucharadas';
            if (['cucharadita', 'cucharaditas', 'cdita', 'cditas'].includes(low)) return 'cucharaditas';
            if (['gramo', 'gramos', 'gr', 'g'].includes(low)) return 'g';
            if (['kilo', 'kilos', 'kilogramo', 'kilogramos', 'kg'].includes(low)) return 'kg';
            if (['mililitro', 'mililitros', 'ml'].includes(low)) return 'ml';
            if (['litro', 'litros', 'l'].includes(low)) return 'l';
            return low;
        };

        const from = normalizeUnit(fromUnit);
        const to = normalizeUnit(toUnit);

        // Misma unidad
        if (from === to) return quantity;

        // Conversiones de masa
        if (from === 'kg' && to === 'g') return quantity * 1000;
        if (from === 'g' && to === 'kg') return quantity / 1000;

        // Conversiones de volumen
        if (from === 'l' && to === 'ml') return quantity * 1000;
        if (from === 'ml' && to === 'l') return quantity / 1000;

        // Unidades no convertibles
        return null;
    }

    /**
     * Evalúa la disponibilidad de los ingredientes de una receta en el inventario
     * Usa regex para mejor coincidencia
     */
    private static evaluateIngredients(
        recipeIngredients: any[],
        inventoryItems: any[]
    ): IngredientStatus[] {
        return recipeIngredients.map(ing => {
            // 1. Buscar ingrediente principal con regex
            const regex = this.createIngredientRegex(ing.name);

            // Buscar en inventario (case insensitive con regex)
            const inventoryItem = inventoryItems.find(item =>
                regex.test(this.normalizeIngredientName(item.name))
            );

            let status: 'green' | 'yellow' | 'red' = 'red';
            let availableQuantity = 0;
            let alternativeUsed = undefined;
            let matchedItem = inventoryItem;

            if (inventoryItem) {
                // Verificar si la cantidad es suficiente (considerando conversiones)
                const convertedQty = this.convertQuantity(
                    inventoryItem.quantity,
                    inventoryItem.unit,
                    ing.unit
                );

                if (convertedQty !== null && convertedQty >= ing.quantity) {
                    status = 'green';
                    availableQuantity = inventoryItem.quantity;
                } else if (convertedQty !== null && convertedQty > 0) {
                    // Tiene pero no es suficiente
                    status = 'red';
                    availableQuantity = inventoryItem.quantity;
                }
            }

            // 2. Si no encontró el principal, buscar en alternativas
            if (!inventoryItem) {
                const alternatives = ing.alternatives || [];

                for (const alt of alternatives) {
                    const altRegex = this.createIngredientRegex(alt);
                    const altItem = inventoryItems.find(item =>
                        altRegex.test(this.normalizeIngredientName(item.name))
                    );

                    if (altItem) {
                        const convertedQty = this.convertQuantity(
                            altItem.quantity,
                            altItem.unit,
                            ing.unit
                        );

                        if (convertedQty !== null && convertedQty >= ing.quantity) {
                            status = 'yellow';
                            alternativeUsed = alt;
                            availableQuantity = altItem.quantity;
                            matchedItem = altItem;
                            break;
                        }
                    }
                }
            }

            return {
                name: ing.name,
                requiredQuantity: ing.quantity,
                unit: ing.unit,
                status,
                availableQuantity: status !== 'red' ? availableQuantity : undefined,
                alternativeUsed
            };
        });
    }

    /**
     * Obtiene recetas sugeridas para un usuario basado en su perfil e inventario
     */
    static async getSuggestedRecipes(userId: string, limit: number = 20): Promise<SuggestedRecipeResult[]> {
        // 1. Obtener usuario y su inventario
        const user = await User.findById(userId).lean();
        if (!user) throw new Error('Usuario no encontrado');


        const inventory = await Inventory.findOne({ userId }).lean();

        // 2. Construir filtros base según perfil
        const dietType = user.profile.dietType;
        const allergies = user.profile.allergies || [];
        const weeklyBudget = user.weeklyBudget || 0;

        const query: any = {};

        // Filtro por dieta (si no es custom)
        if (dietType !== 'custom') {
            query.dietTypes = dietType;
        }

        // Excluir alérgenos
        if (allergies.length > 0) {
            query.allergens = { $nin: allergies };
        }

        // Filtro por presupuesto semanal (si es > 0)
        if (weeklyBudget > 0) {
            query.estimatedCost = { $lte: weeklyBudget };
        }

        // 3. Obtener recetas candidatas (limitamos a 100 para evitar sobrecarga)
        const recipes = await Recipe.find(query).limit(100).lean();

        // 4. Evaluar cada receta contra el inventario
        const results: SuggestedRecipeResult[] = [];

        for (const recipe of recipes) {

            const ingredientsStatus = this.evaluateIngredients(recipe.ingredients, inventory?.items || []);
            const total = recipe.ingredients.length;
            const greenCount = ingredientsStatus.filter(i => i.status === 'green').length;
            const matchScore = total > 0 ? Math.round((greenCount / total) * 100) : 0;

            results.push({
                _id: recipe._id.toString(),
                title: recipe.title,
                description: recipe.description,
                imageUrl: recipe.imageUrl ?? '',
                category: recipe.category,
                dietTypes: recipe.dietTypes,
                allergens: recipe.allergens,
                ingredients: ingredientsStatus,
                nutrition: recipe.nutrition,
                prepTimeMinutes: recipe.prepTimeMinutes,
                estimatedCost: recipe.estimatedCost,
                difficulty: recipe.difficulty ?? 'fácil',
                ratings: recipe.ratings,
                matchScore
            });
        }

        // 5. Ordenar por matchScore descendente y limitar
        results.sort((a, b) => b.matchScore - a.matchScore);
        return results.slice(0, limit);
    }

    // ==================== BÚSQUEDA ====================

    /**
     * Busca recetas aplicando filtros y paginación
     */
    static async searchRecipes(
        userId: string,  // ← AGREGAR userId como parámetro
        filters: any,
        pagination: { pagina: number; limite: number; ordenarPor?: string; orden?: 'asc' | 'desc' }
    ) {
        // 1. Obtener inventario del usuario para calcular matchScore
        const inventory = await Inventory.findOne({ userId }).lean();

        const query: any = {};

        // Búsqueda por texto (título o descripción)
        if (filters.q) {
            query.$or = [
                { title: { $regex: filters.q, $options: 'i' } },
                { description: { $regex: filters.q, $options: 'i' } }
            ];
        }

        // Filtro por categoría
        if (filters.category) {
            query.category = filters.category;
        }

        // Tiempo máximo de preparación
        if (filters.maxPrepTime) {
            query.prepTimeMinutes = { $lte: Number(filters.maxPrepTime) };
        }

        // Costo máximo
        if (filters.maxCost) {
            query.estimatedCost = { $lte: Number(filters.maxCost) };
        }

        // Tipo de dieta
        if (filters.dietType) {
            query.dietTypes = filters.dietType;
        }

        // Dificultad
        if (filters.difficulty) {
            query.difficulty = filters.difficulty;
        }

        // Filtrar por ingredientes (lista separada por comas)
        if (filters.ingredients) {
            const ingList = filters.ingredients.split(',').map((i: string) => i.trim());
            query['ingredients.name'] = { $in: ingList };
        }

        const skip = (pagination.pagina - 1) * pagination.limite;
        const sortDirection = pagination.orden === 'desc' ? -1 : 1;
        const sort: any = {};
        if (pagination.ordenarPor) {
            sort[pagination.ordenarPor] = sortDirection;
        } else {
            sort.createdAt = -1;
        }

        // Obtener recetas
        const recipes = await Recipe.find(query).sort(sort).skip(skip).limit(pagination.limite).lean();
        const total = await Recipe.countDocuments(query);

        // ✅ CALCULAR matchScore PARA CADA RECETA USANDO EL INVENTARIO
        const recipesWithScore = recipes.map(recipe => {
            const ingredientsStatus = this.evaluateIngredients(recipe.ingredients, inventory?.items || []);
            const total = recipe.ingredients.length;
            const greenCount = ingredientsStatus.filter(i => i.status === 'green').length;
            const matchScore = total > 0 ? Math.round((greenCount / total) * 100) : 0;

            return {
                ...recipe,
                _id: recipe._id.toString(),
                ingredients: ingredientsStatus, // Incluir estado de ingredientes
                matchScore
            };
        });

        const totalPaginas = Math.ceil(total / pagination.limite);

        return {
            data: recipesWithScore,
            paginacion: {
                pagina_actual: pagination.pagina,
                total_paginas: totalPaginas,
                total_items: total,
                limite: pagination.limite,
                tiene_siguiente: pagination.pagina < totalPaginas,
                tiene_anterior: pagination.pagina > 1
            }
        };
    }

    // ==================== DETALLE DE RECETA ====================

    /**
     * Obtiene una receta por su ID (sin datos de inventario)
     */
    static async getRecipeById(recipeId: string) {
        const recipe = await Recipe.findById(recipeId).lean();
        if (!recipe) {
            throw new Error('Receta no encontrada');
        }
        return {
            ...recipe,
            _id: recipe._id.toString()
        };
    }

    /**
     * Obtiene el detalle completo de una receta con información del inventario del usuario
     */
    static async getRecipeWithInventory(recipeId: string, userId: string) {
        // 1. Obtener la receta
        const recipe = await Recipe.findById(recipeId).lean();
        if (!recipe) {
            throw new Error('Receta no encontrada');
        }

        // 2. Obtener inventario del usuario
        const inventory = await Inventory.findOne({ userId }).lean();

        // 3. Evaluar ingredientes contra el inventario
        const ingredientsStatus = this.evaluateIngredients(recipe.ingredients, inventory?.items || []);

        // 4. Calcular matchScore
        const total = recipe.ingredients.length;
        const greenCount = ingredientsStatus.filter(i => i.status === 'green').length;
        const matchScore = total > 0 ? Math.round((greenCount / total) * 100) : 0;

        // 5. Obtener calorías diarias del usuario
        const user = await User.findById(userId).lean();
        const dailyCalories = user?.profile?.dailyCalories || 2000;

        // 6. Calcular costo de ingredientes faltantes
        const missingIngredients = ingredientsStatus.filter(i => i.status === 'red');
        const missingCount = missingIngredients.length;
        const missingCost = missingCount > 0
            ? Math.round((missingCount / recipe.ingredients.length) * recipe.estimatedCost)
            : 0;

        // 7. Enriquecer la receta con la información del inventario
        const enrichedRecipe = {
            ...recipe,
            _id: recipe._id.toString(),
            ingredients: ingredientsStatus,
            matchScore,
            missingIngredientsCount: missingCount,
            missingCost,
            userDailyCalories: dailyCalories,
            caloriesPercentage: Math.round((recipe.nutrition.calories / dailyCalories) * 100)
        };

        return enrichedRecipe;
    }

    // ==================== MODO COCINA ====================

    /**
     * Obtiene la receta con sus pasos para el modo cocina
     */
    static async getRecipeForCooking(recipeId: string, userId: string) {
        // 1. Obtener la receta
        const recipe = await Recipe.findById(recipeId).lean();
        if (!recipe) {
            throw new Error('Receta no encontrada');
        }

        // 2. Obtener inventario del usuario
        const inventory = await Inventory.findOne({ userId }).lean();

        // 3. Evaluar ingredientes para mostrar disponibilidad
        const ingredientsStatus = this.evaluateIngredients(recipe.ingredients, inventory?.items || []);

        // 4. Verificar si el usuario tiene todos los ingredientes necesarios
        const missingIngredients = ingredientsStatus.filter(i => i.status === 'red');
        const hasAllIngredients = missingIngredients.length === 0;

        // 5. Preparar los pasos con temporizadores
        const stepsWithTimers = recipe.steps.map(step => ({
            stepNumber: step.stepNumber,
            description: step.description,
            timerSeconds: step.timerSeconds || 0,
            detailedNote: step.detailedNote || '',
            hasTimer: step.timerSeconds ? step.timerSeconds > 0 : false,
            completed: false
        }));

        // 6. Calcular tiempo total
        const totalTime = recipe.steps.reduce((acc, step) => acc + (step.timerSeconds || 0), 0);

        return {
            _id: recipe._id.toString(),
            title: recipe.title,
            description: recipe.description,
            imageUrl: recipe.imageUrl,
            category: recipe.category,
            difficulty: recipe.difficulty,
            prepTimeMinutes: recipe.prepTimeMinutes,
            estimatedCost: recipe.estimatedCost,
            nutrition: recipe.nutrition,
            ingredients: ingredientsStatus,
            steps: stepsWithTimers,
            hasAllIngredients,
            missingIngredientsCount: missingIngredients.length,
            missingIngredients: missingIngredients.map(i => i.name),
            totalTimeSeconds: totalTime,
            totalTimeMinutes: Math.ceil(totalTime / 60)
        };
    }

    static async completeRecipe(recipeId: string, userId: string) {
        // 1. Obtener la receta
        const recipe = await Recipe.findById(recipeId).lean();
        if (!recipe) {
            throw new Error('Receta no encontrada');
        }

        // 1.5 Obtener usuario para conocer sus metas
        const user = await User.findById(userId).lean();
        if (!user) throw new Error('Usuario no encontrado');
        const dailyCaloriesGoal = user.profile?.dailyCalories ?? 2000;

        // 2. Obtener inventario del usuario
        const inventory = await Inventory.findOne({ userId });
        if (!inventory) {
            throw new Error('Inventario no encontrado');
        }

        // 3. Descontar ingredientes del inventario
        for (const ingredient of recipe.ingredients) {
            const regex = this.createIngredientRegex(ingredient.name);

            const inventoryItem = inventory.items.find(item =>
                regex.test(this.normalizeIngredientName(item.name))
            );

            if (inventoryItem) {
                // Si tiene el ingrediente principal, descontar
                inventoryItem.quantity -= ingredient.quantity;

                // Si la cantidad llega a cero o menos, eliminar del inventario
                if (inventoryItem.quantity <= 0) {
                    inventory.items = inventory.items.filter(
                        item => item._id?.toString() !== inventoryItem._id?.toString()
                    );
                }
            } else {
                // Buscar en alternativas
                const alternatives = ingredient.alternatives || [];
                for (const alt of alternatives) {
                    const altRegex = this.createIngredientRegex(alt);
                    const altItem = inventory.items.find(item =>
                        altRegex.test(this.normalizeIngredientName(item.name))
                    );

                    if (altItem && altItem.quantity >= ingredient.quantity) {
                        altItem.quantity -= ingredient.quantity;
                        if (altItem.quantity <= 0) {
                            inventory.items = inventory.items.filter(
                                item => item._id?.toString() !== altItem._id?.toString()
                            );
                        }
                        break;
                    }
                }
            }
        }

        // 4. Guardar inventario actualizado
        inventory.updatedAt = new Date();
        await inventory.save();

        // 5. Determinar mealTime basado en la hora actual
        const hour = new Date().getHours();
        let mealTime: 'desayuno' | 'comida' | 'cena' | 'snack';
        if (hour >= 6 && hour < 12) mealTime = 'desayuno';
        else if (hour >= 12 && hour < 17) mealTime = 'comida';
        else if (hour >= 17 && hour < 22) mealTime = 'cena';
        else mealTime = 'snack';

        // 6. Crear entrada en CookingHistory
        const ingredientsUsed = recipe.ingredients.map((ing: any) => ({
            name: ing.name,
            quantityUsed: ing.quantity,
            unit: ing.unit,
            leftover: 0
        }));

        await CookingHistory.create({
            userId,
            recipeId,
            recipeName: recipe.title,
            cookedAt: new Date(),
            rating: 0,
            ingredientsUsed,
            estimatedCost: recipe.estimatedCost,
            caloriesConsumed: recipe.nutrition.calories,
            mealTime,
        });

        // 7. Actualizar NutritionLog
        const now = new Date();
        const getWeekStart = (): Date => {
            const today = new Date(now);
            const day = today.getDay();
            const diff = day === 0 ? -6 : 1 - day;
            const monday = new Date(today);
            monday.setDate(today.getDate() + diff);
            monday.setHours(0, 0, 0, 0);
            return monday;
        };
        const weekStart = getWeekStart();
        const toMidnight = (date: Date): Date => {
            const d = new Date(date);
            d.setHours(0, 0, 0, 0);
            return d;
        };
        const todayMidnight = toMidnight(now);

        let nutritionLog = await NutritionLog.findOne({ userId, weekStart });
        if (!nutritionLog) {
            nutritionLog = new NutritionLog({ userId, weekStart, days: [] });
        }

        let todayLogObj = nutritionLog.days.find(d => toMidnight(d.date).getTime() === todayMidnight.getTime());
        if (!todayLogObj) {
            nutritionLog.days.push({
                date: todayMidnight,
                caloriesConsumed: 0,
                macros: { protein: 0, carbs: 0, fat: 0 },
                meals: [],
                goalMet: false
            });
            todayLogObj = nutritionLog.days[nutritionLog.days.length - 1];
        }

        // Agregar comida a hoy
        todayLogObj.meals.push({
            recipeId: (recipe as any)._id,
            recipeName: recipe.title,
            calories: recipe.nutrition.calories,
            mealTime,
            cookedAt: now
        } as any);

        todayLogObj.caloriesConsumed = (todayLogObj.caloriesConsumed || 0) + recipe.nutrition.calories;
        todayLogObj.macros.protein += recipe.nutrition.protein || 0;
        todayLogObj.macros.carbs += recipe.nutrition.carbs || 0;
        todayLogObj.macros.fat += recipe.nutrition.fat || 0;

        // Recalcular goalMet para hoy
        const pct = (todayLogObj.caloriesConsumed / dailyCaloriesGoal) * 100;
        todayLogObj.goalMet = pct >= 90 && pct <= 110;

        await nutritionLog.save();

        return {
            success: true,
            message: 'Receta completada y agregada al progreso del Dashboard.',
            remainingItems: inventory.items.length
        };
    }

    /**
     * Verifica si el usuario tiene todos los ingredientes para una receta
     */
    static async checkIngredientsAvailability(recipeId: string, userId: string) {
        const recipe = await Recipe.findById(recipeId).lean();
        if (!recipe) {
            throw new Error('Receta no encontrada');
        }

        const inventory = await Inventory.findOne({ userId }).lean();
        const ingredientsStatus = this.evaluateIngredients(recipe.ingredients, inventory?.items || []);

        const missing = ingredientsStatus.filter(i => i.status === 'red');
        const available = ingredientsStatus.filter(i => i.status === 'green' || i.status === 'yellow');

        return {
            recipeId,
            totalIngredients: recipe.ingredients.length,
            availableCount: available.length,
            missingCount: missing.length,
            hasAllIngredients: missing.length === 0,
            missingIngredients: missing.map(i => ({
                name: i.name,
                requiredQuantity: i.requiredQuantity,
                unit: i.unit
            })),
            ingredients: ingredientsStatus
        };
    }

    // ==================== SUSTITUCIÓN DE INGREDIENTES ====================

    /**
     * Obtiene las alternativas de un ingrediente con disponibilidad en la alacena
     * GET /api/recipes/:id/alternatives?ingredientName=...
     */
    static async getIngredientAlternatives(recipeId: string, userId: string, ingredientName: string) {
        // 1. Obtener la receta
        const recipe = await Recipe.findById(recipeId).lean();
        if (!recipe) throw new Error('Receta no encontrada');

        // 2. Buscar el ingrediente en la receta (con regex para tildes/plurales)
        const searchRegex = this.createIngredientRegex(ingredientName);
        const ingredient  = recipe.ingredients.find(ing =>
            searchRegex.test(this.normalizeIngredientName(ing.name))
        );

        if (!ingredient) {
            throw new Error(`Ingrediente "${ingredientName}" no encontrado en esta receta`);
        }

        // 3. Si no tiene alternativas registradas
        if (!ingredient.alternatives || ingredient.alternatives.length === 0) {
            return {
                ingredientName:   ingredient.name,
                requiredQuantity: ingredient.quantity,
                unit:             ingredient.unit,
                alternatives:     [],
                message:          'Este ingrediente no tiene sustitutos registrados',
            };
        }

        // 4. Obtener inventario del usuario
        const inventory = await Inventory.findOne({ userId }).lean();
        const items      = inventory?.items || [];

        // 5. Evaluar disponibilidad de cada alternativa en la alacena
        const alternativesWithStatus = ingredient.alternatives.map(alt => {
            const altRegex    = this.createIngredientRegex(alt);
            const altItem     = items.find(item =>
                altRegex.test(this.normalizeIngredientName(item.name))
            );

            const available   = altItem?.quantity ?? 0;
            const unit        = altItem?.unit     ?? '—';

            // Convertir si las unidades son distintas
            const convertedQty = altItem
                ? this.convertQuantity(available, altItem.unit, ingredient.unit)
                : null;

            let status: 'green' | 'yellow' | 'red' = 'red';
            if (convertedQty !== null && convertedQty >= ingredient.quantity) {
                status = 'green';
            } else if (convertedQty !== null && convertedQty > 0) {
                status = 'yellow';
            }

            return {
                name:             alt,
                availableQuantity: available > 0 ? available : undefined,
                unit,
                status,
                inPantry:         available > 0,
                isSufficient:     status === 'green',
            };
        });

        // 6. Ordenar: green → yellow → red
        const order = { green: 0, yellow: 1, red: 2 };
        alternativesWithStatus.sort((a, b) => order[a.status] - order[b.status]);

        return {
            ingredientName:   ingredient.name,
            requiredQuantity: ingredient.quantity,
            unit:             ingredient.unit,
            totalAlternatives: alternativesWithStatus.length,
            availableInPantry: alternativesWithStatus.filter(a => a.inPantry).length,
            alternatives:      alternativesWithStatus,
        };
    }
}