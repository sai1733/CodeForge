const express = require('express');
const { 
  saveRepo, 
  getRepo, 
  initiateOAuth, 
  oauthCallback, 
  getCommits, 
  getBranches, 
  getPullRequests,
  getGitHubUserRepos,
  selectGitHubRepo,
  pushToGitHub,
  createPullRequest,
  mergePullRequest,
  syncFromMain
} = require('../controllers/githubController');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');
const { validateBody } = require('../middleware/validateMiddleware');

const router = express.Router();

// OAuth initiation (protected)
router.get('/oauth/init', initiateOAuth);

// OAuth Callback (public)
router.get('/callback', oauthCallback);

// Retrieve repository data (protected)
router.get('/commits', protect, getCommits);
router.get('/branches', protect, getBranches);
router.get('/pull-requests', protect, getPullRequests);

// Fetch user's repositories from GitHub API (protected)
router.get('/user-repos', protect, getGitHubUserRepos);

// Update/Select repository link (protected)
router.put('/select-repo', protect, selectGitHubRepo);

// Commit and Push to GitHub (protected, intern only)
router.post('/push', protect, restrictTo('intern'), pushToGitHub);

// Create and merge pull requests (protected)
router.post('/pull-request', protect, restrictTo('intern'), createPullRequest);
router.post('/pull-request/merge', protect, restrictTo('manager', 'superadmin'), mergePullRequest);

// Sync workspace with main branch (protected, intern only)
router.post('/sync', protect, restrictTo('intern'), syncFromMain);

// Get repository link (Intern retrieves own; Manager/Admin retrieves specified)
router.get('/', protect, getRepo);

// Save repository link (Disabled in production for security)
router.post(
  '/',
  protect,
  restrictTo('intern'),
  (req, res) => {
    return res.status(403).json({
      success: false,
      message: 'Manual repository linking is disabled. Please connect using GitHub OAuth.'
    });
  }
);

module.exports = router;
