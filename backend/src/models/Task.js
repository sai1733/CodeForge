const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a task title'],
      trim: true,
      maxlength: [80, 'Task title cannot exceed 80 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please provide a task description'],
      trim: true,
      maxlength: [1500, 'Task description cannot exceed 1500 characters'],
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please specify the intern this task is assigned to'],
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please specify the manager who created this task'],
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Please specify the project this task belongs to'],
    },
    status: {
      type: String,
      enum: {
        values: ['assigned', 'in-progress', 'in-review', 'completed'],
        message: '{VALUE} is not a valid status. Allowed values are: assigned, in-progress, in-review, completed',
      },
      default: 'assigned',
    },
    submissionDetails: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1000, 'Submission details cannot exceed 1000 characters'],
    },
    feedback: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1000, 'Manager review feedback cannot exceed 1000 characters'],
    },
    dueDate: {
      type: Date,
      required: [true, 'Please specify a due date for this task'],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Task', TaskSchema);
