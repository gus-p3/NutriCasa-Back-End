import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  profile: {
    age?: number;
    weight?: number;
    height?: number;
    activityLevel: 'low' | 'medium' | 'high';
    goal: 'lose' | 'maintain' | 'gain';
    dietType: 'normal' | 'vegetarian' | 'vegan' | 'custom';
    allergies: string[];
    dailyCalories: number;
    macros: {
      protein: number;
      carbs: number;
      fat: number;
    };
  };
  weeklyBudget: number;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    name:     { type: String, required: true, trim: true },
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role:     { type: String, enum: ['user', 'admin'], default: 'user' },
    profile: {
      age:           { type: Number },
      weight:        { type: Number },
      height:        { type: Number },
      activityLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
      goal:          { type: String, enum: ['lose', 'maintain', 'gain'], default: 'maintain' },
      dietType:      { type: String, enum: ['normal', 'vegetarian', 'vegan', 'custom'], default: 'normal' },
      allergies:     { type: [String], default: [] },
      dailyCalories: { type: Number, default: 2000 },
      macros: {
        protein: { type: Number, default: 0 },
        carbs:   { type: Number, default: 0 },
        fat:     { type: Number, default: 0 },
      },
    },
    weeklyBudget: { type: Number, default: 0 },
  },
  { timestamps: true }
);

UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export default model<IUser>('User', UserSchema);