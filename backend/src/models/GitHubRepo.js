const mongoose = require('mongoose');

const GitHubRepoSchema = new mongoose.Schema(
  {
    repoUrl: {
      type: String,
      required: [true, 'Please provide the GitHub repository URL'],
      trim: true,
      match: [
        /^(https?:\/\/)?(www\.)?github\.com\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+\/?$/,
        'Please provide a valid GitHub repository URL (e.g. https://github.com/username/repo)',
      ],
    },
    githubUsername: {
      type: String,
      required: false,
      trim: true,
    },
    accessToken: {
      type: String,
      required: false,
    },
    repoName: {
      type: String,
      required: false,
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Repository must belong to an intern'],
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: false, // optional until Step 7
    },
  },
  {
    timestamps: true,
  }
);

// Ensure an intern can only link exactly one repository per project
GitHubRepoSchema.index({ userId: 1, projectId: 1 }, { unique: true });

module.exports = mongoose.model('GitHubRepo', GitHubRepoSchema);
