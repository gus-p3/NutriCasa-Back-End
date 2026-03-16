// models/Inventory.model.ts
import { Schema, model, Document, Types } from 'mongoose';

export interface IInventoryItem {
  _id?: Types.ObjectId;
  name: string;
  quantity: number;
  unit: 'g' | 'kg' | 'ml' | 'l' | 'piezas' | 'tazas';
  category: 'proteína' | 'vegetal' | 'fruta' | 'cereal' | 'lácteo' | 'condimento' | 'otro';
  expiresAt?: Date;
  addedAt: Date;
}

export interface IInventory extends Document {
  userId: Types.ObjectId;
  items: IInventoryItem[];
  createdAt: Date;  // ← Agregar a la interfaz (opcional)
  updatedAt: Date;  // ← Agregar a la interfaz (opcional)
}

const InventoryItemSchema = new Schema<IInventoryItem>(
  {
    name:     { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    unit: { 
      type: String, 
      required: true, 
      enum: ['g', 'kg', 'ml', 'l', 'piezas', 'tazas'] 
    },
    category: { 
      type: String, 
      required: true, 
      enum: ['proteína', 'vegetal', 'fruta', 'cereal', 'lácteo', 'condimento', 'otro'] 
    },
    expiresAt: { type: Date },
    addedAt:   { type: Date, default: Date.now }
  },
  { _id: true }
);

const InventorySchema = new Schema<IInventory>(
  {
    userId: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true, 
      unique: true 
    },
    items: [InventoryItemSchema]
    // ❌ NO declarar updatedAt manualmente
  },
  { 
    timestamps: true // ✅ Mongoose creará createdAt y updatedAt automáticamente
  }
);

// userId is already indexed via unique:true above.
// Extra index for expiry lookups:
InventorySchema.index({ 'items.expiresAt': 1 });

export default model<IInventory>('Inventory', InventorySchema);