import { Request, Response } from 'express';
import NutritionLog from '../models/NutritionLog.model';
import Budget       from '../models/Budget.model';
import Inventory    from '../models/Inventory.model';
import Recipe       from '../models/Recipe.model';
import User         from '../models/User.model';

// ─── Helper: lunes de la semana actual ───────────────────────────────────────
const getWeekStart = (): Date => {
  const now    = new Date();
  const day    = now.getDay();
  const diff   = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
};

// ─── Helper: normalizar a medianoche ─────────────────────────────────────────
const toMidnight = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

// ─── Helper: estado barra de progreso ────────────────────────────────────────
const getProgressStatus = (
  consumed: number,
  goal: number,
): 'sin_iniciar' | 'bajo' | 'en_progreso' | 'cumplido' | 'excedido' => {
  if (goal === 0) return 'sin_iniciar';
  const pct = (consumed / goal) * 100;
  if (pct === 0)  return 'sin_iniciar';
  if (pct < 40)   return 'bajo';
  if (pct < 80)   return 'en_progreso';
  if (pct <= 110) return 'cumplido';
  return 'excedido';
};

// ─── Helper: goalMet ─────────────────────────────────────────────────────────
const calcGoalMet = (consumed: number, goal: number): boolean => {
  if (goal === 0) return false;
  const pct = (consumed / goal) * 100;
  return pct >= 90 && pct <= 110;
};

// ─── Función reutilizable — usada también por feedback.service.ts ─────────────
export const buildDashboardPayload = async (userId: string) => {
  const weekStart = getWeekStart();
  const today     = toMidnight(new Date());

  const user = await User.findById(userId).select('-password');
  if (!user) throw new Error('Usuario no encontrado');

  const dailyCaloriesGoal: number = user.profile.dailyCalories ?? 2000;

  // ── NutritionLog: buscar o crear ─────────────────────────────────────────
  let nutritionLog = await NutritionLog.findOne({ userId, weekStart });
  if (!nutritionLog) {
    nutritionLog = await NutritionLog.create({ userId, weekStart, days: [] });
  }

  // ── Datos del día actual ──────────────────────────────────────────────────
  const todayLog          = nutritionLog.days.find(
    d => toMidnight(d.date).getTime() === today.getTime(),
  );
  const caloriesConsumed  = todayLog?.caloriesConsumed ?? 0;
  const caloriesRemaining = Math.max(0, dailyCaloriesGoal - caloriesConsumed);
  const goalMet           = calcGoalMet(caloriesConsumed, dailyCaloriesGoal);

  const todayData = {
    date:              today,
    caloriesConsumed,
    caloriesGoal:      dailyCaloriesGoal,
    caloriesRemaining,
    macros: {
      consumed: todayLog?.macros ?? { protein: 0, carbs: 0, fat: 0 },
      goal:     user.profile.macros,
    },
    meals:          todayLog?.meals   ?? [],
    goalMet,
    progressPct:    Math.min(100, Math.round((caloriesConsumed / dailyCaloriesGoal) * 100)),
    progressStatus: getProgressStatus(caloriesConsumed, dailyCaloriesGoal),
  };

  // ── Resumen semanal ───────────────────────────────────────────────────────
  const weekSummary = {
    weekStart,
    daysLogged:    nutritionLog.days.length,
    daysMet:       nutritionLog.days.filter(d => d.goalMet).length,
    totalCalories: nutritionLog.days.reduce((sum, d) => sum + (d.caloriesConsumed ?? 0), 0),
    days: nutritionLog.days.map(d => ({
      date:             d.date,
      caloriesConsumed: d.caloriesConsumed ?? 0,
      goalMet:          d.goalMet ?? false,
      mealsCount:       d.meals.length,
    })),
  };

  // ── Presupuesto ───────────────────────────────────────────────────────────
  let budget = await Budget.findOne({ userId, weekStart });
  if (!budget && user.weeklyBudget > 0) {
    budget = await Budget.create({
      userId,
      weekStart,
      weeklyLimit: user.weeklyBudget,
      expenses:    [],
      totalSpent:  0,
      remaining:   user.weeklyBudget,
    });
  }

  const budgetData = budget
    ? {
        weeklyLimit: budget.weeklyLimit,
        totalSpent:  budget.totalSpent,
        remaining:   budget.remaining,
        spentPct:    budget.weeklyLimit > 0
          ? Math.round((budget.totalSpent / budget.weeklyLimit) * 100)
          : 0,
      }
    : null;

  // ── Top 3 recetas sugeridas ───────────────────────────────────────────────
  const inventory    = await Inventory.findOne({ userId });
  const inventoryMap = new Map<string, number>();
  inventory?.items.forEach(item => {
    inventoryMap.set(item.name.toLowerCase(), item.quantity);
  });

  const budgetCap = budget?.remaining ?? user.weeklyBudget ?? Infinity;

  const recipes = await Recipe.find({
    dietTypes: { $in: [user.profile.dietType] },
    allergens: { $nin: user.profile.allergies },
    ...(isFinite(budgetCap) ? { estimatedCost: { $lte: budgetCap } } : {}),
  });

  const scored = recipes
    .map(recipe => {
      const total = recipe.ingredients.length;
      let green   = 0;
      let yellow  = 0;

      recipe.ingredients.forEach(ing => {
        const available = inventoryMap.get(ing.name.toLowerCase()) ?? 0;
        if (available >= ing.quantity) green++;
        else if (available > 0)        yellow++;
      });

      const matchPct  = total > 0 ? Math.round((green / total) * 100) : 0;
      const indicator =
        matchPct === 100               ? 'green'  :
        (matchPct >= 50 || yellow > 0) ? 'yellow' : 'red';

      return {
        recipeId:        recipe._id,
        title:           recipe.title,
        category:        recipe.category,
        prepTimeMinutes: recipe.prepTimeMinutes,
        estimatedCost:   recipe.estimatedCost,
        calories:        recipe.nutrition.calories,
        difficulty:      recipe.difficulty,
        rating:          recipe.ratings.average,
        matchPct,
        indicator,
      };
    })
    .sort((a, b) => b.matchPct - a.matchPct || b.rating - a.rating)
    .slice(0, 3);

  return {
    user: {
      name:          user.name,
      dailyCalories: dailyCaloriesGoal,
      goal:          user.profile.goal,
      dietType:      user.profile.dietType,
    },
    today:     todayData,
    week:      weekSummary,
    budget:    budgetData,
    suggested: scored,
  };
};

// ─── Controller ──────────────────────────────────────────────────────────────
export class DashboardController {

  // @route  GET /api/dashboard
  static async getDashboard(req: Request, res: Response) {
    try {
      const userId  = (req as any).userId;
      const payload = await buildDashboardPayload(userId);

      res.status(200).json({
        success: true,
        data:    payload,
      });
    } catch (error: any) {
      console.error('ERROR DASHBOARD:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al cargar el dashboard',
      });
    }
  }
}