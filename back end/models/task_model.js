// Updated task_model.js
import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
    id : { type: Number, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Todo-Users', required: true },
  name: { type: String, required: true }, // Changed from 'title' to match frontend
  description: { type: String },
  color: { type: String, default: '#007bff' },
  dueDate: { type: Date }, // For selectedDate from frontend
  completed: { type: Boolean, default: false },
  
  // Repeat configuration
  repeat: {
    enabled: { type: Boolean, default: false },
    type: { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'daily' },
    days: [{ type: String }], // Array of selected days for weekly repeat
    frequency: { type: String, default: 'Never' }
  },
  
  // Tags array
  tags: [{
    id: { type: Number },
    name: { type: String }
  }],
  
  // Legacy category field (keeping for backward compatibility)
  category: { type: String, enum: ['today', 'daily', 'study', 'scheduled', 'all', 'flagged'] },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
taskSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const taskModel = mongoose.model('Todo-task', taskSchema);
export default taskModel;
