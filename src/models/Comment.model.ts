import { Schema, model, Document, Types } from 'mongoose';

export interface IComment extends Document {
  recipeId: Types.ObjectId;
  userId:   Types.ObjectId;
  rating:   number;
  comment:  string;
  createdAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    recipeId: { type: Schema.Types.ObjectId, ref: 'Recipe', required: true },
    userId:   { type: Schema.Types.ObjectId, ref: 'User',   required: true },
    rating:   { type: Number, required: true, min: 1, max: 5 },
    comment:  { type: String, required: true, trim: true, minlength: 1 },
  },
  { timestamps: true }
);

export default model<IComment>('Comment', CommentSchema);