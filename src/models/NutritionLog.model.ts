//NutritionLog.model.ts
import { Schema, model, Document, Types } from 'mongoose';

export interface IMeal {
  recipeId: Types.ObjectId;
  recipeName: string;
  calories: number;
  mealTime: 'desayuno' | 'comida' | 'cena' | 'snack';
  cookedAt: Date;
}

export interface IDay {
  date: Date;
  caloriesConsumed?: number;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
  };
  meals: IMeal[];
  goalMet?: boolean;
}

export interface INutritionLog extends Document {
  userId: Types.ObjectId;
  weekStart: Date;
  days: IDay[];
  createdAt: Date;
  updatedAt: Date;
}

const MealSchema = new Schema<IMeal>({
  recipeId: { type: Schema.Types.ObjectId, ref: 'Recipe', required: true },
  recipeName: { type: String, required: true },
  calories: { type: Number, required: true },
  mealTime: { 
    type: String, 
    enum: ['desayuno', 'comida', 'cena', 'snack'], 
    required: true 
  },
  cookedAt: { type: Date, default: Date.now }
});

const DaySchema = new Schema<IDay>({
  date: { type: Date, required: true },
  caloriesConsumed: { type: Number, default: 0 },
  macros: {
    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fat: { type: Number, default: 0 }
  },
  meals: { type: [MealSchema], default: [] },
  goalMet: { type: Boolean }
});

const NutritionLogSchema = new Schema<INutritionLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    weekStart: { type: Date, required: true },
    days: { type: [DaySchema], default: [], validate: [(val: any[]) => val.length <= 7, 'Máximo 7 días por semana'] }
  },
  { timestamps: true }
);

// Índices para consultas frecuentes
NutritionLogSchema.index({ userId: 1, weekStart: -1 }, { unique: true });
NutritionLogSchema.index({ 'days.date': 1 });

export default model<INutritionLog>('NutritionLog', NutritionLogSchema);