const jwt = require('jsonwebtoken');
const GitHubRepo = require('../models/GitHubRepo');
const User = require('../models/User');
const Project = require('../models/Project');
const { encrypt, decrypt } = require('../utils/crypto');
const env = require('../config/env');
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
 * Save or update GitHub repository link (Intern only)
 * Route: POST /api/github
 */
const saveRepo = async (req, res, next) => {
  try {
    const { repoUrl, projectId } = req.body;

    // Check if repo already exists for this user
    let repo = await GitHubRepo.findOne({ userId: req.user._id });

    // Parse username and repoName from URL
    let githubUsername = '';
    let repoName = '';
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/i);
    if (match) {
      githubUsername = match[1];
      repoName = match[2].replace(/\/$/, '').replace(/\.git$/, '');
    }

    if (repo) {
      // Update existing record
      repo.repoUrl = repoUrl;
      repo.githubUsername = githubUsername || repo.githubUsername;
      repo.repoName = repoName || repo.repoName;
      if (projectId) {
        repo.projectId = projectId;
      }
      await repo.save();
      return successResponse(res, repo, 'GitHub repository link updated successfully');
    } else {
      // Create new record
      repo = await GitHubRepo.create({
        repoUrl,
        githubUsername,
        repoName,
        userId: req.user._id,
        projectId: projectId || null,
      });
      return successResponse(res, repo, 'GitHub repository link saved successfully', 201);
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Fetch GitHub repository link
 * Route: GET /api/github
 */
const getRepo = async (req, res, next) => {
  try {
    const role = req.user.role;
    let userId = req.user._id;
    const projectId = req.query.projectId;

    // Managers or admins can fetch repository link of a specific intern
    if ((role === 'manager' || role === 'superadmin') && req.query.userId) {
      userId = req.query.userId;
    }

    const oauthCredentials = await GitHubRepo.findOne({ userId, accessToken: { $exists: true, $ne: '' } });

    const query = { userId };
    if (projectId) {
      query.projectId = projectId;
    }

    const repo = await GitHubRepo.findOne(query)
      .populate('userId', 'name email role')
      .populate('projectId', 'name');

    if (!repo) {
      return successResponse(res, { hasOauth: !!oauthCredentials }, 'No GitHub repository linked for this user');
    }

    // Self-heal: If githubUsername was overwritten with the repo owner/org, restore actual username from GitHub API
    if (repo.accessToken) {
      try {
        const token = decrypt(repo.accessToken);
        const userRes = await fetch('https://api.github.com/user', {
          headers: {
            'Authorization': `token ${token}`,
            'User-Agent': 'CodeForge',
          },
        });

        if (userRes.ok) {
          const userData = await userRes.json();
          const actualUsername = userData.login;
          if (repo.githubUsername !== actualUsername) {
            repo.githubUsername = actualUsername;
            await repo.save();
            console.log(`Self-healed githubUsername for user ${userId} to ${actualUsername}`);
          }
        }
      } catch (err) {
        console.error('Self-healing failed to fetch user details:', err);
      }
    }

    // Return clean data without access token
    const repoObj = repo.toObject();
    delete repoObj.accessToken;
    repoObj.hasOauth = !!oauthCredentials;

    return successResponse(res, repoObj, 'GitHub repository link retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Initiate GitHub OAuth flow
 * Route: GET /api/github/oauth/init
 */
const initiateOAuth = async (req, res, next) => {
  try {
    const token = req.query.token;
    const projectId = req.query.projectId;
    if (!token) {
      return res.status(401).send('Unauthorized: JWT token is required as query parameter.');
    }

    const decoded = jwt.verify(token, env.JWT_SECRET);
    const userId = decoded.id;

    // Pass both userId and projectId (separated by colon) in state parameter
    const state = projectId ? `${userId}:${projectId}` : userId;

    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.GITHUB_CALLBACK_URL)}&scope=repo&state=${state}`;
    return res.redirect(githubAuthUrl);
  } catch (error) {
    console.error('OAuth initiation failed:', error);
    return res.status(401).send('Unauthorized: Invalid token.');
  }
};

/**
 * GitHub OAuth callback
 * Route: GET /api/github/callback
 */
const oauthCallback = async (req, res, next) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.status(400).send('OAuth callback failed: code and state are required.');
    }

    // Split state into userId and projectId
    const stateParts = state.split(':');
    const userId = stateParts[0];
    const projectId = stateParts[1] || null;

    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: process.env.GITHUB_CALLBACK_URL,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error('GitHub token exchange error:', tokenData.error_description);
      return res.status(400).send(`OAuth exchange failed: ${tokenData.error_description}`);
    }

    const accessToken = tokenData.access_token;

    // Fetch user details to get username
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${accessToken}`,
        'User-Agent': 'CodeForge',
      },
    });
    const userData = await userResponse.json();
    const githubUsername = userData.login;

    // Check if the project has a pre-defined repository config
    let defaultRepoName = 'unknown';
    let defaultRepoUrl = `https://github.com/${githubUsername}`;

    if (projectId) {
      const project = await Project.findById(projectId);
      if (project && project.githubRepoName && project.githubRepoUrl) {
        // Keep the full compound name (e.g., realcodeforge-netizen/Project1)
        defaultRepoName = project.githubRepoName;
        defaultRepoUrl = project.githubRepoUrl;
      }
    }

    // Fallback: If no pre-defined repository, fetch user's most recent repo
    if (defaultRepoName === 'unknown') {
      const reposResponse = await fetch('https://api.github.com/user/repos?sort=updated&per_page=5', {
        headers: {
          'Authorization': `token ${accessToken}`,
          'User-Agent': 'CodeForge',
        },
      });
      const repos = await reposResponse.json();

      if (repos && repos.length > 0) {
        const primaryRepo = repos.find((r) => !r.fork) || repos[0];
        defaultRepoName = primaryRepo.name;
        defaultRepoUrl = primaryRepo.html_url;
      }
    }

    const encryptedToken = encrypt(accessToken);
    const query = { userId };
    if (projectId) {
      query.projectId = projectId;
    }

    let repo = await GitHubRepo.findOne(query);

    if (repo) {
      repo.accessToken = encryptedToken;
      repo.githubUsername = githubUsername;
      repo.repoName = defaultRepoName;
      repo.repoUrl = defaultRepoUrl;
      await repo.save();
    } else {
      repo = await GitHubRepo.create({
        userId,
        projectId,
        accessToken: encryptedToken,
        githubUsername,
        repoName: defaultRepoName,
        repoUrl: defaultRepoUrl,
      });
    }

    // Return HTML to notify parent window and close this tab
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>GitHub Connection Success</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background-color: #f6f8fa;
              color: #24292f;
            }
            .card {
              text-align: center;
              padding: 2rem;
              background: white;
              border-radius: 8px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.08);
            }
            h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
            p { color: #57606a; margin-bottom: 1.5rem; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>GitHub Connected!</h1>
            <p>Your account was successfully linked. Closing this tab...</p>
          </div>
          <script>
            try {
              if (window.opener) {
                window.opener.postMessage({ type: 'GITHUB_OAUTH_SUCCESS' }, '*');
              }
            } catch (e) {
              console.error('Error posting message to opener:', e);
            }
            setTimeout(() => {
              window.close();
            }, 1000);
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('OAuth callback error:', error);
    return res.status(500).send('Internal server error during GitHub OAuth.');
  }
};

