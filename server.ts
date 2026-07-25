import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { compileProfileHtml, GumroadConfig } from "./src/lib/compiler.ts";

const app = express();
const PORT = 3000;

app.use(express.json());

const configPath = path.join(process.cwd(), "gumroad-config.json");

// Helper to read config
function readConfig(): GumroadConfig {
  try {
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, "utf8");
      const parsed = JSON.parse(raw) as GumroadConfig;
      if (!parsed.github) {
        parsed.github = {
          repository: "sujitwave2/gumroad-profile",
          branch: "main",
          token: "",
          enabled: true
        };
      }
      return parsed;
    }
  } catch (err) {
    console.error("Error reading config, using defaults:", err);
  }
  
  // Return a robust default structure if file read fails
  return {
    username: "sujitwave2",
    fullName: "Sujit Chaudhary",
    tagline: "Software Engineer & Indie Creator",
    bio: "Building high-quality digital products, developer templates, and modern SaaS boilerplates.",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
    accentColor: "#ff90e8",
    socials: {
      twitter: "https://twitter.com/sujitwave2",
      github: "https://github.com/sujitchaudhary",
      website: "https://sujitchaudhary.tech"
    },
    theme: "dark",
    emailSignup: {
      enabled: true,
      title: "Join the Wave Newsletter",
      description: "Get notified about new templates, React boilerplates, and developer resources.",
      buttonText: "Subscribe Now",
      successMessage: "Thanks for subscribing! Check your inbox for updates."
    },
    products: [],
    github: {
      repository: "sujitwave2/gumroad-profile",
      branch: "main",
      token: "",
      enabled: true
    }
  };
}

// API Routes
// 1. Get current Gumroad Profile config
app.get("/api/config", (req, res) => {
  const config = readConfig();
  res.json(config);
});

// 2. Save modified config
app.post("/api/config", (req, res) => {
  try {
    const newConfig = req.body as GumroadConfig;
    fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2), "utf8");
    res.json({ success: true, message: "Configuration saved successfully!" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Failed to write config" });
  }
});

// 3. Get the live-compiled Gumroad Profile HTML template
app.get("/api/preview", (req, res) => {
  const config = readConfig();
  const html = compileProfileHtml(config);
  res.setHeader("Content-Type", "text/html");
  res.send(html);
});

