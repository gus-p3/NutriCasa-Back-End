import { Schema, model, Document, Types } from 'mongoose';

export interface IIngredientUsed {
  name: string;
  quantityUsed: number;
  unit: string;
  leftover: number;
}

export interface ICookingHistory extends Document {
  userId: Types.ObjectId;
  recipeId: Types.ObjectId;
  recipeName: string;
  cookedAt: Date;
  rating: number;
  ingredientsUsed: IIngredientUsed[];
  estimatedCost: number;
  caloriesConsumed: number;
  mealTime: 'desayuno' | 'comida' | 'cena' | 'snack';
  createdAt: Date;
}

const IngredientUsedSchema = new Schema<IIngredientUsed>({
  name: { type: String, required: true },
  quantityUsed: { type: Number, required: true },
  unit: { type: String, required: true },
  leftover: { type: Number, default: 0 }
});

const CookingHistorySchema = new Schema<ICookingHistory>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    recipeId: { type: Schema.Types.ObjectId, ref: 'Recipe', required: true },
    recipeName: { type: String, required: true },
    cookedAt: { type: Date, default: Date.now },
    rating: { 
      type: Number, 
      required: true, 
      min: [1, 'La calificación mínima es 1'], 
      max: [5, 'La calificación máxima es 5'] 
    },
    ingredientsUsed: { type: [IngredientUsedSchema], default: [] },
    estimatedCost: { type: Number, required: true },
    caloriesConsumed: { type: Number, required: true },
    mealTime: { 
      type: String, 
      enum: ['desayuno', 'comida', 'cena', 'snack'], 
      required: true 
    }
  },
  { timestamps: true }
);

// Índices para consultas frecuentes
CookingHistorySchema.index({ userId: 1, cookedAt: -1 });
CookingHistorySchema.index({ recipeId: 1, rating: -1 });

export default model<ICookingHistory>('CookingHistory', CookingHistorySchema);