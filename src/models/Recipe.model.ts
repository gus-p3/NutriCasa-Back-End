// models/Recipe.model.ts

import { Schema, model, Document } from 'mongoose';

// Interfaces
export interface IIngredient {
  name: string;
  quantity: number;
  unit: string;
  alternatives?: string[];
}

export interface IStep {
  stepNumber: number;
  description: string;
  imageUrl?: string;
  timerSeconds?: number;
  detailedNote?: string;
}

export interface INutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface IRatings {
  average: number;
  count: number;
}

export interface IRecipe extends Document {
  title: string;
  description: string;
  imageUrl?: string;
  category: 'desayuno' | 'comida' | 'cena' | 'snack';
  dietTypes: Array<'normal' | 'vegetarian' | 'vegan'>;
  allergens: string[];
  ingredients: IIngredient[];
  steps: IStep[];
  nutrition: INutrition;
  prepTimeMinutes: number;
  estimatedCost: number;
  difficulty?: 'fácil' | 'media' | 'difícil';
  ratings: IRatings;
  createdAt?: Date;
  updatedAt?: Date;
  
  // Métodos
  calculateTotalTime(): number;
  getAverageRating(): number;
}

const RecipeSchema = new Schema<IRecipe>(
  {
    title: { 
      type: String, 
      required: [true, 'El título es requerido'], 
      trim: true,
      maxlength: [100, 'El título no puede exceder los 100 caracteres']
    },
    description: { 
      type: String, 
      required: [true, 'La descripción es requerida'],
      maxlength: [500, 'La descripción no puede exceder los 500 caracteres']
    },
    imageUrl: { 
      type: String,
      match: [/^https?:\/\/.+/, 'URL de imagen inválida']
    },
    category: { 
      type: String, 
      required: [true, 'La categoría es requerida'],
      enum: {
        values: ['desayuno', 'comida', 'cena', 'snack'],
        message: '{VALUE} no es una categoría válida'
      }
    },
    dietTypes: { 
      type: [String], 
      enum: ['normal', 'vegetarian', 'vegan'],
      default: ['normal']
    },
    allergens: { 
      type: [String], 
      default: [] 
    },
    ingredients: {
      type: [{
        name: { type: String, required: true, trim: true },
        quantity: { type: Number, required: true, min: [0, 'La cantidad no puede ser negativa'] },
        unit: { type: String, required: true, trim: true },
        alternatives: [{ type: String, trim: true }]
      }],
      required: [true, 'Los ingredientes son requeridos'],
      validate: {
        validator: (v: IIngredient[]) => v.length > 0,
        message: 'Debe haber al menos un ingrediente'
      }
    },
    steps: {
      type: [{
        stepNumber: { type: Number, required: true, min: 1 },
        description: { type: String, required: true, trim: true },
        imageUrl: { type: String },
        timerSeconds: { type: Number, default: 0, min: 0 },
        detailedNote: { type: String, trim: true }
      }],
      required: [true, 'Los pasos son requeridos'],
      validate: {
        validator: (v: IStep[]) => v.length > 0,
        message: 'Debe haber al menos un paso'
      }
    },
    nutrition: {
      calories: { type: Number, required: true, min: 0 },
      protein: { type: Number, required: true, min: 0 },
      carbs: { type: Number, required: true, min: 0 },
      fat: { type: Number, required: true, min: 0 }
    },
    prepTimeMinutes: { 
      type: Number, 
      required: true, 
      min: [1, 'El tiempo debe ser al menos 1 minuto'] 
    },
    estimatedCost: { 
      type: Number, 
      required: true, 
      min: [0, 'El costo no puede ser negativo'] 
    },
    difficulty: { 
      type: String, 
      enum: ['fácil', 'media', 'difícil'] 
    },
    ratings: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0, min: 0 }
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Índices para búsquedas eficientes
RecipeSchema.index({ title: 'text', description: 'text' });
RecipeSchema.index({ category: 1 });
RecipeSchema.index({ dietTypes: 1 });
RecipeSchema.index({ 'ratings.average': -1 });
RecipeSchema.index({ estimatedCost: 1 });
RecipeSchema.index({ prepTimeMinutes: 1 });
RecipeSchema.index({ difficulty: 1 });

// Métodos de instancia
RecipeSchema.methods.calculateTotalTime = function(): number {
  const timerSeconds = this.steps.reduce((total: number, step: IStep) => {
    return total + (step.timerSeconds || 0);
  }, 0);
  
  return Math.ceil(timerSeconds / 60) + this.prepTimeMinutes;
};

RecipeSchema.methods.getAverageRating = function(): number {
  return this.ratings?.average || 0;
};

// Métodos estáticos útiles
RecipeSchema.statics.findByDietType = function(dietType: string) {
  return this.find({ dietTypes: dietType });
};

RecipeSchema.statics.findByMaxBudget = function(budget: number) {
  return this.find({ estimatedCost: { $lte: budget } });
};

RecipeSchema.statics.findByMaxTime = function(maxMinutes: number) {
  return this.find({ prepTimeMinutes: { $lte: maxMinutes } });
};

// Virtual para obtener el costo formateado
RecipeSchema.virtual('formattedCost').get(function() {
  return `$${this.estimatedCost} MXN`;
});

// Virtual para obtener el tiempo formateado
RecipeSchema.virtual('formattedTime').get(function() {
  const hours = Math.floor(this.prepTimeMinutes / 60);
  const minutes = this.prepTimeMinutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes} min`;
});

// Virtual para verificar si es apto para veganos
RecipeSchema.virtual('isVegan').get(function() {
  return this.dietTypes.includes('vegan');
});

// Virtual para verificar si es apto para vegetarianos
RecipeSchema.virtual('isVegetarian').get(function() {
  return this.dietTypes.includes('vegetarian');
});

export default model<IRecipe>('Recipe', RecipeSchema);

// Tipos exportados para usar en otras partes de la aplicación
export type RecipeCategory = 'desayuno' | 'comida' | 'cena' | 'snack';
export type DietType = 'normal' | 'vegetarian' | 'vegan';
export type Difficulty = 'fácil' | 'media' | 'difícil';