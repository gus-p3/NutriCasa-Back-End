//feedback.service.ts
import mongoose from 'mongoose';
import CookingHistory            from '../../models/CookingHistory.model';
import Inventory                 from '../../models/Inventory.model';
import NutritionLog              from '../../models/NutritionLog.model';
import Budget                    from '../../models/Budget.model';
import Recipe                    from '../../models/Recipe.model';
import { buildDashboardPayload } from '../../controllers/dashboardController';

interface IIngredientUsedInput {
  name: string;
  quantityUsed: number;
  unit: string;
  isFromPantry?: boolean;
  saveLeftover?: boolean;
  leftoverQuantity?: number;
}

interface IFeedbackInput {
  recipeId: string;
  rating: number;
  ingredientsUsed: IIngredientUsedInput[];
  mealTime: 'desayuno' | 'comida' | 'cena' | 'snack';
  nota?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const getWeekStart = (): Date => {
  const now  = new Date();
  const day  = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
};

const toMidnight = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

// ─── Normalizar nombre de ingrediente (quitar tildes, plurales simples) ───────
const normalizeString = (str: string): string => {
  if (!str) return '';
  let s = str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  if (s.endsWith('es') && s.length > 3) s = s.slice(0, -2);
  else if (s.endsWith('s') && s.length > 2) s = s.slice(0, -1);
  return s;
};

// ─── goalMet: cumplido si consumió entre 90 % y 110 % de la meta ─────────────
const calcGoalMet = (consumed: number, goal: number): boolean => {
  if (goal === 0) return false;
  const pct = (consumed / goal) * 100;
  return pct >= 90 && pct <= 110;
};

export class FeedbackService {

  static async submitFeedback(userId: string, input: IFeedbackInput) {
    const { recipeId, rating, ingredientsUsed, mealTime, nota } = input;

    // ── Validar receta ────────────────────────────────────────────────────────
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) throw new Error('Receta no encontrada');

    const weekStart = getWeekStart();
    const today     = toMidnight(new Date());

    // ── 1. Insertar en cookinghistories ───────────────────────────────────────
    const cookingHistory = await CookingHistory.create({
      userId,
      recipeId,
      recipeName:       recipe.title,
      cookedAt:         new Date(),
      rating,
      ingredientsUsed,
      estimatedCost:    recipe.estimatedCost,
      caloriesConsumed: recipe.nutrition.calories,
      mealTime,
    });

    // ── 2. Actualizar inventario ──────────────────────────────────────────────
    const inventory = await Inventory.findOne({ userId });
    if (inventory) {
      for (const used of ingredientsUsed) {
        const usedNameNorm  = normalizeString(used.name);
        const inventoryItem = inventory.items.find(
          item => normalizeString(item.name) === usedNameNorm,
        );

        if (used.isFromPantry) {
          if (inventoryItem) {
            inventoryItem.quantity -= used.quantityUsed;
            if (inventoryItem.quantity < 0) inventoryItem.quantity = 0;
          }
        } else {
          // Guardar sobrante si aplica
          if (used.saveLeftover && used.leftoverQuantity && used.leftoverQuantity > 0) {
            if (inventoryItem) {
              inventoryItem.quantity += used.leftoverQuantity;
            } else {
              const validUnits = ['g', 'kg', 'ml', 'l', 'piezas', 'tazas'];
              const safeUnit   = validUnits.includes(used.unit) ? used.unit : 'piezas';
              inventory.items.push({
                name:     used.name,
                quantity: used.leftoverQuantity,
                unit:     safeUnit as any,
                category: 'otro',
                addedAt:  new Date(),
              } as any);
            }
          }
        }
      }
      await inventory.save();
    }

    // ── 3. Actualizar nutritionlog ────────────────────────────────────────────
    let nutritionLog = await NutritionLog.findOne({ userId, weekStart });
    if (!nutritionLog) {
      nutritionLog = await NutritionLog.create({ userId, weekStart, days: [] });
    }

    // Necesitamos la meta calórica del usuario para recalcular goalMet
    const { default: User } = await import('../../models/User.model');
    const user              = await User.findById(userId);
    const dailyCaloriesGoal = user?.profile?.dailyCalories ?? 2000;

    const dayIndex = nutritionLog.days.findIndex(
      d => toMidnight(d.date).getTime() === today.getTime(),
    );

    const newMeal = {
      recipeId:   new mongoose.Types.ObjectId(recipeId),
      recipeName: recipe.title,
      calories:   recipe.nutrition.calories,
      mealTime,
      cookedAt:   new Date(),
    };

    if (dayIndex === -1) {
      // Primer registro del día
      const caloriesConsumed = recipe.nutrition.calories;
      nutritionLog.days.push({
        date:             today,
        caloriesConsumed,
        macros: {
          protein: recipe.nutrition.protein,
          carbs:   recipe.nutrition.carbs,
          fat:     recipe.nutrition.fat,
        },
        meals:   [newMeal],
        goalMet: calcGoalMet(caloriesConsumed, dailyCaloriesGoal),
      });
    } else {
      // Día existente — acumular y recalcular goalMet
      nutritionLog.days[dayIndex].caloriesConsumed =
        (nutritionLog.days[dayIndex].caloriesConsumed ?? 0) + recipe.nutrition.calories;
      nutritionLog.days[dayIndex].macros.protein += recipe.nutrition.protein;
      nutritionLog.days[dayIndex].macros.carbs   += recipe.nutrition.carbs;
      nutritionLog.days[dayIndex].macros.fat     += recipe.nutrition.fat;
      nutritionLog.days[dayIndex].meals.push(newMeal);

      // ← RECALCULAR goalMet con el total acumulado del día
      nutritionLog.days[dayIndex].goalMet = calcGoalMet(
        nutritionLog.days[dayIndex].caloriesConsumed!,
        dailyCaloriesGoal,
      );
    }

    await nutritionLog.save();

    // ── 4. Actualizar budget ──────────────────────────────────────────────────
    let budget = await Budget.findOne({ userId, weekStart });
    if (!budget) {
      budget = await Budget.create({
        userId,
        weekStart,
        weeklyLimit: user?.weeklyBudget ?? 0,
        expenses:    [],
        totalSpent:  0,
        remaining:   user?.weeklyBudget ?? 0,
      });
    }

    budget.expenses.push({
      description:  `${recipe.title} — ${mealTime}`,
      amount:       recipe.estimatedCost,
      recipeId:     new mongoose.Types.ObjectId(recipeId),
      registeredAt: new Date(),
    });
    budget.totalSpent += recipe.estimatedCost;
    budget.remaining   = Math.max(0, budget.weeklyLimit - budget.totalSpent);
    await budget.save();

    // ── 5. Actualizar ratings de la receta ────────────────────────────────────
    const newCount   = recipe.ratings.count + 1;
    const newAverage = parseFloat(
      ((recipe.ratings.average * recipe.ratings.count + rating) / newCount).toFixed(1),
    );
    const updatedRecipe = await Recipe.findByIdAndUpdate(
      recipeId,
      { $set: { 'ratings.average': newAverage, 'ratings.count': newCount } },
      { returnDocument: 'after' },
    );

    // ── 6. Recalcular y devolver dashboard actualizado ────────────────────────
    // El frontend puede sincronizar Zustand inmediatamente con este payload.
    const dashboard = await buildDashboardPayload(userId);

    return {
      cookingHistory,
      inventory:   await Inventory.findOne({ userId }),
      nutritionLog,
      budget,
      recipe:      updatedRecipe,
      dashboard,   // ← NUEVO: dashboard recalculado listo para Zustand
    };
  }
}