/**
 * Fetch commits for linked repo
 * Route: GET /api/github/commits
 */
const getCommits = async (req, res, next) => {
  try {
    const role = req.user.role;
    let userId = req.user._id;
    const projectId = req.query.projectId;

    if ((role === 'manager' || role === 'superadmin') && req.query.userId) {
      userId = req.query.userId;
    }

    const query = { userId };
    if (projectId) {
      query.projectId = projectId;
    }

    const repo = await GitHubRepo.findOne(query);
    if (!repo || !repo.accessToken || !repo.githubUsername || !repo.repoName) {
      return successResponse(res, [], 'No connected GitHub repository with OAuth');
    }

    const token = decrypt(repo.accessToken);

    const User = require('../models/User');
    const userDoc = await User.findById(userId);
    let branchName = '';
    if (userDoc) {
      branchName = `codeforge/intern-${userDoc.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    }

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

    let url = `https://api.github.com/repos/${owner}/${repoName}/commits?per_page=10`;
    if (branchName) {
      url += `&sha=${branchName}`;
    }
    url += `&author=${repo.githubUsername}`;

    let commitsResponse = await fetch(url, {
      headers: {
        'Authorization': `token ${token}`,
        'User-Agent': 'CodeForge',
      },
    });

    // Fall back to default branch if branch doesn't exist yet
    if (!commitsResponse.ok && branchName) {
      commitsResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repoName}/commits?per_page=10&author=${repo.githubUsername}`,
        {
          headers: {
            'Authorization': `token ${token}`,
            'User-Agent': 'CodeForge',
          },
        }
      );
    }

    if (!commitsResponse.ok) {
      const errorText = await commitsResponse.text();
      console.warn('GitHub Commits API error:', errorText);
      return successResponse(res, [], 'Could not retrieve commits from GitHub');
    }

    const commitsData = await commitsResponse.json();
    const simplifiedCommits = (commitsData || [])
      .map((c) => ({
        sha: c.sha,
        message: c.commit.message,
        date: c.commit.author.date,
        author: c.commit.author.name,
        url: c.html_url,
      }))
      .filter((c) => !c.message.toLowerCase().includes('initial commit'));

    return successResponse(res, simplifiedCommits, 'Commits retrieved successfully');
  } catch (error) {
    console.error('Error fetching commits:', error);
    return successResponse(res, [], 'Internal error fetching commits');
  }
};

/**
 * Fetch branches for linked repo
 * Route: GET /api/github/branches
 */
const getBranches = async (req, res, next) => {
  try {
    const role = req.user.role;
    let userId = req.user._id;
    const projectId = req.query.projectId;

    if ((role === 'manager' || role === 'superadmin') && req.query.userId) {
      userId = req.query.userId;
    }

    const query = { userId };
    if (projectId) {
      query.projectId = projectId;
    }

    const repo = await GitHubRepo.findOne(query);
    if (!repo || !repo.accessToken || !repo.githubUsername || !repo.repoName) {
      return successResponse(res, [], 'No connected GitHub repository with OAuth');
    }

    const token = decrypt(repo.accessToken);

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

    const branchesResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repoName}/branches`,
      {
        headers: {
          'Authorization': `token ${token}`,
          'User-Agent': 'CodeForge',
        },
      }
    );

    if (!branchesResponse.ok) {
      console.warn('GitHub Branches API error:', branchesResponse.statusText);
      return successResponse(res, [], 'Could not retrieve branches from GitHub');
    }

    const branchesData = await branchesResponse.json();
    const branchNames = (branchesData || []).map((b) => b.name);

    return successResponse(res, branchNames, 'Branches retrieved successfully');
  } catch (error) {
    console.error('Error fetching branches:', error);
    return successResponse(res, [], 'Internal error fetching branches');
  }
};

