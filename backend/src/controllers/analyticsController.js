const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const DailyReport = require('../models/DailyReport');
const GitHubRepo = require('../models/GitHubRepo');
const getManagerInterns = require('../utils/getManagerInterns');
const { decrypt } = require('../utils/crypto');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const parseRepoUrl = (url) => {
  if (!url) return null;
  const match = url.match(/github\.com[\/:][^\/]+\/[^\/]+/i);
  if (match) {
    const parts = match[0].replace('github.com/', '').replace('github.com:', '').split('/');
    const owner = parts[0];
    const repo = parts[1].replace(/\.git$/, '');
    return { owner, repo };
  }
  return null;
};

/**
 * Helper to group commits by date
 */
const getCommitStatsOverTime = async (repo) => {
  if (!repo || !repo.accessToken || !repo.githubUsername || !repo.repoName) {
    return [];
  }
  try {
    const token = decrypt(repo.accessToken);

    // Parse repository owner and repository name correctly from compound repoName or repoUrl
    let owner = repo.githubUsername;
    let repoName = repo.repoName;
    const parsed = parseRepoUrl(repo.repoUrl);
    if (parsed) {
      owner = parsed.owner;
      repoName = parsed.repo;
    } else if (repoName.includes('/')) {
      const parts = repoName.split('/');
      owner = parts[0];
      repoName = parts[1];
    }

    // Get the User model to construct the branch name
    const User = require('../models/User');
    const userDoc = await User.findById(repo.userId);
    let branchName = '';
    if (userDoc) {
      branchName = `codeforge/intern-${userDoc.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    }

    let url = `https://api.github.com/repos/${owner}/${repoName}/commits?per_page=30`;
    if (branchName) {
      url += `&sha=${branchName}`;
    }
    url += `&author=${repo.githubUsername}`;

    let response = await fetch(url, {
      headers: {
        'Authorization': `token ${token}`,
        'User-Agent': 'CodeForge',
      },
    });

    // Fall back to default branch if branch doesn't exist yet
    if (!response.ok && branchName) {
      response = await fetch(
        `https://api.github.com/repos/${owner}/${repoName}/commits?per_page=30&author=${repo.githubUsername}`,
        {
          headers: {
            'Authorization': `token ${token}`,
            'User-Agent': 'CodeForge',
          },
        }
      );
    }

    if (!response.ok) return [];
    const commits = await response.json();
    
    // Group commits by date (YYYY-MM-DD), filtering out initial commit
    const counts = {};
    (commits || []).forEach((c) => {
      const msg = c.commit?.message || '';
      if (msg.toLowerCase().includes('initial commit')) {
        return; // skip system initialization commits
      }
      const dateStr = new Date(c.commit.author.date).toISOString().split('T')[0];
      counts[dateStr] = (counts[dateStr] || 0) + 1;
    });

    return Object.keys(counts).map((date) => ({
      date,
      count: counts[date],
    })).sort((a, b) => a.date.localeCompare(b.date));
  } catch (err) {
    console.error('Failed to group commits for analytics:', err);
    return [];
  }
};

/**
 * Get analytics for a single intern
 * Route: GET /api/analytics/intern
 */
const getInternAnalytics = async (req, res, next) => {
  try {
    const role = req.user.role;
    let userId = req.user._id;
    const projectId = req.query.projectId;

    if ((role === 'manager' || role === 'superadmin') && req.query.userId) {
      userId = req.query.userId;
    }

    // Verify manager cohort restriction
    if (role === 'manager') {
      const managedInternIds = await getManagerInterns(req.user._id);
      if (!managedInternIds.includes(userId.toString())) {
        return errorResponse(res, 'Access denied. You do not manage this intern.', 403);
      }
    }

    const taskQuery = { assignedTo: userId };
    const reportQuery = { user: userId };
    const repoQuery = { userId };

    if (projectId) {
      taskQuery.projectId = projectId;
      reportQuery.projectId = projectId;
      repoQuery.projectId = projectId;
    }

    // 1. Task Completion Stats
    const totalTasks = await Task.countDocuments(taskQuery);
    const completedTasks = await Task.countDocuments({ ...taskQuery, status: 'completed' });
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // 2. Daily Report Stats
    const reports = await DailyReport.find(reportQuery);
    const totalHours = reports.filter(r => r.hoursApproved).reduce((acc, r) => acc + (r.approvedHours || 0), 0);

    // 3. GitHub commits over time
    const repo = await GitHubRepo.findOne(repoQuery);
    const commitHistory = await getCommitStatsOverTime(repo);

    return successResponse(res, {
      userId,
      taskCompletion: {
        total: totalTasks,
        completed: completedTasks,
        rate: completionRate,
      },
      reportStats: {
        totalReports: reports.length,
        totalHours,
      },
      github: {
        connected: !!(repo && repo.githubUsername),
        repoUrl: repo ? repo.repoUrl : null,
        commitHistory,
      }
    }, 'Intern analytics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get cohort analytics for a manager
 * Route: GET /api/analytics/manager
 */
const getManagerCohortAnalytics = async (req, res, next) => {
  try {
    if (req.user.role !== 'manager' && req.user.role !== 'superadmin') {
      return errorResponse(res, 'Access denied. Managers or admins only.', 403);
    }

    // Get manager's interns
    const internIds = await getManagerInterns(req.user._id);

    if (internIds.length === 0) {
      return successResponse(res, {
        totalInterns: 0,
        cohortTaskCompletion: { total: 0, completed: 0, rate: 0 },
        cohortReportStats: { totalReports: 0, totalHours: 0 },
        internStats: [],
      }, 'Cohort analytics retrieved successfully (Empty)');
    }

    // Cohort aggregated calculations
    const totalTasks = await Task.countDocuments({ assignedTo: { $in: internIds } });
    const completedTasks = await Task.countDocuments({ assignedTo: { $in: internIds }, status: 'completed' });
    const cohortCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const reports = await DailyReport.find({ user: { $in: internIds } });
    const cohortTotalHours = reports.filter(r => r.hoursApproved).reduce((acc, r) => acc + (r.approvedHours || 0), 0);

    // Fetch individual stats for each intern
    const interns = await User.find({ _id: { $in: internIds } }).select('name email');
    const internStats = await Promise.all(
      interns.map(async (intern) => {
        const internTotalTasks = await Task.countDocuments({ assignedTo: intern._id });
        const internCompletedTasks = await Task.countDocuments({ assignedTo: intern._id, status: 'completed' });
        const internReports = await DailyReport.find({ user: intern._id });
        const internHours = internReports.filter(r => r.hoursApproved).reduce((acc, r) => acc + (r.approvedHours || 0), 0);

        return {
          id: intern._id,
          name: intern.name,
          email: intern.email,
          totalTasks: internTotalTasks,
          completedTasks: internCompletedTasks,
          hoursWorked: internHours,
        };
      })
    );

    return successResponse(res, {
      totalInterns: internIds.length,
      cohortTaskCompletion: {
        total: totalTasks,
        completed: completedTasks,
        rate: cohortCompletionRate,
      },
      cohortReportStats: {
        totalReports: reports.length,
        totalHours: cohortTotalHours,
      },
      internStats,
    }, 'Cohort analytics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get system analytics (Superadmin only)
 * Route: GET /api/analytics/system
 */
const getSystemAnalytics = async (req, res, next) => {
  try {
    if (req.user.role !== 'superadmin') {
      return errorResponse(res, 'Access denied. System administrators only.', 403);
    }

    // 1. User counters
    const activeUsers = await User.countDocuments({ isActive: true });
    const totalUsers = await User.countDocuments({});
    const superadmins = await User.countDocuments({ role: 'superadmin' });
    const managers = await User.countDocuments({ role: 'manager' });
    const interns = await User.countDocuments({ role: 'intern' });

    // 2. Active Projects count
    const activeProjects = await Project.countDocuments({ status: 'active' });
    const totalProjects = await Project.countDocuments({});

    // 3. Global task completion
    const totalTasks = await Task.countDocuments({});
    const completedTasks = await Task.countDocuments({ status: 'completed' });
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return successResponse(res, {
      users: {
        total: totalUsers,
        active: activeUsers,
        superadmins,
        managers,
        interns,
      },
      projects: {
        total: totalProjects,
        active: activeProjects,
      },
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        rate: completionRate,
      }
    }, 'System-wide analytics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInternAnalytics,
  getManagerCohortAnalytics,
  getSystemAnalytics,
};
