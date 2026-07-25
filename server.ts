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
      return JSON.parse(raw) as GumroadConfig;
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
    products: []
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

  return res.status(400).json({ success: false, error: "Invalid CLI command simulated" });
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
