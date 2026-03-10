import User from '../../models/User.model';
import Inventory from '../../models/Inventory.model';
import Recipe from '../../models/Recipe.model';

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
            query.allergens = { $not: { $in: allergies } };
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
            const matchScore = total > 0 ? (greenCount / total) * 100 : 0;

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
                difficulty: recipe.difficulty ?? 'facil',
                ratings: recipe.ratings,
                matchScore
            });
        }

        // 5. Ordenar por matchScore descendente y limitar
        results.sort((a, b) => b.matchScore - a.matchScore);
        return results.slice(0, limit);
    }

    /**
     * Evalúa la disponibilidad de los ingredientes de una receta en el inventario
     */
    private static evaluateIngredients(
        recipeIngredients: any[],
        inventoryItems: any[]
    ): IngredientStatus[] {
        return recipeIngredients.map(ing => {
            // Buscar ingrediente principal en inventario (case insensitive)
            const inventoryItem = inventoryItems.find(
                item => item.name.toLowerCase() === ing.name.toLowerCase()
            );

            let status: 'green' | 'yellow' | 'red' = 'red';
            let availableQuantity = 0;
            let alternativeUsed = undefined;

            if (inventoryItem) {
                availableQuantity = inventoryItem.quantity;
                // Misma unidad y cantidad suficiente → verde
                if (inventoryItem.unit === ing.unit && inventoryItem.quantity >= ing.quantity) {
                    status = 'green';
                } else {
                    // Misma unidad pero insuficiente, o unidad diferente → rojo (por simplicidad)
                    status = 'red';
                }
            } else {
                // Buscar en alternativas
                const alternatives = ing.alternatives || [];
                for (const alt of alternatives) {
                    const altItem = inventoryItems.find(
                        item => item.name.toLowerCase() === alt.toLowerCase()
                    );
                    if (altItem && altItem.unit === ing.unit && altItem.quantity >= ing.quantity) {
                        status = 'yellow';
                        alternativeUsed = alt;
                        availableQuantity = altItem.quantity;
                        break;
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

    // ==================== BÚSQUEDA ====================

    /**
     * Busca recetas aplicando filtros y paginación
     */
    static async searchRecipes(
        filters: any,
        pagination: { pagina: number; limite: number; ordenarPor?: string; orden?: 'asc' | 'desc' }
    ) {
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
            sort.createdAt = -1; // por defecto más recientes
        }

        const [data, total] = await Promise.all([
            Recipe.find(query).sort(sort).skip(skip).limit(pagination.limite).lean(),
            Recipe.countDocuments(query)
        ]);

        const totalPaginas = Math.ceil(total / pagination.limite);

        return {
            data,
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
}