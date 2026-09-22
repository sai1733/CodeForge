const mongoose = require('mongoose');

const DailyReportSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Report must belong to an intern user'],
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Report must belong to a project workspace'],
    },
    workDone: {
      type: String,
      required: [true, 'Please describe the work done today'],
      trim: true,
      maxlength: [1000, 'Work accomplished details cannot exceed 1000 characters'],
    },
    hoursWorked: {
      type: Number,
      required: [true, 'Please specify the number of hours worked'],
      min: [1, 'Hours worked must be at least 1 hour'],
      max: [24, 'Hours worked cannot exceed 24 hours'],
    },
    challenges: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1000, 'Hurdles details cannot exceed 1000 characters'],
    },
    tomorrowPlan: {
      type: String,
      required: [true, 'Please describe your plan for tomorrow'],
      trim: true,
      maxlength: [1000, 'Tomorrow plan details cannot exceed 1000 characters'],
    },
    status: {
      type: String,
      enum: ['pending', 'needs_revision', 'approved', 'reviewed'],
      default: 'pending',
    },
    feedback: {
      type: String,
      default: '',
    },
    hoursApproved: {
      type: Boolean,
      default: false,
    },
    approvedHours: {
      type: Number,
      default: 0,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('DailyReport', DailyReportSchema);