/**
 * Fetch pull requests for linked repo
 * Route: GET /api/github/pull-requests
 */
const getPullRequests = async (req, res, next) => {
  try {
    const role = req.user.role;
    let userId = req.user._id;
    const projectId = req.query.projectId;

    if ((role === 'manager' || role === 'superadmin') && req.query.userId) {
      userId = req.query.userId;
    }

    const query = { userId };
    if (projectId) {
      query.projectId = projectId;
    }

    const repo = await GitHubRepo.findOne(query);
    if (!repo || !repo.accessToken || !repo.githubUsername || !repo.repoName) {
      return successResponse(res, [], 'No connected GitHub repository with OAuth');
    }

    const token = decrypt(repo.accessToken);

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

    const pullsResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repoName}/pulls?state=all&per_page=10`,
      {
        headers: {
          'Authorization': `token ${token}`,
          'User-Agent': 'CodeForge',
        },
      }
    );

    if (!pullsResponse.ok) {
      const errorText = await pullsResponse.text();
      console.warn('GitHub Pulls API error:', errorText);
      return successResponse(res, [], 'Could not retrieve pull requests from GitHub');
    }

    const pullsData = await pullsResponse.json();
    const simplifiedPulls = (pullsData || [])
      .filter((p) => p.user && p.user.login.toLowerCase() === repo.githubUsername.toLowerCase())
      .map((p) => ({
        id: p.id,
        title: p.title,
        state: p.state,
        number: p.number,
        url: p.html_url,
        createdAt: p.created_at,
        user: p.user?.login,
      }));

    return successResponse(res, simplifiedPulls, 'Pull requests retrieved successfully');
  } catch (error) {
    console.error('Error fetching pull requests:', error);
    return successResponse(res, [], 'Internal error fetching pull requests');
  }
};

/**
 * Fetch list of GitHub repositories for the authenticated user
 * Route: GET /api/github/user-repos
 */
const getGitHubUserRepos = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const repo = await GitHubRepo.findOne({ userId, accessToken: { $exists: true, $ne: '' } });

    if (!repo || !repo.accessToken) {
      return errorResponse(res, 'No connected GitHub account found. Please connect via OAuth.', 400);
    }

    const token = decrypt(repo.accessToken);

    // Fetch user repositories (both public and private, up to 100)
    const reposResponse = await fetch(
      'https://api.github.com/user/repos?per_page=100&sort=updated',
      {
        headers: {
          'Authorization': `token ${token}`,
          'User-Agent': 'CodeForge',
        },
      }
    );

    if (!reposResponse.ok) {
      const errorText = await reposResponse.text();
      console.error('GitHub user repos fetch error:', errorText);
      return errorResponse(res, 'Could not retrieve repositories from GitHub', 500);
    }

    const reposData = await reposResponse.json();
    const simplifiedRepos = (reposData || []).map((r) => ({
      name: r.name,
      fullName: r.full_name,
      htmlUrl: r.html_url,
    }));

    return successResponse(res, simplifiedRepos, 'Repositories retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Select/update linked repository for the authenticated user
 * Route: PUT /api/github/select-repo
 */
const selectGitHubRepo = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { repoName, repoUrl, projectId } = req.body;

    if (!repoName || !repoUrl || !projectId) {
      return errorResponse(res, 'repoName, repoUrl, and projectId are required.', 400);
    }

    const oauthCredentials = await GitHubRepo.findOne({ userId, accessToken: { $exists: true, $ne: '' } });
    if (!oauthCredentials) {
      return errorResponse(res, 'No connected GitHub account found. Please connect via OAuth first.', 400);
    }

    let repo = await GitHubRepo.findOne({ userId, projectId });

    let githubUsername = oauthCredentials.githubUsername;

    if (repo) {
      repo.repoName = repoName;
      repo.repoUrl = repoUrl;
      repo.githubUsername = githubUsername;
      repo.accessToken = oauthCredentials.accessToken;
      await repo.save();
    } else {
      repo = await GitHubRepo.create({
        userId,
        projectId,
        repoName,
        repoUrl,
        githubUsername,
        accessToken: oauthCredentials.accessToken,
      });
    }

    return successResponse(res, repo, 'Repository linked successfully');
  } catch (error) {
    next(error);
  }
};

const pushToGitHub = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { projectId, commitMessage, files } = req.body;

    if (!projectId || !commitMessage || !files || !Array.isArray(files)) {
      return errorResponse(res, 'projectId, commitMessage, and files array are required.', 400);
    }

    const repo = await GitHubRepo.findOne({ userId, projectId });
    if (!repo || !repo.accessToken || !repo.githubUsername || !repo.repoName) {
      return errorResponse(res, 'No connected GitHub repository found for this workspace. Please link it first.', 400);
    }

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

    const branchName = `codeforge/intern-${req.user.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

    const headers = {
      'Authorization': `token ${token}`,
      'User-Agent': 'CodeForge',
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    };

    const checkResponse = async (response, contextMessage) => {
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(`${contextMessage}: ${errData.message || response.statusText} (Status: ${response.status})`);
      }
      return response.json();
    };

    // 1. Get default branch of the repository
    const repoDetailsRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}`, { headers });
    const repoDetails = await checkResponse(repoDetailsRes, 'Failed to fetch repository details from GitHub');
    const defaultBranch = repoDetails.default_branch || 'main';

    // 2. Check if the intern's branch exists, if not create it
    let targetBranchSha;
    const branchCheckRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/ref/heads/${branchName}`, { headers });
    
    if (branchCheckRes.status === 404 || branchCheckRes.status === 409) {
      // Branch does not exist or repo is empty, create it from default branch
      const defaultBranchRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/ref/heads/${defaultBranch}`, { headers });
      
      let baseSha;
      if (defaultBranchRes.status === 404 || defaultBranchRes.status === 409) {
        // Repository is empty! Create initial README.md to establish default branch
        const createReadmeRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/contents/README.md`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            message: 'initial commit: create README.md',
            content: Buffer.from('# Project Workspace\nCreated by CodeForge.').toString('base64'),
          })
        });
        const readmeData = await checkResponse(createReadmeRes, 'Failed to create initial commit on empty repository');
        baseSha = readmeData.commit.sha;
      } else {
        const defaultBranchData = await checkResponse(defaultBranchRes, 'Failed to fetch default branch reference from GitHub');
        baseSha = defaultBranchData.object.sha;
      }

      // Create branch refs/heads/codeforge/intern-xxx
      const createBranchRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/refs`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ref: `refs/heads/${branchName}`,
          sha: baseSha,
        }),
      });
      await checkResponse(createBranchRes, 'Failed to create intern workspace branch on GitHub');
      targetBranchSha = baseSha;
    } else {
      const branchRefData = await checkResponse(branchCheckRes, 'Failed to retrieve branch reference');
      targetBranchSha = branchRefData.object.sha;
    }

    // 3. Get target branch commit details to find root tree SHA
    const commitDetailsRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/commits/${targetBranchSha}`, { headers });
    const commitDetails = await checkResponse(commitDetailsRes, 'Failed to retrieve branch commit details from GitHub');
    const baseTreeSha = commitDetails.tree.sha;

    // 4. Create new Git Tree
    const treeItems = files.map(file => {
      let cleanPath = file.path;
      if (cleanPath.startsWith('/')) cleanPath = cleanPath.slice(1);
      return {
        path: cleanPath,
        mode: '100644',
        type: 'blob',
        content: file.content
      };
    });

    const createTreeRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/trees`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        base_tree: baseTreeSha,
        tree: treeItems,
      }),
    });
    const newTreeData = await checkResponse(createTreeRes, 'Failed to build Git tree on GitHub');
    const newTreeSha = newTreeData.sha;

    // 5. Create Commit
    const createCommitRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/commits`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message: commitMessage,
        tree: newTreeSha,
        parents: [targetBranchSha],
      }),
    });
    const newCommitData = await checkResponse(createCommitRes, 'Failed to record commit on GitHub');
    const newCommitSha = newCommitData.sha;

    // 6. Update reference pointing to new commit
    const updateRefRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/refs/heads/${branchName}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        sha: newCommitSha,
        force: false,
      }),
    });
    await checkResponse(updateRefRes, 'Failed to update workspace branch pointer on GitHub');

    // 7. Sync files to local database for fast workspace boots
    const FileModel = require('../models/File');
    await FileModel.deleteMany({ projectId, userId });
    const fileDocs = files.map((f) => ({
      projectId,
      userId,
      path: f.path.startsWith('/') ? f.path : `/${f.path}`,
      fileName: f.path.split('/').pop(),
      content: f.content,
    }));
    await FileModel.insertMany(fileDocs);

    return successResponse(res, { commitSha: newCommitSha }, 'Code successfully committed and pushed to GitHub!');
  } catch (error) {
    next(error);
  }
};