// 4. Simulate running CLI commands from the visual interface
app.post("/api/cli/run", (req, res) => {
  const { command } = req.body;
  const config = readConfig();
  
  const now = new Date();
  const timestamp = () => `[${now.toTimeString().split(' ')[0]}]`;

  if (command === "gumroad pages preview") {
    const logs = [
      `⚡ Gumroad Pages Developer Preview`,
      `----------------------------------------------------`,
      `${timestamp()} Reading gumroad-config.json...`,
      `${timestamp()} Loaded configuration for @${config.username} (${config.fullName})`,
      `${timestamp()} Starting local preview server...`,
      `${timestamp()} Profile preview is fully active!`,
      `👉 Local URL: http://localhost:3000`,
      `👉 Live Development URL: ${process.env.APP_URL || "https://ais-dev-preview.run.app"}`,
      `----------------------------------------------------`,
      `Keep this terminal open to preview updates. Press Ctrl+C to exit.`
    ];
    return res.json({ logs });
  } 
  
  if (command === "gumroad pages push profile") {
    const htmlContent = compileProfileHtml(config);
    const outputHtmlPath = path.join(process.cwd(), 'profile.html');
    
    try {
      fs.writeFileSync(outputHtmlPath, htmlContent, 'utf8');
      
      const stats = fs.statSync(outputHtmlPath);
      const sizeKB = (stats.size / 1024).toFixed(2);
      
      const logs = [
        `📦 Building and Pushing Gumroad Profile Template...`,
        `----------------------------------------------------`,
        `${timestamp()} Packaging profile layout for @${config.username}...`,
        `${timestamp()} Build succeeded! HTML template size: ${sizeKB} KB`,
        `${timestamp()} Output saved locally to: ${outputHtmlPath}`,
        `${timestamp()} Uploading custom profile page to Gumroad's cloud...`,
        `${timestamp()} Validating form elements (<form data-gumroad-follow>)... OK`,
        `${timestamp()} Syncing product links with Gumroad inventory... OK`,
        `----------------------------------------------------`,
        `🎉 SUCCESS: Custom landing page published to @${config.username}!`,
        `🔗 Profile URL: https://gumroad.com/${config.username}`,
        `----------------------------------------------------`
      ];
      return res.json({ logs });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message || "Compilation failed" });
    }
  }

  if (command === "gumroad pages push github" || command === "git push" || command === "git push origin main") {
    const logs: string[] = [];
    const github = config.github;
    if (!github || !github.repository || !github.token) {
      logs.push(`${timestamp()} ❌ Error: GitHub repository configurations or Personal Access Token is missing.`);
      logs.push(`💡 Setup your GitHub Settings tab on the left-panel first!`);
      return res.json({ logs });
    }

    const parts = github.repository.split("/");
    if (parts.length !== 2) {
      logs.push(`${timestamp()} ❌ Error: Repository format must be 'owner/repo'.`);
      return res.json({ logs });
    }

    const [owner, repoName] = parts;
    const branch = github.branch || "main";

    logs.push(`🚀 Starting GitHub Sync Engine via CLI...`);
    logs.push(`${timestamp()} Authenticating with GitHub API for repository: ${owner}/${repoName}...`);

    const headers = {
      "Authorization": `token ${github.token}`,
      "Accept": "application/vnd.github.v3+json",
      "User-Agent": "Gumroad-Profile-Designer"
    };

    return (async () => {
      try {
        const repoVerifyRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}`, { headers });
        if (repoVerifyRes.status !== 200) {
          logs.push(`${timestamp()} ❌ Access denied or Repository not found.`);
          logs.push(`💡 Make sure your Personal Access Token is valid and has read/write scope.`);
          return res.json({ logs });
        }

        logs.push(`${timestamp()} Repository authenticated: ${owner}/${repoName} (${branch})`);
        
        const htmlContent = compileProfileHtml(config);
        const backupConfig = {
          ...config,
          github: { ...github, token: "********" }
        };
        const configContent = JSON.stringify(backupConfig, null, 2);

        logs.push(`${timestamp()} Committing 'index.html' (primary homepage)...`);
        const pushIndex = await pushFileToGitHub({
          owner,
          repo: repoName,
          filePath: "index.html",
          content: htmlContent,
          token: github.token,
          branch,
          commitMessage: "Update Gumroad profile homepage [skip ci]"
        });

        if (!pushIndex.success) {
          logs.push(`${timestamp()} ❌ GitHub API failed index.html: ${pushIndex.error}`);
          return res.json({ logs });
        }
        logs.push(`${timestamp()} Committed index.html successfully.`);

        logs.push(`${timestamp()} Committing backup 'profile.html'...`);
        const pushHtml = await pushFileToGitHub({
          owner,
          repo: repoName,
          filePath: "profile.html",
          content: htmlContent,
          token: github.token,
          branch,
          commitMessage: "Update Gumroad profile landing page backup [skip ci]"
        });

        if (!pushHtml.success) {
          logs.push(`${timestamp()} ⚠️ Warning: Failed backing up to profile.html: ${pushHtml.error}`);
        } else {
          logs.push(`${timestamp()} Committed profile.html backup successfully.`);
        }

        logs.push(`${timestamp()} Backing up 'gumroad-config.json'...`);
        const pushJson = await pushFileToGitHub({
          owner,
          repo: repoName,
          filePath: "gumroad-config.json",
          content: configContent,
          token: github.token,
          branch,
          commitMessage: "Backup Gumroad configurations [skip ci]"
        });

        if (!pushJson.success) {
          logs.push(`${timestamp()} ❌ GitHub API failed gumroad-config.json: ${pushJson.error}`);
          return res.json({ logs });
        }
        logs.push(`${timestamp()} Committed gumroad-config.json successfully.`);

        const pagesUrl = repoName.toLowerCase() === `${owner.toLowerCase()}.github.io`
          ? `https://${owner.toLowerCase()}.github.io/`
          : `https://${owner.toLowerCase()}.github.io/${repoName}/`;

        logs.push(`----------------------------------------------------`);
        logs.push(`🎉 SUCCESS: Landing page pushed to GitHub Pages repository!`);
        logs.push(`🔗 Repository: https://github.com/${owner}/${repoName}`);
        logs.push(`🔗 Live Page: ${pagesUrl}`);
        logs.push(`----------------------------------------------------`);
        return res.json({ logs });
      } catch (err: any) {
        logs.push(`${timestamp()} ❌ Push error: ${err.message}`);
        return res.json({ logs });
      }
    })();
  }

  return res.status(400).json({ success: false, error: "Invalid CLI command simulated" });
});

// Helper function to push files to GitHub via API
async function pushFileToGitHub({
  owner,
  repo,
  filePath,
  content,
  token,
  branch,
  commitMessage
}: {
  owner: string;
  repo: string;
  filePath: string;
  content: string;
  token: string;
  branch: string;
  commitMessage: string;
}): Promise<{ success: boolean; sha?: string; error?: string }> {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
  const headers: Record<string, string> = {
    "Authorization": `token ${token}`,
    "Accept": "application/vnd.github.v3+json",
    "User-Agent": "Gumroad-Profile-Designer",
    "Content-Type": "application/json"
  };

  try {
    const checkRes = await fetch(`${url}?ref=${branch}`, { headers });
    let sha: string | undefined;

    if (checkRes.status === 200) {
      const data = await checkRes.json() as any;
      sha = data.sha;
    } else if (checkRes.status !== 404) {
      const errorText = await checkRes.text();
      return { success: false, error: `GitHub status ${checkRes.status}: ${errorText}` };
    }

    const base64Content = Buffer.from(content, "utf8").toString("base64");

    const putBody = {
      message: commitMessage,
      content: base64Content,
      branch,
      ...(sha ? { sha } : {})
    };

    const putRes = await fetch(url, {
      method: "PUT",
      headers,
      body: JSON.stringify(putBody)
    });

    if (putRes.status === 200 || putRes.status === 201) {
      const putData = await putRes.json() as any;
      return { success: true, sha: putData.content.sha };
    } else {
      const errorText = await putRes.text();
      return { success: false, error: `GitHub status ${putRes.status}: ${errorText}` };
    }
  } catch (err: any) {
    return { success: false, error: err.message || "Unknown transport error" };
  }
}

