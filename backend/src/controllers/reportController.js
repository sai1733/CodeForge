const DailyReport = require('../models/DailyReport');
const getManagerInterns = require('../utils/getManagerInterns');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * Submit a daily report (Intern only)
 * Route: POST /api/reports
 */
const submitReport = async (req, res, next) => {
  try {
    const { workDone, hoursWorked, challenges, tomorrowPlan, projectId, reportId } = req.body;

    let report;
    let isUpdate = false;

    if (reportId) {
      // Direct edit of a specific report (can be from today or any past day)
      const existingReport = await DailyReport.findById(reportId);
      if (!existingReport) {
        return errorResponse(res, 'Daily report not found', 404);
      }
      if (existingReport.user.toString() !== req.user._id.toString()) {
        return errorResponse(res, 'Access denied. You can only edit your own reports.', 403);
      }
      if (existingReport.status !== 'needs_revision') {
        return errorResponse(res, 'Only reports in Needs Revision status can be edited.', 400);
      }

      existingReport.workDone = workDone;
      existingReport.hoursWorked = hoursWorked;
      existingReport.challenges = challenges || '';
      existingReport.tomorrowPlan = tomorrowPlan;
      existingReport.status = 'pending';
      existingReport.feedback = ''; // Clear previous feedback upon revision
      await existingReport.save();
      
      report = existingReport;
      isUpdate = true;
    } else {
      // New report creation - verify they haven't already submitted one TODAY
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const existingReportToday = await DailyReport.findOne({
        user: req.user._id,
        projectId,
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      });

      if (existingReportToday) {
        return errorResponse(res, 'You have already submitted a daily report for this project workspace today.', 400);
      }

      // Build report object
      report = await DailyReport.create({
        user: req.user._id,
        projectId,
        workDone,
        hoursWorked,
        challenges: challenges || '',
        tomorrowPlan,
      });
    }

    // Trigger notification to the project's manager
    try {
      const Project = require('../models/Project');
      const project = await Project.findById(projectId);
      if (project && project.managerId) {
        const Notification = require('../models/Notification');
        const notification = await Notification.create({
          recipient: project.managerId,
          type: 'report',
          title: existingReport ? 'Daily Report Updated' : 'Daily Report Submitted',
          message: `${req.user.name} has ${existingReport ? 'updated/re-submitted' : 'submitted'} a daily report for ${project.name}.`,
          data: { reportId: report._id.toString() },
        });

        const { emitToUser } = require('../config/socket');
        emitToUser(project.managerId, 'report:submitted', {
          id: notification._id,
          type: 'report',
          title: notification.title,
          message: notification.message,
          timestamp: notification.createdAt,
          read: notification.read,
          reportId: report._id,
        });
      }
    } catch (notifErr) {
      console.error('Failed to trigger daily report submission notification:', notifErr);
    }

    return successResponse(res, report, existingReport ? 'Daily report updated and re-submitted successfully' : 'Daily report submitted successfully', existingReport ? 200 : 210);
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve daily reports based on user role
 * Route: GET /api/reports
 */
const getReports = async (req, res, next) => {
  try {
    const role = req.user.role;
    const { page, limit, status, userId, startDate, endDate, projectId, projectStatus } = req.query;
    const statusFilter = projectStatus || 'active';
    let query = {};

    // Interns only see their own reports
    if (role === 'intern') {
      query.user = req.user._id;

      const Project = require('../models/Project');
      let projectQuery = { internIds: req.user._id };
      if (statusFilter !== 'all') {
        projectQuery.status = statusFilter;
      }
      const myProjects = await Project.find(projectQuery);
      const myProjectIds = myProjects.map(p => p._id);
      query.projectId = { $in: myProjectIds };
    } else if (role === 'manager') {
      const Project = require('../models/Project');
      let projectQuery = { managerId: req.user._id };
      if (statusFilter !== 'all') {
        projectQuery.status = statusFilter;
      }
      const myProjects = await Project.find(projectQuery);
      const myProjectIds = myProjects.map(p => p._id);
      query.projectId = { $in: myProjectIds };

      if (userId) {
        query.user = userId;
      }
    } else {
      if (userId) {
        query.user = userId;
      }
    }

    if (projectId) {
      query.projectId = projectId;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const isPaginated = page || limit;
    if (isPaginated) {
      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 10;
      const skipNum = (pageNum - 1) * limitNum;

      const totalReports = await DailyReport.countDocuments(query);
      const totalPages = Math.ceil(totalReports / limitNum);

      const reports = await DailyReport.find(query)
        .populate('user', 'name email role')
        .populate('reviewedBy', 'name email role')
        .populate('projectId', 'name')
        .sort({ createdAt: -1 })
        .skip(skipNum)
        .limit(limitNum);

      return successResponse(res, {
        reports,
        pagination: {
          totalReports,
          totalPages,
          currentPage: pageNum,
          limit: limitNum,
        }
      }, 'Reports retrieved successfully');
    } else {
      const reports = await DailyReport.find(query)
        .populate('user', 'name email role')
        .populate('reviewedBy', 'name email role')
        .populate('projectId', 'name')
        .sort({ createdAt: -1 });

      return successResponse(res, reports, 'Reports retrieved successfully');
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Mark a daily report as reviewed (Manager or Superadmin only)
 * Route: PATCH /api/reports/:id/review
 */
const markReviewed = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, feedback, hoursApproved, approvedHours } = req.body;

    const report = await DailyReport.findById(id);
    if (!report) {
      return errorResponse(res, 'Daily report not found', 404);
    }

    // Role-based auth check for managers
    if (req.user.role === 'manager') {
      const myInterns = await getManagerInterns(req.user._id);
      if (!myInterns.includes(report.user.toString())) {
        return errorResponse(res, 'Access denied. You can only review reports for interns assigned to your projects.', 403);
      }
    }

    // Update status and fields
    const newStatus = status || 'approved'; // Fallback to approved
    report.status = newStatus;
    report.feedback = feedback || '';
    report.reviewedBy = req.user._id;
    report.reviewedAt = new Date();

    if (newStatus === 'needs_revision') {
      if (!feedback || !feedback.trim()) {
        return errorResponse(res, 'Feedback/revision notes are required when requesting revision.', 400);
      }
      report.hoursApproved = false;
      report.approvedHours = 0;
    } else if (newStatus === 'approved' || newStatus === 'reviewed') {
      if (hoursApproved === false) {
        return errorResponse(res, 'You must approve the logged hours to mark this report as approved/reviewed.', 400);
      }
      report.hoursApproved = true;
      report.approvedHours = report.hoursWorked;
    } else {
      report.hoursApproved = false;
      report.approvedHours = 0;
    }

    await report.save();

    // Save notification to database
    let notifTitle = 'Daily Report Reviewed';
    let notifMsg = `Your daily report has been reviewed by ${req.user.name}`;
    if (newStatus === 'needs_revision') {
      notifTitle = 'Revision Requested on Daily Report';
      notifMsg = `${req.user.name} requested revision on your daily report: "${feedback || 'No comments left.'}"`;
    } else if (newStatus === 'approved') {
      notifTitle = 'Daily Report Approved';
      notifMsg = `Your daily report has been approved by ${req.user.name}! ${report.hoursApproved ? `(${report.approvedHours} hours approved)` : ''}`;
    }

    const Notification = require('../models/Notification');
    const notification = await Notification.create({
      recipient: report.user,
      type: 'report',
      title: notifTitle,
      message: notifMsg,
      data: { reportId: report._id.toString() },
    });

    // Emit live Socket.IO notification to the intern
    const { emitToUser } = require('../config/socket');
    emitToUser(report.user, 'report:reviewed', {
      id: notification._id,
      type: 'report',
      title: notification.title,
      message: notification.message,
      timestamp: notification.createdAt,
      read: notification.read,
      reportId: report._id,
    });

    const updatedReport = await DailyReport.findById(id)
      .populate('user', 'name email role')
      .populate('reviewedBy', 'name email role');

    return successResponse(res, updatedReport, `Daily report marked as ${newStatus}`);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitReport,
  getReports,
  markReviewed,
};
