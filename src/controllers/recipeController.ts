import { Request, Response } from 'express';
import Recipe from '../models/Recipe.model';
import Inventory from '../models/Inventory.model';
import User from '../models/User.model';

// ─── Helper: semáforo ────────────────────────────────────────────────────────
const getIngredientStatus = (
  required: number,
  available: number
): 'green' | 'yellow' | 'red' => {
  if (available <= 0)        return 'red';
  if (available >= required) return 'green';
  return 'yellow';
};

// ─── Helper: mapa de inventario ──────────────────────────────────────────────
const buildInventoryMap = (inventory: any): Map<string, { quantity: number; unit: string }> => {
  const map = new Map<string, { quantity: number; unit: string }>();
  inventory?.items.forEach((item: any) => {
    map.set(item.name.toLowerCase(), { quantity: item.quantity, unit: item.unit });
  });
  return map;
};

// @route  GET /api/recipes
export const getRecipes = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, difficulty, maxTime, dietType } = req.query;
    const filter: Record<string, any> = {};

    if (category)   filter.category        = category;
    if (difficulty) filter.difficulty      = difficulty;
    if (dietType)   filter.dietTypes       = { $in: [dietType] };
    if (maxTime)    filter.prepTimeMinutes = { $lte: Number(maxTime) };

    const recipes = await Recipe.find(filter).sort({ 'ratings.average': -1 });
    res.status(200).json({ total: recipes.length, recipes });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error: error instanceof Error ? error.message : error });
  }
};

// @route  GET /api/recipes/suggested
export const getSuggestedRecipes = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;

    const [user, inventory] = await Promise.all([
      User.findById(userId),
      Inventory.findOne({ userId }),
    ]);

    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    const inventoryMap = buildInventoryMap(inventory);

    const recipes = await Recipe.find({
      dietTypes:     { $in: [user.profile.dietType] },
      allergens:     { $nin: user.profile.allergies },
      estimatedCost: { $lte: user.weeklyBudget },
    });

    const scored = recipes.map(recipe => {
      const total     = recipe.ingredients.length;
      let greenCount  = 0;
      let yellowCount = 0;

      recipe.ingredients.forEach(ing => {
        const inv       = inventoryMap.get(ing.name.toLowerCase());
        const available = inv?.quantity ?? 0;
        const status    = getIngredientStatus(ing.quantity, available);
        if (status === 'green')  greenCount++;
        if (status === 'yellow') yellowCount++;
      });

      const matchPct = total > 0 ? Math.round((greenCount / total) * 100) : 0;
      const indicator =
        matchPct === 100               ? 'green'  :
        (matchPct >= 50 || yellowCount) ? 'yellow' : 'red';

      return {
        recipe,
        matchPct,
        indicator,
        summary: {
          total,
          available: greenCount,
          partial:   yellowCount,
          missing:   total - greenCount - yellowCount,
        },
      };
    });

    scored.sort((a, b) => b.matchPct - a.matchPct);

    res.status(200).json({ total: scored.length, suggested: scored });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error: error instanceof Error ? error.message : error });
  }
};

// @route  GET /api/recipes/:id
// Devuelve receta + ingredientsStatus[] con semáforo
export const getRecipeById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;

    const [recipe, inventory] = await Promise.all([
      Recipe.findById(req.params.id),
      Inventory.findOne({ userId }),
    ]);

    if (!recipe) {
      res.status(404).json({ message: 'Receta no encontrada' });
      return;
    }

    const inventoryMap = buildInventoryMap(inventory);

    // Generar ingredientsStatus[]
    const ingredientsStatus = recipe.ingredients.map(ing => {
      const inv       = inventoryMap.get(ing.name.toLowerCase());
      const available = inv?.quantity ?? 0;
      const status    = getIngredientStatus(ing.quantity, available);

      return {
        name:         ing.name,
        required:     ing.quantity,
        available,
        unit:         ing.unit,
        status,                          // 'green' | 'yellow' | 'red'
        alternatives: ing.alternatives ?? [],
      };
    });

    // Resumen global
    const greenCount  = ingredientsStatus.filter(i => i.status === 'green').length;
    const yellowCount = ingredientsStatus.filter(i => i.status === 'yellow').length;
    const redCount    = ingredientsStatus.filter(i => i.status === 'red').length;
    const total       = ingredientsStatus.length;
    const matchPct    = total > 0 ? Math.round((greenCount / total) * 100) : 0;

    const globalStatus =
      matchPct === 100 ? 'green'  :
      matchPct >= 50   ? 'yellow' : 'red';

    res.status(200).json({
      recipe,
      ingredientsStatus,
      summary: {
        globalStatus,
        matchPct,
        total,
        available: greenCount,
        partial:   yellowCount,
        missing:   redCount,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error: error instanceof Error ? error.message : error });
  }
};

// @route  GET /api/recipes/:id/alternatives?ingredientName=...
// Devuelve sustitutos del ingrediente con disponibilidad en alacena
export const getIngredientAlternatives = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId             = (req as any).userId;
    const { id }             = req.params;
    const { ingredientName } = req.query;

    if (!ingredientName || typeof ingredientName !== 'string') {
      res.status(400).json({ message: 'El parámetro ingredientName es requerido' });
      return;
    }

    const [recipe, inventory] = await Promise.all([
      Recipe.findById(id),
      Inventory.findOne({ userId }),
    ]);

    if (!recipe) {
      res.status(404).json({ message: 'Receta no encontrada' });
      return;
    }

    const ingredient = recipe.ingredients.find(
      ing => ing.name.toLowerCase() === ingredientName.toLowerCase()
    );

    if (!ingredient) {
      res.status(404).json({ message: `Ingrediente "${ingredientName}" no encontrado en esta receta` });
      return;
    }

    if (!ingredient.alternatives || ingredient.alternatives.length === 0) {
      res.status(200).json({
        ingredientName,
        required:     ingredient.quantity,
        unit:         ingredient.unit,
        alternatives: [],
        message:      'Este ingrediente no tiene sustitutos disponibles',
      });
      return;
    }

    const inventoryMap = buildInventoryMap(inventory);

    const alternativesWithStatus = ingredient.alternatives.map(alt => {
      const inv       = inventoryMap.get(alt.toLowerCase());
      const available = inv?.quantity ?? 0;
      const unit      = inv?.unit     ?? '—';
      const status    = getIngredientStatus(ingredient.quantity, available);

      return {
        name:     alt,
        available,
        unit,
        status,
        inPantry: available > 0,
      };
    });

    // Ordenar: green → yellow → red
    const order = { green: 0, yellow: 1, red: 2 };
    alternativesWithStatus.sort((a, b) => order[a.status] - order[b.status]);

    res.status(200).json({
      ingredientName,
      required:     ingredient.quantity,
      unit:         ingredient.unit,
      alternatives: alternativesWithStatus,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error: error instanceof Error ? error.message : error });
  }
};

// @route  POST /api/recipes  — poblar BD
export const createRecipe = async (req: Request, res: Response): Promise<void> => {
  try {
    const recipe = await Recipe.create(req.body);
    res.status(201).json({ message: 'Receta creada', recipe });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error: error instanceof Error ? error.message : error });
  }
};