//Budget.model.ts
import { Schema, model, Document, Types } from 'mongoose';

export interface IExpense {
  _id?: Types.ObjectId;
  description: string;
  amount: number;
  recipeId?: Types.ObjectId;
  registeredAt: Date;
}

export interface IBudget extends Document {
  userId: Types.ObjectId;
  weekStart: Date;
  weeklyLimit: number;
  expenses: IExpense[];
  totalSpent: number;
  remaining: number;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>({
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  recipeId: { type: Schema.Types.ObjectId, ref: 'Recipe' },
  registeredAt: { type: Date, default: Date.now }
});

const BudgetSchema = new Schema<IBudget>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    weekStart: { type: Date, required: true },
    weeklyLimit: { type: Number, required: true, min: [0, 'El límite no puede ser negativo'] },
    expenses: { type: [ExpenseSchema], default: [] },
    totalSpent: { type: Number, default: 0 },
    remaining: { type: Number, default: 0 }
  },
  { timestamps: true }
);

// Índices para consultas frecuentes
BudgetSchema.index({ userId: 1, weekStart: -1 }, { unique: true });
BudgetSchema.index({ 'expenses.registeredAt': -1 });

export default model<IBudget>('Budget', BudgetSchema);