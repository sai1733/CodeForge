const mongoose = require('mongoose');

const FileSchema = new mongoose.Schema(
  {
    fileName: {
      type: String,
      required: [true, 'Please provide a file name'],
      trim: true,
    },
    path: {
      type: String,
      required: [true, 'Please provide the file path'],
      trim: true,
    },
    content: {
      type: String,
      default: '',
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'File must belong to a project workspace'],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'File must belong to a user'],
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure path is unique within a single project and user draft
FileSchema.index({ projectId: 1, userId: 1, path: 1 }, { unique: true });

module.exports = mongoose.model('File', FileSchema);