const createPullRequest = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { projectId, title, body } = req.body;

    if (!projectId || !title) {
      return errorResponse(res, 'projectId and title are required.', 400);
    }

    const repo = await GitHubRepo.findOne({ userId, projectId });
    if (!repo || !repo.accessToken || !repo.githubUsername || !repo.repoName) {
      return errorResponse(res, 'No connected GitHub repository found for this workspace.', 400);
    }

    const token = decrypt(repo.accessToken);
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

    const branchName = `codeforge/intern-${req.user.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

    const headers = {
      'Authorization': `token ${token}`,
      'User-Agent': 'CodeForge',
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    };

    // 1. Get default branch of the repository
    const repoDetailsRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}`, { headers });
    if (!repoDetailsRes.ok) {
      return errorResponse(res, 'Failed to fetch repository details from GitHub.', 500);
    }
    const repoDetails = await repoDetailsRes.json();
    const defaultBranch = repoDetails.default_branch || 'main';

    // 1b. Check if there are actual code commits (excluding sync/merge commits)
    const compareRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/compare/${defaultBranch}...${branchName}`, { headers });
    if (!compareRes.ok) {
      const errText = await compareRes.text();
      console.warn('GitHub Compare API error:', errText);
      return errorResponse(res, 'No new changes found on your workspace branch. Please write code and Commit & Push before submitting a Pull Request.', 422);
    }
    const compareData = await compareRes.json();
    const commits = compareData.commits || [];
    const userCommits = commits.filter(c => {
      const msg = c.commit.message.toLowerCase();
      return !msg.includes('chore: sync with main branch') && 
             !msg.includes('merge branch') && 
             !msg.includes('merge pull request') &&
             !msg.includes('initial commit');
    });

    if (userCommits.length === 0) {
      return errorResponse(res, 'No new changes found on your workspace branch. Please write code and Commit & Push before submitting a Pull Request.', 422);
    }

    // 2. Create the Pull Request on GitHub
    const createPrRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/pulls`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title,
        head: branchName,
        base: defaultBranch,
        body: body || 'Submitted via CodeForge',
      }),
    });

    if (!createPrRes.ok) {
      const errData = await createPrRes.json().catch(() => ({}));
      let friendlyMessage = errData.message || 'Unknown error';
      
      // Parse validation errors from GitHub (e.g. A pull request already exists)
      if (errData.errors && Array.isArray(errData.errors)) {
        const hasDuplicateError = errData.errors.some(
          (e) => e.message && e.message.toLowerCase().includes('a pull request already exists')
        );
        const hasNoCommitsError = errData.errors.some(
          (e) => e.message && e.message.toLowerCase().includes('no commits between')
        );
        
        if (hasDuplicateError) {
          friendlyMessage = 'A pull request already exists for your workspace branch. You do not need to create another one until your manager merges it.';
        } else if (hasNoCommitsError) {
          friendlyMessage = 'No new changes found on your workspace branch. Please write code and Commit & Push before submitting a Pull Request.';
        }
      }
      
      return errorResponse(res, friendlyMessage, createPrRes.status);
    }

    const prData = await createPrRes.json();

    // Trigger Pull Request Notification for Manager
    try {
      const Project = require('../models/Project');
      const Notification = require('../models/Notification');
      const { emitToUser } = require('../config/socket');

      const project = await Project.findById(projectId);
      if (project && project.managerId) {
        const notification = await Notification.create({
          recipient: project.managerId,
          type: 'project',
          title: 'New Pull Request',
          message: `${req.user.name} has created a Pull Request for project '${project.name}': "${title}".`,
          data: { projectId: project._id.toString(), prNumber: prData.number, prUrl: prData.html_url },
        });

        emitToUser(project.managerId, 'pr:created', {
          id: notification._id,
          type: 'project',
          title: notification.title,
          message: notification.message,
          timestamp: notification.createdAt,
          read: notification.read,
          projectId: project._id,
        });
      }
    } catch (err) {
      console.error('Error creating PR notification:', err);
    }

    return successResponse(res, {
      id: prData.id,
      number: prData.number,
      url: prData.html_url,
      title: prData.title,
    }, 'Pull Request created successfully on GitHub!');
  } catch (error) {
    next(error);
  }
};