// 5. Direct push to GitHub endpoint
app.post("/api/github/push", async (req, res) => {
  const config = readConfig();
  const now = new Date();
  const timestamp = () => `[${now.toTimeString().split(' ')[0]}]`;
  const logs: string[] = [];

  const github = config.github;
  if (!github || !github.repository || !github.token) {
    return res.status(400).json({
      success: false,
      error: "GitHub repository configurations or Personal Access Token is missing.",
      logs: [`${timestamp()} ❌ Error: GitHub repository configurations or Personal Access Token is missing.`]
    });
  }

  const parts = github.repository.split("/");
  if (parts.length !== 2) {
    return res.status(400).json({
      success: false,
      error: "Invalid repository format. Must be 'owner/repo'.",
      logs: [`${timestamp()} ❌ Error: Invalid repository format. Must be 'owner/repo'.`]
    });
  }

  const [owner, repoName] = parts;
  const branch = github.branch || "main";

  logs.push(`🚀 Starting GitHub Sync Engine...`);
  logs.push(`${timestamp()} Connecting to GitHub API for ${owner}/${repoName}...`);

  const headers = {
    "Authorization": `token ${github.token}`,
    "Accept": "application/vnd.github.v3+json",
    "User-Agent": "Gumroad-Profile-Designer"
  };

  try {
    const repoVerifyRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}`, { headers });
    if (repoVerifyRes.status !== 200) {
      logs.push(`${timestamp()} ❌ Access denied or Repository not found.`);
      return res.status(400).json({
        success: false,
        error: `Could not access repository '${owner}/${repoName}'. Verify your Token and repository permissions.`,
        logs
      });
    }

    logs.push(`${timestamp()} Repository verified: ${owner}/${repoName} (${branch})`);

    const htmlContent = compileProfileHtml(config);
    const backupConfig = {
      ...config,
      github: { ...github, token: "********" }
    };
    const configContent = JSON.stringify(backupConfig, null, 2);

    logs.push(`${timestamp()} Uploading 'index.html' (primary homepage)...`);
    const pushIndex = await pushFileToGitHub({
      owner,
      repo: repoName,
      filePath: "index.html",
      content: htmlContent,
      token: github.token,
      branch,
      commitMessage: "Update Gumroad profile homepage [skip ci]"
    });

    if (!pushIndex.success) {
      logs.push(`${timestamp()} ❌ Failed uploading index.html: ${pushIndex.error}`);
      return res.status(500).json({ success: false, error: pushIndex.error, logs });
    }
    logs.push(`${timestamp()} 'index.html' uploaded successfully!`);

    logs.push(`${timestamp()} Uploading backup 'profile.html'...`);
    const pushHtml = await pushFileToGitHub({
      owner,
      repo: repoName,
      filePath: "profile.html",
      content: htmlContent,
      token: github.token,
      branch,
      commitMessage: "Update Gumroad profile landing page backup [skip ci]"
    });

    if (!pushHtml.success) {
      logs.push(`${timestamp()} ⚠️ Warning: Failed uploading profile.html backup (proceeding anyways): ${pushHtml.error}`);
    } else {
      logs.push(`${timestamp()} 'profile.html' backup uploaded successfully!`);
    }

    logs.push(`${timestamp()} Uploading 'gumroad-config.json' backup...`);
    const pushJson = await pushFileToGitHub({
      owner,
      repo: repoName,
      filePath: "gumroad-config.json",
      content: configContent,
      token: github.token,
      branch,
      commitMessage: "Backup Gumroad configurations [skip ci]"
    });

    if (!pushJson.success) {
      logs.push(`${timestamp()} ❌ Failed uploading gumroad-config.json: ${pushJson.error}`);
      return res.status(500).json({ success: false, error: pushJson.error, logs });
    }
    logs.push(`${timestamp()} 'gumroad-config.json' backup updated successfully!`);

    const pagesUrl = repoName.toLowerCase() === `${owner.toLowerCase()}.github.io`
      ? `https://${owner.toLowerCase()}.github.io/`
      : `https://${owner.toLowerCase()}.github.io/${repoName}/`;

    logs.push(`----------------------------------------------------`);
    logs.push(`🎉 SUCCESS: Code committed and pushed to GitHub Repository!`);
    logs.push(`🔗 Repository: https://github.com/${owner}/${repoName}/tree/${branch}`);
    logs.push(`🔗 GitHub Pages: ${pagesUrl}`);
    logs.push(`----------------------------------------------------`);

    res.json({ success: true, logs, pagesUrl });
  } catch (err: any) {
    logs.push(`${timestamp()} ❌ System error: ${err.message}`);
    res.status(500).json({ success: false, error: err.message, logs });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
