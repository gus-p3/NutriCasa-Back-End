import CookingHistory from '../../models/CookingHistory.model';

export class HistoryService {

    /**
     * Obtiene todo el historial de recetas cocinadas por el usuario
     * Ordenado por fecha más reciente primero
     */
    static async getUserHistory(userId: string) {
        const history = await CookingHistory
            .find({ userId })
            .sort({ cookedAt: -1 })
            .populate('recipeId', 'title imageUrl category nutrition difficulty')
            .lean();

        if (!history || history.length === 0) {
            return {
                total:   0,
                history: [],
            };
        }

        // Enriquecer cada entrada con datos útiles para el frontend
        const enriched = history.map(entry => ({
            _id:              entry._id.toString(),
            recipeId:         entry.recipeId,
            recipeName:       entry.recipeName,
            cookedAt:         entry.cookedAt,
            rating:           entry.rating,
            mealTime:         entry.mealTime,
            caloriesConsumed: entry.caloriesConsumed,
            estimatedCost:    entry.estimatedCost,
            ingredientsUsed:  entry.ingredientsUsed,
        }));

        return {
            total:   enriched.length,
            history: enriched,
        };
    }

    /**
     * Obtiene el detalle de una entrada específica del historial
     */
    static async getHistoryById(historyId: string, userId: string) {
        const entry = await CookingHistory
            .findOne({ _id: historyId, userId })
            .populate('recipeId', 'title imageUrl category nutrition difficulty prepTimeMinutes steps')
            .lean();

        if (!entry) throw new Error('Entrada del historial no encontrada');

        return {
            _id:              entry._id.toString(),
            recipeId:         entry.recipeId,
            recipeName:       entry.recipeName,
            cookedAt:         entry.cookedAt,
            rating:           entry.rating,
            mealTime:         entry.mealTime,
            caloriesConsumed: entry.caloriesConsumed,
            estimatedCost:    entry.estimatedCost,
            ingredientsUsed:  entry.ingredientsUsed,
        };
    }

    /**
     * Estadísticas básicas del historial para la pantalla de progreso
     */
    static async getUserStats(userId: string) {
        const history = await CookingHistory
            .find({ userId })
            .lean();

        if (history.length === 0) {
            return {
                totalRecipes:    0,
                averageRating:   0,
                totalCalories:   0,
                totalSpent:      0,
                favoriteCategory: null,
                byMealTime:      { desayuno: 0, comida: 0, cena: 0, snack: 0 },
            };
        }

        const totalCalories = history.reduce((sum, e) => sum + e.caloriesConsumed, 0);
        const totalSpent    = history.reduce((sum, e) => sum + e.estimatedCost, 0);
        const avgRating     = parseFloat(
            (history.reduce((sum, e) => sum + e.rating, 0) / history.length).toFixed(1)
        );

        // Contar por mealTime
        const byMealTime = history.reduce((acc, e) => {
            acc[e.mealTime] = (acc[e.mealTime] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        // Categoría más cocinada (requiere populate)
        const withRecipe = await CookingHistory
            .find({ userId })
            .populate('recipeId', 'category')
            .lean();

        const categoryCount: Record<string, number> = {};
        withRecipe.forEach(e => {
            const cat = (e.recipeId as any)?.category;
            if (cat) categoryCount[cat] = (categoryCount[cat] || 0) + 1;
        });
        const favoriteCategory = Object.keys(categoryCount).sort(
            (a, b) => categoryCount[b] - categoryCount[a]
        )[0] ?? null;

        return {
            totalRecipes:     history.length,
            averageRating:    avgRating,
            totalCalories,
            totalSpent:       parseFloat(totalSpent.toFixed(2)),
            favoriteCategory,
            byMealTime: {
                desayuno: byMealTime['desayuno'] || 0,
                comida:   byMealTime['comida']   || 0,
                cena:     byMealTime['cena']     || 0,
                snack:    byMealTime['snack']    || 0,
            },
        };
    }
}