const mergePullRequest = async (req, res, next) => {
  try {
    const { projectId, pullNumber } = req.body;

    if (!projectId || !pullNumber) {
      return errorResponse(res, 'projectId and pullNumber are required.', 400);
    }

    const repo = await GitHubRepo.findOne({ projectId, accessToken: { $exists: true, $ne: '' } });
    if (!repo) {
      return errorResponse(res, 'No active GitHub OAuth token found for this project workspace.', 400);
    }

    const token = decrypt(repo.accessToken);
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

    const headers = {
      'Authorization': `token ${token}`,
      'User-Agent': 'CodeForge',
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    };

    // Fetch Pull Request details from GitHub to find the creator/intern before merging
    let internId = null;
    try {
      const prDetailsRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/pulls/${pullNumber}`, { headers });
      if (prDetailsRes.ok) {
        const prDetails = await prDetailsRes.json();
        const creatorLogin = prDetails.user?.login;
        if (creatorLogin) {
          const GitHubRepo = require('../models/GitHubRepo');
          const internRepo = await GitHubRepo.findOne({
            projectId,
            githubUsername: new RegExp('^' + creatorLogin + '$', 'i')
          });
          if (internRepo) {
            internId = internRepo.userId;
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch PR details for notification:', err);
    }

    // Merge the Pull Request on GitHub
    const mergeRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/pulls/${pullNumber}/merge`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        commit_title: `Merge Pull Request #${pullNumber} by CodeForge Manager`,
        merge_method: 'merge',
      }),
    });

    if (!mergeRes.ok) {
      const errData = await mergeRes.json().catch(() => ({}));
      return errorResponse(res, `Merge failed: ${errData.message || 'Unknown error'}`, mergeRes.status);
    }

    const mergeData = await mergeRes.json();

    // Trigger Pull Request Merged Notification for the Intern
    if (internId) {
      try {
        const Project = require('../models/Project');
        const Notification = require('../models/Notification');
        const { emitToUser } = require('../config/socket');

        const project = await Project.findById(projectId);
        const notification = await Notification.create({
          recipient: internId,
          type: 'project',
          title: 'Pull Request Merged',
          message: `Your Pull Request #${pullNumber} for project '${project ? project.name : ''}' has been approved and merged!`,
          data: { projectId, pullNumber },
        });

        emitToUser(internId, 'pr:merged', {
          id: notification._id,
          type: 'project',
          title: notification.title,
          message: notification.message,
          timestamp: notification.createdAt,
          read: notification.read,
          projectId,
        });
      } catch (err) {
        console.error('Error creating PR merge notification:', err);
      }
    }

    return successResponse(res, mergeData, 'Pull Request successfully approved and merged!');
  } catch (error) {
    next(error);
  }
};

