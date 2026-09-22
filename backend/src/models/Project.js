const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a project name'],
      unique: true,
      trim: true,
      maxlength: [50, 'Project name cannot exceed 50 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please provide a project description'],
      trim: true,
      maxlength: [500, 'Project description cannot exceed 500 characters'],
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please assign a manager to this project'],
    },
    internIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    status: {
      type: String,
      enum: ['active', 'archived'],
      default: 'active',
    },
    githubRepoName: {
      type: String,
      required: false, // Optional for projects that don't use Git tracking
      trim: true,
    },
    githubRepoUrl: {
      type: String,
      required: [true, 'Please provide a valid GitHub repository URL'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Project', ProjectSchema);
