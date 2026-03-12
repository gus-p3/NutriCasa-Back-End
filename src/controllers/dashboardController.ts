import { Request, Response } from 'express';
import NutritionLog          from '../models/NutritionLog.model';
import Budget                from '../models/Budget.model';
import Inventory             from '../models/Inventory.model';
import Recipe                from '../models/Recipe.model';
import User                  from '../models/User.model';

// ─── Helper: obtener el lunes de la semana actual ────────────────────────────
const getWeekStart = (): Date => {
  const now  = new Date();
  const day  = now.getDay();                          // 0=dom, 1=lun ... 6=sab
  const diff = day === 0 ? -6 : 1 - day;             // ajuste al lunes
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
};

// ─── Helper: normalizar fecha a medianoche ───────────────────────────────────
const toMidnight = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

// @route  GET /api/dashboard
export const getDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId   = (req as any).userId;
    const weekStart = getWeekStart();
    const today     = toMidnight(new Date());

    // ── 1. Obtener usuario ───────────────────────────────────────────────────
    const user = await User.findById(userId).select('-password');
    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    // ── 2. NutritionLog: buscar o crear ─────────────────────────────────────
    let nutritionLog = await NutritionLog.findOne({ userId, weekStart });

    if (!nutritionLog) {
      nutritionLog = await NutritionLog.create({
        userId,
        weekStart,
        days: [],
      });
    }

    // ── 3. Extraer datos del día actual ──────────────────────────────────────
    const todayLog = nutritionLog.days.find(
      d => toMidnight(d.date).getTime() === today.getTime()
    );

    const todayData = {
      date:             today,
      caloriesConsumed: todayLog?.caloriesConsumed ?? 0,
      caloriesGoal:     user.profile.dailyCalories,
      caloriesRemaining: Math.max(0, user.profile.dailyCalories - (todayLog?.caloriesConsumed ?? 0)),
      macros: {
        consumed: todayLog?.macros ?? { protein: 0, carbs: 0, fat: 0 },
        goal:     user.profile.macros,
      },
      meals:   todayLog?.meals   ?? [],
      goalMet: todayLog?.goalMet ?? false,

      // Barra de progreso
      progressPct: Math.min(
        100,
        Math.round(((todayLog?.caloriesConsumed ?? 0) / user.profile.dailyCalories) * 100)
      ),
      progressStatus: getProgressStatus(
        todayLog?.caloriesConsumed ?? 0,
        user.profile.dailyCalories
      ),
    };

    // ── 4. Resumen semanal ───────────────────────────────────────────────────
    const weekSummary = {
      weekStart,
      daysLogged:   nutritionLog.days.length,
      daysMet:      nutritionLog.days.filter(d => d.goalMet).length,
      totalCalories: nutritionLog.days.reduce((sum, d) => sum + (d.caloriesConsumed ?? 0), 0),
      days: nutritionLog.days.map(d => ({
        date:             d.date,
        caloriesConsumed: d.caloriesConsumed ?? 0,
        goalMet:          d.goalMet ?? false,
        mealsCount:       d.meals.length,
      })),
    };

    // ── 5. Presupuesto de la semana ──────────────────────────────────────────
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
          spentPct:    Math.round((budget.totalSpent / budget.weeklyLimit) * 100),
        }
      : null;

    // ── 6. Top 3 recetas sugeridas ───────────────────────────────────────────
    const inventory = await Inventory.findOne({ userId });

    const inventoryMap = new Map<string, number>();
    inventory?.items.forEach(item => {
      inventoryMap.set(item.name.toLowerCase(), item.quantity);
    });

    const recipes = await Recipe.find({
      dietTypes:     { $in: [user.profile.dietType] },
      allergens:     { $nin: user.profile.allergies },
      estimatedCost: { $lte: budget?.remaining ?? user.weeklyBudget },
    });

    const scored = recipes
      .map(recipe => {
        const total   = recipe.ingredients.length;
        let green     = 0;
        let yellow    = 0;

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
      .sort((a, b) => b.matchPct - a.matchPct)
      .slice(0, 3);                                   // top 3

    // ── 7. Respuesta final ───────────────────────────────────────────────────
    res.status(200).json({
      user: {
        name:         user.name,
        dailyCalories: user.profile.dailyCalories,
        goal:         user.profile.goal,
        dietType:     user.profile.dietType,
      },
      today:       todayData,
      week:        weekSummary,
      budget:      budgetData,
      suggested:   scored,
    });
  } catch (error) {
    console.error('ERROR DASHBOARD:', error);
    res.status(500).json({
      message: 'Error al cargar el dashboard',
      error: error instanceof Error ? error.message : error,
    });
  }
};

// ─── Helper: estado de la barra de progreso ──────────────────────────────────
const getProgressStatus = (
  consumed: number,
  goal: number
): 'sin_iniciar' | 'bajo' | 'en_progreso' | 'cumplido' | 'excedido' => {
  if (goal === 0) return 'sin_iniciar';
  const pct = (consumed / goal) * 100;
  if (pct === 0)    return 'sin_iniciar';
  if (pct < 40)     return 'bajo';
  if (pct < 80)     return 'en_progreso';
  if (pct <= 110)   return 'cumplido';
  return 'excedido';
};