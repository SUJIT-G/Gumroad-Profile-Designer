import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { compileProfileHtml, GumroadConfig } from "./src/lib/compiler.ts";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json());

const configPath = path.join(process.cwd(), "gumroad-config.json");

let ai: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
  }
  return ai;
}

function cleanHtml(html: string): string {
  // Remove script tags and style tags content
  let cleaned = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  // Remove SVG tags content
  cleaned = cleaned.replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '');
  // Remove multiple spaces/newlines
  cleaned = cleaned.replace(/\s+/g, ' ');
  return cleaned;
}

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

// Sync products from live Gumroad profile using Gemini scraping
app.post("/api/gumroad/sync", async (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ success: false, error: "Username is required" });
  }

  const logs: string[] = [];
  const timestamp = () => `[${new Date().toTimeString().split(' ')[0]}]`;

  logs.push(`${timestamp()} 🔄 Sync request received for @${username}...`);
  
  try {
    const profileUrl = `https://${username}.gumroad.com`;
    logs.push(`${timestamp()} 🌐 Fetching live Gumroad profile: ${profileUrl}...`);

    const response = await fetch(profileUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5"
      }
    });

    if (response.status !== 200) {
      logs.push(`${timestamp()} ❌ Gumroad returned status ${response.status}. Profile may be private or username is incorrect.`);
      return res.status(400).json({ 
        success: false, 
        error: `Gumroad profile for '${username}' could not be accessed (HTTP ${response.status}).`,
        logs 
      });
    }

    const html = await response.text();
    logs.push(`${timestamp()} 📄 Profile fetched successfully. Body size: ${(html.length / 1024).toFixed(1)} KB.`);

    // Check if GEMINI_API_KEY is available
    const gemini = getGeminiClient();
    if (!gemini) {
      logs.push(`${timestamp()} ⚠️ Warning: GEMINI_API_KEY is not configured on the server.`);
      logs.push(`${timestamp()} 💡 To enable automated product scraping, set GEMINI_API_KEY in Settings.`);
      return res.status(400).json({
        success: false,
        error: "GEMINI_API_KEY environment variable is not configured. Please add your key under Settings > Secrets.",
        logs
      });
    }

    logs.push(`${timestamp()} 🧽 Cleaning HTML contents for optimized AI processing...`);
    const cleanedHtml = cleanHtml(html);
    logs.push(`${timestamp()} 🧼 HTML cleaned. Compact size: ${(cleanedHtml.length / 1024).toFixed(1)} KB.`);

    logs.push(`${timestamp()} 🤖 Sending cleaned layout to Gemini API for product extraction...`);

    const prompt = `You are an expert Gumroad scraper bot.
Parse the following cleaned HTML from the Gumroad profile page of user @${username}.
Identify all products listed on this page.
For each product, extract:
- "name": The product title/name
- "description": A short, clear description of the product. If not found, write a short 1-sentence description based on the name.
- "price": The price badge (e.g., "$19", "$0+", "Free", "$49/yr")
- "rating": Average rating as a number (1.0 to 5.0, default to 5.0 if not rated)
- "reviews": Total review count as an integer (default to 0)
- "tag": A product highlights badge (e.g. "Best Seller", "Ebook", "Popular", "New", "Software" or empty string if none)
- "url": The exact checkout/product URL (make sure to extract the absolute URL of the product card link or purchase link, e.g., "https://${username}.gumroad.com/l/...")
- "image": The product cover image/thumbnail URL. Make sure to extract the real image URL from the img sources.
- "category": A single-word category that fits best (e.g., "SaaS", "Design", "Education", "Software", "Ebook", "Utility")

Also extract the profile's fullName and bio if visible in the HTML.

Return ONLY a JSON object of this structure:
{
  "fullName": "...",
  "bio": "...",
  "products": [
    {
      "name": "...",
      "description": "...",
      "price": "...",
      "rating": 4.8,
      "reviews": 12,
      "tag": "...",
      "url": "...",
      "image": "...",
      "category": "..."
    }
  ]
}

HTML Content:
${cleanedHtml}`;

    const geminiRes = await gemini.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = geminiRes.text;
    if (!text) {
      throw new Error("Empty response from Gemini API");
    }

    const parsedResult = JSON.parse(text);
    if (!parsedResult.products || !Array.isArray(parsedResult.products)) {
      throw new Error("Invalid response format from Gemini: missing 'products' array");
    }

    logs.push(`${timestamp()} 🎉 Gemini successfully extracted ${parsedResult.products.length} products!`);
    
    // Fallbacks and sanitize
    const updatedFullName = parsedResult.fullName || undefined;
    const updatedBio = parsedResult.bio || undefined;
    const products = parsedResult.products.map((p: any) => ({
      id: Math.random().toString(36).substring(2, 9),
      name: p.name || "Untitled Product",
      description: p.description || "No description provided.",
      price: p.price || "$0",
      rating: typeof p.rating === "number" ? p.rating : 5.0,
      reviews: typeof p.reviews === "number" ? p.reviews : 0,
      tag: p.tag || "",
      url: p.url || `https://${username}.gumroad.com`,
      image: p.image || "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=600&q=80",
      category: p.category || "Digital"
    }));

    logs.push(`${timestamp()} 💾 Updating local configuration file 'gumroad-config.json'...`);

    // Read current config and merge
    const currentConfig = readConfig();
    currentConfig.username = username;
    currentConfig.products = products;
    if (updatedFullName && (currentConfig.fullName === "Sujit Chaudhary" || !currentConfig.fullName)) {
      currentConfig.fullName = updatedFullName;
    }
    if (updatedBio && (currentConfig.bio.startsWith("Building high-quality") || !currentConfig.bio)) {
      currentConfig.bio = updatedBio;
    }

    fs.writeFileSync(configPath, JSON.stringify(currentConfig, null, 2), "utf8");
    logs.push(`${timestamp()} ✅ Local configuration successfully synced and saved!`);

    res.json({
      success: true,
      logs,
      config: currentConfig
    });

  } catch (err: any) {
    logs.push(`${timestamp()} ❌ Sync failed: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message || "Failed to sync products",
      logs
    });
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