const syncFromMain = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { projectId } = req.body;

    if (!projectId) {
      return errorResponse(res, 'projectId is required.', 400);
    }

    const repo = await GitHubRepo.findOne({ userId, projectId });
    if (!repo || !repo.accessToken || !repo.githubUsername || !repo.repoName) {
      return errorResponse(res, 'No connected GitHub repository found for this workspace. Please link it first.', 400);
    }

    const token = decrypt(repo.accessToken);
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

    const branchName = `codeforge/intern-${req.user.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

    const headers = {
      'Authorization': `token ${token}`,
      'User-Agent': 'CodeForge',
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    };

    const checkResponse = async (response, contextMessage) => {
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(`${contextMessage}: ${errData.message || response.statusText} (Status: ${response.status})`);
      }
      return response.json();
    };

    // 1. Get default branch of the repository
    const repoDetailsRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}`, { headers });
    const repoDetails = await checkResponse(repoDetailsRes, 'Failed to fetch repository details from GitHub');
    const defaultBranch = repoDetails.default_branch || 'main';

    // 2. Check if the intern's branch exists, if not create it from default branch
    const branchCheckRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/ref/heads/${branchName}`, { headers });
    
    if (branchCheckRes.status === 404 || branchCheckRes.status === 409) {
      // Branch does not exist, create it pointing to the default branch
      const defaultBranchRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/ref/heads/${defaultBranch}`, { headers });
      const defaultBranchData = await checkResponse(defaultBranchRes, 'Failed to fetch default branch reference from GitHub');
      const baseSha = defaultBranchData.object.sha;

      const createBranchRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/refs`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ref: `refs/heads/${branchName}`,
          sha: baseSha,
        }),
      });
      await checkResponse(createBranchRes, 'Failed to create intern workspace branch on GitHub');
      console.log(`Created branch ${branchName} from ${defaultBranch} since it did not exist yet.`);
    } else {
      // Branch exists, perform merge from default branch into the intern's branch
      const mergeRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/merges`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          base: branchName,
          head: defaultBranch,
          commit_message: 'chore: sync with main branch',
        }),
      });

      if (mergeRes.status === 409) {
        return errorResponse(res, 'Merge conflict detected. Your workspace has conflicting changes with the main branch. Please ask your manager or resolve manually.', 409);
      }

      if (!mergeRes.ok && mergeRes.status !== 204) {
        const errData = await mergeRes.json().catch(() => ({}));
        return errorResponse(res, `Sync failed: ${errData.message || 'Unknown error'}`, mergeRes.status);
      }
    }

    // 3. Fetch latest file tree recursively from GitHub contents API
    const fetchFilesFromGitHub = async (dirPath = '') => {
      const res = await fetch(`https://api.github.com/repos/${owner}/${repoName}/contents/${dirPath}?ref=${branchName}`, { headers });
      if (!res.ok) return [];
      const items = await res.json();
      let files = [];
      for (const item of items) {
        if (item.type === 'file') {
          const fileContentRes = await fetch(item.url, { headers });
          const fileContentData = await fileContentRes.json();
          const content = Buffer.from(fileContentData.content, 'base64').toString('utf8');
          files.push({
            path: item.path,
            content
          });
        } else if (item.type === 'dir') {
          const subFiles = await fetchFilesFromGitHub(item.path);
          files = files.concat(subFiles);
        }
      }
      return files;
    };

    const gitFiles = await fetchFilesFromGitHub();

    // 4. Update MongoDB files collection
    const FileModel = require('../models/File');
    await FileModel.deleteMany({ projectId, userId });

    if (gitFiles && gitFiles.length > 0) {
      const fileDocs = gitFiles.map((f) => ({
        projectId,
        userId,
        path: f.path.startsWith('/') ? f.path : `/${f.path}`,
        fileName: f.path.split('/').pop(),
        content: f.content,
      }));
      await FileModel.insertMany(fileDocs);
    }

    return successResponse(res, { syncedFilesCount: gitFiles.length }, 'Workspace successfully synced with main branch!');
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
  syncFromMain,
};
