import { useState, useEffect, useRef } from "react";
import { 
  Paintbrush, 
  Settings, 
  User, 
  Mail, 
  Plus, 
  Trash2, 
  ExternalLink, 
  Globe, 
  Terminal as TerminalIcon, 
  Copy, 
  Download, 
  Laptop, 
  Smartphone, 
  Sun, 
  Moon, 
  CheckCircle, 
  AlertCircle, 
  ArrowRight, 
  ChevronDown, 
  ChevronUp, 
  Star, 
  Sparkles,
  RefreshCw,
  Send,
  Github,
  Twitter
} from "lucide-react";
import { compileProfileHtml, GumroadConfig, Product } from "./lib/compiler";

export default function App() {
  // Global configuration state
  const [config, setConfig] = useState<GumroadConfig | null>(null);
  const [originalConfig, setOriginalConfig] = useState<GumroadConfig | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Customizer accordion active tab
  const [activeTab, setActiveTab] = useState<"general" | "products" | "socials" | "newsletter" | "github" | "cli">("general");

  // GitHub integration states
  const [isGithubPushing, setIsGithubPushing] = useState(false);
  const [githubPushSuccess, setGithubPushSuccess] = useState<boolean | null>(null);
  const [githubPagesUrl, setGithubPagesUrl] = useState<string | null>(null);

  // Device / preview simulator state
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [previewTheme, setPreviewTheme] = useState<"light" | "dark">("dark");
  const [previewMode, setPreviewMode] = useState<"visual" | "code">("visual");

  // CLI Console / Terminal simulator state
  const [cliLogs, setCliLogs] = useState<string[]>([
    "Gumroad Pages CLI v1.0.0 is initialized and ready.",
    "Type 'gumroad pages preview' to start local preview server.",
    "Type 'gumroad pages push profile' to build local profile page.",
    "Type 'gumroad pages push github' or 'git push' to sync and publish to your GitHub Pages repository."
  ]);
  const [cliCommand, setCliCommand] = useState("");
  const [isCliLoading, setIsCliLoading] = useState(false);
  const [showCli, setShowCli] = useState(true);
  const terminalBottomRef = useRef<HTMLDivElement>(null);

  // Load configuration on mount
  useEffect(() => {
    fetch("/api/config")
      .then(res => res.json())
      .then((data: GumroadConfig) => {
        if (!data.github) {
          data.github = {
            repository: "sujitwave2/gumroad-profile",
            branch: "main",
            token: "",
            enabled: true
          };
        }
        setConfig(data);
        setOriginalConfig(JSON.parse(JSON.stringify(data)));
        // Align preview theme with user's configured default theme
        if (data.theme === "light" || data.theme === "dark") {
          setPreviewTheme(data.theme);
        }
      })
      .catch(err => console.error("Error loading config:", err));
  }, []);

  // Auto-scroll terminal to bottom
  useEffect(() => {
    if (terminalBottomRef.current) {
      terminalBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [cliLogs]);

  if (!config) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-300 gap-3" id="loading-state">
        <RefreshCw className="w-6 h-6 animate-spin text-fuchsia-400" />
        <span className="font-medium tracking-wide">Loading Gumroad Profile Workspace...</span>
      </div>
    );
  }

  // Handle value modifications
  const updateConfigField = (field: string, value: any) => {
    setConfig(prev => {
      if (!prev) return null;
      return { ...prev, [field]: value };
    });
  };

  const updateNestedField = (parent: string, field: string, value: any) => {
    setConfig(prev => {
      if (!prev) return null;
      const parentObj = (prev as any)[parent];
      return {
        ...prev,
        [parent]: { ...parentObj, [field]: value }
      };
    });
  };

  // Product actions
  const addProduct = () => {
    const newProduct: Product = {
      id: Math.random().toString(36).substring(2, 9),
      name: "New Custom Product",
      description: "Enter a compelling description for your new digital product that will attract buyers and explain its main benefits.",
      price: "$29",
      rating: 5.0,
      reviews: 1,
      tag: "New",
      url: `https://${config.username}.gumroad.com/l/new-product`,
      image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=600&q=80",
      category: "Software"
    };

    setConfig(prev => {
      if (!prev) return null;
      return { ...prev, products: [...prev.products, newProduct] };
    });
  };

  const updateProduct = (id: string, updatedField: keyof Product, value: any) => {
    setConfig(prev => {
      if (!prev) return null;
      const products = prev.products.map(p => {
        if (p.id === id) {
          return { ...p, [updatedField]: value };
        }
        return p;
      });
      return { ...prev, products };
    });
  };

  const deleteProduct = (id: string) => {
    setConfig(prev => {
      if (!prev) return null;
      return { ...prev, products: prev.products.filter(p => p.id !== id) };
    });
  };

  // Save changes to disk
  const saveChanges = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config)
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        setOriginalConfig(JSON.parse(JSON.stringify(config)));
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Failed to save changes:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Compile visual preview document using current unsaved frontend state
  // We manipulate the template theme dynamically in the browser based on previewTheme state
  const getCompiledDoc = () => {
    const previewConfig = { ...config, theme: previewTheme };
    return compileProfileHtml(previewConfig);
  };

  // Copy HTML to Clipboard
  const copyHtmlCode = () => {
    const html = getCompiledDoc();
    navigator.clipboard.writeText(html);
    alert("HTML code copied to your clipboard successfully!");
  };

  // Download profile.html
  const downloadHtmlFile = () => {
    const html = getCompiledDoc();
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "profile.html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Trigger GitHub push
  const triggerGithubPush = async () => {
    if (isGithubPushing) return;
    setIsGithubPushing(true);
    setGithubPushSuccess(null);
    setGithubPagesUrl(null);
    
    setCliLogs(prev => [...prev, "[Workspace] Auto-saving workspace state before GitHub push..."]);
    await saveChanges();
    
    try {
      setCliLogs(prev => [...prev, "[GitHub Sync] Connecting to server-side push engine..."]);
      const res = await fetch("/api/github/push", {
        method: "POST"
      });
      const data = await res.json();
      
      if (data.success) {
        setGithubPushSuccess(true);
        setGithubPagesUrl(data.pagesUrl);
        if (data.logs) {
          setCliLogs(prev => [...prev, ...data.logs]);
        }
      } else {
        setGithubPushSuccess(false);
        if (data.logs) {
          setCliLogs(prev => [...prev, ...data.logs]);
        }
        alert(data.error || "GitHub push failed. Please review your settings.");
      }
    } catch (err) {
      console.error("GitHub Push error:", err);
      setGithubPushSuccess(false);
      setCliLogs(prev => [...prev, "❌ Error: Failed to contact the backend service for GitHub push."]);
    } finally {
      setIsGithubPushing(false);
    }
  };

  // Simulated CLI trigger
  const runSimulatedCli = async (cmd: string) => {
    if (!cmd.trim() || isCliLoading) return;
    
    const formattedCmd = cmd.trim();
    setIsCliLoading(true);
    setCliCommand("");
    setCliLogs(prev => [...prev, `> ${formattedCmd}`]);

    // Save changes first if they push profile or push github, so the build has latest changes
    if (formattedCmd === "gumroad pages push profile" || formattedCmd === "gumroad pages push github" || formattedCmd === "git push" || formattedCmd === "git push origin main") {
      setCliLogs(prev => [...prev, "[Workspace] Auto-saving workspace state..."]);
      await saveChanges();
    }

    try {
      const res = await fetch("/api/cli/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: formattedCmd })
      });
      const data = await res.json();
      if (data.logs) {
        // Render logs incrementally for aesthetic realism
        let i = 0;
        const interval = setInterval(() => {
          if (i < data.logs.length) {
            setCliLogs(prev => [...prev, data.logs[i]]);
            i++;
          } else {
            clearInterval(interval);
            setIsCliLoading(false);
          }
        }, 80);
      } else {
        setCliLogs(prev => [...prev, `Error: ${data.error || "Execution failed"}`]);
        setIsCliLoading(false);
      }
    } catch (err) {
      setCliLogs(prev => [...prev, "Error: CLI process disconnected."]);
      setIsCliLoading(false);
    }
  };

  // Highlight modified fields
  const isModified = JSON.stringify(config) !== JSON.stringify(originalConfig);

  // Premium color options
  const colorPresets = [
    { value: "#ff90e8", label: "Gumroad Pink" },
    { value: "#22c55e", label: "Developer Green" },
    { value: "#3b82f6", label: "Cyber Blue" },
    { value: "#f59e0b", label: "Sunset Amber" },
    { value: "#ec4899", label: "Fuchsia Wave" },
    { value: "#000000", label: "Pitch Black" }
  ];

  return (
    <div className="min-h-screen bg-[#05070c] text-slate-100 flex flex-col font-sans select-none overflow-x-hidden" id="workspace-container">
      {/* Upper Navigation/Header Bar */}
      <header className="bg-[#0b0e14] border-b border-slate-800 px-6 py-4 flex items-center justify-between shadow-lg sticky top-0 z-40" id="app-header">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-fuchsia-500 to-indigo-500 rounded-xl shadow-md text-slate-950">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-md font-bold tracking-tight text-white flex items-center gap-2">
              Gumroad Profile Designer
              <span className="text-xs bg-fuchsia-950/60 text-fuchsia-400 border border-fuchsia-800/50 font-semibold px-2 py-0.5 rounded-full">
                @${config.username}
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Custom HTML layout & follow audience engine</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isModified && (
            <span className="text-xs text-amber-400 font-semibold flex items-center gap-1.5 animate-pulse bg-amber-950/40 border border-amber-900/50 px-2.5 py-1 rounded-md">
              <AlertCircle className="w-3.5 h-3.5" /> Unsaved Changes
            </span>
          )}
          
          <button
            onClick={saveChanges}
            disabled={isSaving}
            className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all ${
              saveSuccess 
                ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400" 
                : "bg-slate-100 text-slate-900 hover:bg-white active:scale-95 disabled:opacity-50"
            }`}
            id="save-button"
          >
            {isSaving ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : saveSuccess ? (
              <CheckCircle className="w-3.5 h-3.5" />
            ) : (
              <Settings className="w-3.5 h-3.5" />
            )}
            {isSaving ? "Saving..." : saveSuccess ? "Saved!" : "Save Configuration"}
          </button>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <div className="flex-grow flex flex-col lg:flex-row min-h-0" id="main-frame">
        
        {/* Left Side: Customizer Controls (Scrollable) */}
        <div className="w-full lg:w-[480px] bg-[#0b0e14] border-r border-slate-800/80 flex flex-col shrink-0 overflow-y-auto" id="left-workspace-panel">
          
          {/* Customizer Headers */}
          <div className="px-6 py-5 border-b border-slate-800/60 bg-[#0e111a]" id="customizer-panel-header">
            <h2 className="text-sm font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-2">
              <Paintbrush className="w-4 h-4 text-fuchsia-400" /> Page Settings
            </h2>
          </div>

          <div className="p-6 space-y-4" id="customizer-accordion">
            
            {/* Tab 1: General Styling */}
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-[#0e111a]/50">
              <button 
                onClick={() => setActiveTab(activeTab === "general" ? "cli" : "general")}
                className="w-full px-5 py-4 bg-[#0e111a] flex items-center justify-between text-left text-sm font-semibold text-white hover:bg-slate-800/30 transition-colors"
                id="tab-general-toggle"
              >
                <span className="flex items-center gap-2.5">
                  <User className="w-4 h-4 text-fuchsia-400" />
                  General & Visual Styles
                </span>
                {activeTab === "general" ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>

              {activeTab === "general" && (
                <div className="p-5 space-y-4 border-t border-slate-800 text-xs text-slate-300" id="tab-general-content">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-400">Gumroad Username</label>
                    <input 
                      type="text" 
                      value={config.username}
                      onChange={(e) => updateConfigField("username", e.target.value)}
                      className="w-full bg-[#151922] border border-slate-800 rounded-lg px-3 py-2.5 focus:border-fuchsia-500 outline-none text-slate-200 transition-colors"
                      placeholder="e.g. sujitwave2"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-400">Full Profile Name</label>
                    <input 
                      type="text" 
                      value={config.fullName}
                      onChange={(e) => updateConfigField("fullName", e.target.value)}
                      className="w-full bg-[#151922] border border-slate-800 rounded-lg px-3 py-2.5 focus:border-fuchsia-500 outline-none text-slate-200 transition-colors"
                      placeholder="Sujit Chaudhary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-400">Profile Tagline</label>
                    <input 
                      type="text" 
                      value={config.tagline}
                      onChange={(e) => updateConfigField("tagline", e.target.value)}
                      className="w-full bg-[#151922] border border-slate-800 rounded-lg px-3 py-2.5 focus:border-fuchsia-500 outline-none text-slate-200 transition-colors"
                      placeholder="Software Engineer & Indie Creator"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-400">Creator Bio</label>
                    <textarea 
                      rows={3}
                      value={config.bio}
                      onChange={(e) => updateConfigField("bio", e.target.value)}
                      className="w-full bg-[#151922] border border-slate-800 rounded-lg px-3 py-2.5 focus:border-fuchsia-500 outline-none text-slate-200 transition-colors resize-none leading-relaxed"
                      placeholder="Tell your visitors what you build..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-400">Avatar / Profile Picture URL</label>
                    <input 
                      type="text" 
                      value={config.avatarUrl}
                      onChange={(e) => updateConfigField("avatarUrl", e.target.value)}
                      className="w-full bg-[#151922] border border-slate-800 rounded-lg px-3 py-2.5 focus:border-fuchsia-500 outline-none text-slate-200 transition-colors"
                      placeholder="https://images.unsplash.com/..."
                    />
                  </div>

                  {/* Color Picker & presets */}
                  <div className="space-y-2 pt-1">
                    <label className="font-semibold text-slate-400 block">Accent Custom Color</label>
                    <div className="flex gap-2">
                      <input 
                        type="color" 
                        value={config.accentColor}
                        onChange={(e) => updateConfigField("accentColor", e.target.value)}
                        className="w-10 h-10 bg-[#151922] border border-slate-800 rounded-lg cursor-pointer p-1"
                      />
                      <input 
                        type="text" 
                        value={config.accentColor}
                        onChange={(e) => updateConfigField("accentColor", e.target.value)}
                        className="flex-grow bg-[#151922] border border-slate-800 rounded-lg px-3 py-2 focus:border-fuchsia-500 outline-none font-mono text-slate-200"
                        placeholder="#ff90e8"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 pt-1.5">
                      {colorPresets.map(preset => (
                        <button
                          key={preset.value}
                          onClick={() => updateConfigField("accentColor", preset.value)}
                          className="px-2 py-1.5 rounded border border-slate-800 bg-[#151922] hover:bg-[#1f2634] text-left flex items-center gap-1.5 transition-all text-[10px]"
                        >
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: preset.value }}></span>
                          <span className="truncate text-slate-400">{preset.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Tab 2: Products Manager */}
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-[#0e111a]/50">
              <button 
                onClick={() => setActiveTab(activeTab === "products" ? "cli" : "products")}
                className="w-full px-5 py-4 bg-[#0e111a] flex items-center justify-between text-left text-sm font-semibold text-white hover:bg-slate-800/30 transition-colors"
                id="tab-products-toggle"
              >
                <span className="flex items-center gap-2.5">
                  <Star className="w-4 h-4 text-fuchsia-400" />
                  Product Inventory ({config.products.length})
                </span>
                {activeTab === "products" ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>

              {activeTab === "products" && (
                <div className="p-5 space-y-6 border-t border-slate-800" id="tab-products-content">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Showcase List</span>
                    <button 
                      onClick={addProduct}
                      className="px-2.5 py-1.5 bg-fuchsia-950/60 border border-fuchsia-800 text-fuchsia-400 hover:bg-fuchsia-900/40 text-[11px] font-bold rounded-lg flex items-center gap-1 transition-all active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Product
                    </button>
                  </div>

                  <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
                    {config.products.length === 0 ? (
                      <div className="text-center py-8 border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs">
                        No products configured yet. Link your custom products here.
                      </div>
                    ) : (
                      config.products.map((p, idx) => (
                        <div key={p.id} className="p-4 bg-[#141822] border border-slate-800 rounded-xl space-y-3 relative group">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                            <span className="text-xs font-bold text-white flex items-center gap-1.5">
                              <span className="w-4 h-4 rounded bg-slate-800 text-slate-400 inline-flex items-center justify-center text-[10px]">
                                {idx + 1}
                              </span>
                              {p.name || "Untitled Product"}
                            </span>
                            <button 
                              onClick={() => deleteProduct(p.id)}
                              className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-slate-800/50 transition-colors"
                              title="Delete Product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="space-y-1">
                              <label className="text-[10px] text-slate-400 font-semibold">Title</label>
                              <input 
                                type="text"
                                value={p.name}
                                onChange={(e) => updateProduct(p.id, "name", e.target.value)}
                                className="w-full bg-[#1a202c] border border-slate-800 rounded px-2.5 py-1.5 outline-none text-slate-300 focus:border-fuchsia-500 text-[11px]"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] text-slate-400 font-semibold">Price Badge</label>
                              <input 
                                type="text"
                                value={p.price}
                                onChange={(e) => updateProduct(p.id, "price", e.target.value)}
                                className="w-full bg-[#1a202c] border border-slate-800 rounded px-2.5 py-1.5 outline-none text-slate-300 focus:border-fuchsia-500 text-[11px]"
                                placeholder="$29"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="space-y-1">
                              <label className="text-[10px] text-slate-400 font-semibold">Category</label>
                              <input 
                                type="text"
                                value={p.category}
                                onChange={(e) => updateProduct(p.id, "category", e.target.value)}
                                className="w-full bg-[#1a202c] border border-slate-800 rounded px-2.5 py-1.5 outline-none text-slate-300 focus:border-fuchsia-500 text-[11px]"
                                placeholder="Design System"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] text-slate-400 font-semibold">Highlight Tag</label>
                              <input 
                                type="text"
                                value={p.tag || ""}
                                onChange={(e) => updateProduct(p.id, "tag", e.target.value)}
                                className="w-full bg-[#1a202c] border border-slate-800 rounded px-2.5 py-1.5 outline-none text-slate-300 focus:border-fuchsia-500 text-[11px]"
                                placeholder="Best Seller"
                              />
                            </div>
                          </div>

                          <div className="space-y-1 text-xs">
                            <label className="text-[10px] text-slate-400 font-semibold">Description</label>
                            <textarea 
                              rows={2}
                              value={p.description}
                              onChange={(e) => updateProduct(p.id, "description", e.target.value)}
                              className="w-full bg-[#1a202c] border border-slate-800 rounded px-2.5 py-1.5 outline-none text-slate-300 focus:border-fuchsia-500 resize-none text-[11px]"
                            />
                          </div>

                          <div className="space-y-1 text-xs">
                            <label className="text-[10px] text-slate-400 font-semibold">Gumroad Product URL (Replaces checkout overlay)</label>
                            <input 
                              type="text"
                              value={p.url}
                              onChange={(e) => updateProduct(p.id, "url", e.target.value)}
                              className="w-full bg-[#1a202c] border border-slate-800 rounded px-2.5 py-1.5 outline-none text-slate-300 focus:border-fuchsia-500 text-[11px]"
                              placeholder="https://sujitwave2.gumroad.com/l/..."
                            />
                          </div>

                          <div className="space-y-1 text-xs">
                            <label className="text-[10px] text-slate-400 font-semibold">Mock Image URL</label>
                            <input 
                              type="text"
                              value={p.image}
                              onChange={(e) => updateProduct(p.id, "image", e.target.value)}
                              className="w-full bg-[#1a202c] border border-slate-800 rounded px-2.5 py-1.5 outline-none text-slate-300 focus:border-fuchsia-500 text-[11px]"
                              placeholder="https://images.unsplash.com/..."
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="space-y-1">
                              <label className="text-[10px] text-slate-400 font-semibold">Avg Rating (1.0 - 5.0)</label>
                              <input 
                                type="number"
                                step="0.1"
                                min="1"
                                max="5"
                                value={p.rating}
                                onChange={(e) => updateProduct(p.id, "rating", parseFloat(e.target.value) || 5.0)}
                                className="w-full bg-[#1a202c] border border-slate-800 rounded px-2.5 py-1.5 outline-none text-slate-300 focus:border-fuchsia-500 text-[11px]"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] text-slate-400 font-semibold">Review Count</label>
                              <input 
                                type="number"
                                min="0"
                                value={p.reviews}
                                onChange={(e) => updateProduct(p.id, "reviews", parseInt(e.target.value) || 0)}
                                className="w-full bg-[#1a202c] border border-slate-800 rounded px-2.5 py-1.5 outline-none text-slate-300 focus:border-fuchsia-500 text-[11px]"
                              />
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Tab 3: Social Connections */}
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-[#0e111a]/50">
              <button 
                onClick={() => setActiveTab(activeTab === "socials" ? "cli" : "socials")}
                className="w-full px-5 py-4 bg-[#0e111a] flex items-center justify-between text-left text-sm font-semibold text-white hover:bg-slate-800/30 transition-colors"
                id="tab-socials-toggle"
              >
                <span className="flex items-center gap-2.5">
                  <Globe className="w-4 h-4 text-fuchsia-400" />
                  Social Networks
                </span>
                {activeTab === "socials" ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>

              {activeTab === "socials" && (
                <div className="p-5 space-y-4 border-t border-slate-800 text-xs text-slate-300" id="tab-socials-content">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-400 flex items-center gap-1.5">
                      <Twitter className="w-3.5 h-3.5 text-blue-400" /> Twitter / X Profile Link
                    </label>
                    <input 
                      type="text" 
                      value={config.socials.twitter || ""}
                      onChange={(e) => updateNestedField("socials", "twitter", e.target.value)}
                      className="w-full bg-[#151922] border border-slate-800 rounded-lg px-3 py-2.5 focus:border-fuchsia-500 outline-none text-slate-200 transition-colors"
                      placeholder="https://twitter.com/sujitwave2"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-400 flex items-center gap-1.5">
                      <Github className="w-3.5 h-3.5 text-white" /> GitHub Profile Link
                    </label>
                    <input 
                      type="text" 
                      value={config.socials.github || ""}
                      onChange={(e) => updateNestedField("socials", "github", e.target.value)}
                      className="w-full bg-[#151922] border border-slate-800 rounded-lg px-3 py-2.5 focus:border-fuchsia-500 outline-none text-slate-200 transition-colors"
                      placeholder="https://github.com/sujitchaudhary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-400 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-emerald-400" /> Personal Website URL
                    </label>
                    <input 
                      type="text" 
                      value={config.socials.website || ""}
                      onChange={(e) => updateNestedField("socials", "website", e.target.value)}
                      className="w-full bg-[#151922] border border-slate-800 rounded-lg px-3 py-2.5 focus:border-fuchsia-500 outline-none text-slate-200 transition-colors"
                      placeholder="https://sujitchaudhary.tech"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Tab 4: Newsletter follow form */}
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-[#0e111a]/50">
              <button 
                onClick={() => setActiveTab(activeTab === "newsletter" ? "cli" : "newsletter")}
                className="w-full px-5 py-4 bg-[#0e111a] flex items-center justify-between text-left text-sm font-semibold text-white hover:bg-slate-800/30 transition-colors"
                id="tab-newsletter-toggle"
              >
                <span className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-fuchsia-400" />
                  Newsletter / Gumroad Follow Form
                </span>
                {activeTab === "newsletter" ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>

              {activeTab === "newsletter" && (
                <div className="p-5 space-y-4 border-t border-slate-800 text-xs text-slate-300" id="tab-newsletter-content">
                  <div className="flex items-center justify-between bg-[#151922] border border-slate-800 p-3 rounded-lg">
                    <div>
                      <h4 className="font-bold text-white">Enable Follow Form</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Adds Gumroad's native follow logic</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={config.emailSignup.enabled}
                        onChange={(e) => updateNestedField("emailSignup", "enabled", e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:border-slate-300 after:border after:rounded-full after:h-4 after:width-4 after:w-4 after:transition-all peer-checked:bg-fuchsia-500"></div>
                    </label>
                  </div>

                  {config.emailSignup.enabled && (
                    <>
                      <div className="space-y-1.5">
                        <label className="font-semibold text-slate-400">Newsletter Headline</label>
                        <input 
                          type="text" 
                          value={config.emailSignup.title}
                          onChange={(e) => updateNestedField("emailSignup", "title", e.target.value)}
                          className="w-full bg-[#151922] border border-slate-800 rounded-lg px-3 py-2.5 focus:border-fuchsia-500 outline-none text-slate-200 transition-colors"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-semibold text-slate-400">Newsletter Description</label>
                        <textarea 
                          rows={2}
                          value={config.emailSignup.description}
                          onChange={(e) => updateNestedField("emailSignup", "description", e.target.value)}
                          className="w-full bg-[#151922] border border-slate-800 rounded-lg px-3 py-2.5 focus:border-fuchsia-500 outline-none text-slate-200 transition-colors resize-none leading-relaxed"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-semibold text-slate-400">Button CTA Text</label>
                        <input 
                          type="text" 
                          value={config.emailSignup.buttonText}
                          onChange={(e) => updateNestedField("emailSignup", "buttonText", e.target.value)}
                          className="w-full bg-[#151922] border border-slate-800 rounded-lg px-3 py-2.5 focus:border-fuchsia-500 outline-none text-slate-200 transition-colors"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-semibold text-slate-400">Success message (<span className="font-mono">data-gumroad-follow-message</span>)</label>
                        <input 
                          type="text" 
                          value={config.emailSignup.successMessage}
                          onChange={(e) => updateNestedField("emailSignup", "successMessage", e.target.value)}
                          className="w-full bg-[#151922] border border-slate-800 rounded-lg px-3 py-2.5 focus:border-fuchsia-500 outline-none text-slate-200 transition-colors"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Tab 5: GitHub Pages & Repository Publishing */}
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-[#0e111a]/50">
              <button 
                onClick={() => setActiveTab(activeTab === "github" ? "cli" : "github")}
                className="w-full px-5 py-4 bg-[#0e111a] flex items-center justify-between text-left text-sm font-semibold text-white hover:bg-slate-800/30 transition-colors"
                id="tab-github-toggle"
              >
                <span className="flex items-center gap-2.5">
                  <Github className="w-4 h-4 text-fuchsia-400" />
                  GitHub Repository Settings
                </span>
                {activeTab === "github" ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>

              {activeTab === "github" && (
                <div className="p-5 space-y-4 border-t border-slate-800 text-xs text-slate-300" id="tab-github-content">
                  <div className="flex items-center justify-between bg-[#151922] border border-slate-800 p-3 rounded-lg">
                    <div>
                      <h4 className="font-bold text-white">Enable Auto Backup</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Uploads config and compiled profile code</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={config.github?.enabled ?? true}
                        onChange={(e) => updateNestedField("github", "enabled", e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:border-slate-300 after:border after:rounded-full after:h-4 after:width-4 after:w-4 after:transition-all peer-checked:bg-fuchsia-500"></div>
                    </label>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-400 flex items-center gap-1.5">
                      Target Repository (owner/repo)
                    </label>
                    <input 
                      type="text" 
                      value={config.github?.repository || ""}
                      onChange={(e) => updateNestedField("github", "repository", e.target.value)}
                      className="w-full bg-[#151922] border border-slate-800 rounded-lg px-3 py-2.5 focus:border-fuchsia-500 outline-none text-slate-200 transition-colors"
                      placeholder="e.g. sujitwave2/gumroad-profile"
                    />
                    <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5">
                      Create a public or private repository on GitHub first, then enter its name here.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-400">Target Branch</label>
                    <input 
                      type="text" 
                      value={config.github?.branch || "main"}
                      onChange={(e) => updateNestedField("github", "branch", e.target.value)}
                      className="w-full bg-[#151922] border border-slate-800 rounded-lg px-3 py-2.5 focus:border-fuchsia-500 outline-none text-slate-200 transition-colors"
                      placeholder="main"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-400 flex items-center gap-1.5">
                      Personal Access Token (PAT)
                    </label>
                    <input 
                      type="password" 
                      value={config.github?.token || ""}
                      onChange={(e) => updateNestedField("github", "token", e.target.value)}
                      className="w-full bg-[#151922] border border-slate-800 rounded-lg px-3 py-2.5 focus:border-fuchsia-500 outline-none text-slate-200 transition-colors font-mono"
                      placeholder="ghp_************************************"
                    />
                    <div className="bg-[#121620] border border-slate-800/80 p-2.5 rounded-lg text-[10px] text-slate-400 leading-relaxed space-y-1 mt-1">
                      <p className="font-semibold text-slate-300">How to create a Personal Access Token:</p>
                      <ol className="list-decimal pl-4 space-y-0.5">
                        <li>Go to <span className="text-fuchsia-400 font-medium">GitHub Settings</span> &rarr; Developer Settings</li>
                        <li>Click <span className="font-medium">Personal Access Tokens</span> &rarr; Fine-grained Tokens (or Classic)</li>
                        <li>Generate a token with <span className="text-slate-200 font-mono">Contents: Read/Write</span> scope for this repository</li>
                        <li>Copy and paste the token here</li>
                      </ol>
                    </div>
                  </div>

                  {githubPushSuccess !== null && (
                    <div className={`p-3 rounded-lg flex items-start gap-2 border text-[11px] ${
                      githubPushSuccess 
                        ? "bg-emerald-950/40 border-emerald-800/60 text-emerald-300" 
                        : "bg-rose-950/40 border-rose-800/60 text-rose-300"
                    }`}>
                      {githubPushSuccess ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-emerald-200">Push Succeeded!</p>
                            <p className="mt-0.5">Files uploaded to GitHub successfully. If Pages is enabled, view your site at:</p>
                            {githubPagesUrl && (
                              <a 
                                href={githubPagesUrl} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-fuchsia-400 hover:underline font-semibold mt-1 flex items-center gap-1 inline-flex"
                              >
                                {githubPagesUrl} <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-rose-200">Push Failed</p>
                            <p className="mt-0.5">Verify repository name, token scopes, and internet connectivity, then try again.</p>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  <button
                    onClick={triggerGithubPush}
                    disabled={isGithubPushing || !config.github?.repository || !config.github?.token}
                    className="w-full py-2.5 bg-fuchsia-600 hover:bg-fuchsia-500 disabled:bg-[#151922] disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 text-xs shadow-md shadow-fuchsia-950/30 active:scale-[0.98]"
                  >
                    {isGithubPushing ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Pushing to GitHub...
                      </>
                    ) : (
                      <>
                        <Github className="w-3.5 h-3.5" />
                        Push Profile to GitHub Pages
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
            
          </div>
        </div>

        {/* Right Side: Device Simulator & Live Code Preview */}
        <div className="flex-grow bg-[#05070c] flex flex-col min-h-0 relative" id="right-workspace-panel">
          
          {/* Simulator Controls Toolbar */}
          <div className="bg-[#0b0e14] border-b border-slate-800 px-6 py-3 flex items-center justify-between" id="simulator-toolbar">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPreviewMode("visual")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  previewMode === "visual" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Live Preview
              </button>
              <button
                onClick={() => setPreviewMode("code")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  previewMode === "code" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                HTML Code
              </button>
            </div>

            <div className="flex items-center gap-3">
              {/* Responsive Size Toggle */}
              {previewMode === "visual" && (
                <div className="flex items-center border border-slate-800 bg-[#151922] p-0.5 rounded-lg">
                  <button
                    onClick={() => setPreviewDevice("desktop")}
                    className={`p-1.5 rounded-md transition-all ${
                      previewDevice === "desktop" ? "bg-slate-800 text-fuchsia-400" : "text-slate-500 hover:text-slate-300"
                    }`}
                    title="Desktop Preview (100%)"
                  >
                    <Laptop className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPreviewDevice("mobile")}
                    className={`p-1.5 rounded-md transition-all ${
                      previewDevice === "mobile" ? "bg-slate-800 text-fuchsia-400" : "text-slate-500 hover:text-slate-300"
                    }`}
                    title="Mobile Preview (375px)"
                  >
                    <Smartphone className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Preview Theme Switcher */}
              {previewMode === "visual" && (
                <div className="flex items-center border border-slate-800 bg-[#151922] p-0.5 rounded-lg">
                  <button
                    onClick={() => setPreviewTheme("light")}
                    className={`p-1.5 rounded-md transition-all ${
                      previewTheme === "light" ? "bg-slate-800 text-amber-500" : "text-slate-500 hover:text-slate-300"
                    }`}
                    title="Simulate Light Theme"
                  >
                    <Sun className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPreviewTheme("dark")}
                    className={`p-1.5 rounded-md transition-all ${
                      previewTheme === "dark" ? "bg-slate-800 text-violet-400" : "text-slate-500 hover:text-slate-300"
                    }`}
                    title="Simulate Dark Theme"
                  >
                    <Moon className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Export Utilities */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={copyHtmlCode}
                  className="p-2 text-slate-400 hover:text-white border border-slate-800 bg-[#151922] rounded-lg transition-colors hover:border-slate-700"
                  title="Copy Compiled HTML to clipboard"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={downloadHtmlFile}
                  className="p-2 text-slate-400 hover:text-white border border-slate-800 bg-[#151922] rounded-lg transition-colors hover:border-slate-700"
                  title="Download profile.html file"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Simulator Canvas Sandbox */}
          <div className="flex-grow flex items-center justify-center p-6 bg-[#04060b] overflow-y-auto" id="simulator-canvas">
            {previewMode === "visual" ? (
              <div 
                className={`h-full border border-slate-800 bg-[#090d16] rounded-xl overflow-hidden shadow-2xl transition-all duration-300 flex flex-col ${
                  previewDevice === "mobile" ? "w-[375px]" : "w-full"
                }`}
                id="simulator-device-box"
              >
                {/* Simulated URL Bar */}
                <div className="bg-[#0e111a] border-b border-slate-800 px-4 py-2 flex items-center justify-between gap-3 shrink-0 select-none">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-800"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-800"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-800"></span>
                  </div>
                  <div className="bg-[#151922] border border-slate-800 text-[10px] text-slate-400 px-3 py-1 rounded-md flex-grow max-w-sm text-center truncate font-mono select-none">
                    https://gumroad.com/{config.username}
                  </div>
                  <div className="w-4"></div>
                </div>

                {/* Simulated IFrame */}
                <div className="flex-grow relative bg-[#090d16]" id="iframe-viewport-container">
                  <iframe
                    srcDoc={getCompiledDoc()}
                    className="w-full h-full border-none bg-transparent"
                    title="Gumroad Profile Sandbox"
                    sandbox="allow-scripts allow-popups"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
            ) : (
              // Source HTML View
              <div className="w-full h-full border border-slate-800 rounded-xl overflow-hidden bg-[#0a0d16] flex flex-col font-mono text-xs shadow-2xl">
                <div className="bg-[#0e111a] border-b border-slate-800 px-4 py-2 flex items-center justify-between text-slate-400 font-sans font-semibold shrink-0 select-none">
                  <span>profile.html (Live Compilation)</span>
                  <button 
                    onClick={copyHtmlCode}
                    className="text-xs hover:text-white flex items-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy Code
                  </button>
                </div>
                <pre className="flex-grow p-6 overflow-auto text-slate-300 leading-relaxed bg-[#07090f] select-text select-all">
                  <code>{getCompiledDoc()}</code>
                </pre>
              </div>
            )}
          </div>

          {/* Interactive CLI Drawer (Collapsible) */}
          <div className="bg-[#0b0e14] border-t border-slate-800 flex flex-col shadow-2xl relative" id="cli-console-drawer">
            <button
              onClick={() => setShowCli(!showCli)}
              className="px-6 py-3 border-b border-slate-800 flex items-center justify-between hover:bg-slate-800/20 text-xs font-semibold text-slate-400 select-none"
              id="cli-console-drawer-header"
            >
              <span className="flex items-center gap-2">
                <TerminalIcon className="w-4 h-4 text-fuchsia-400" />
                Gumroad pages CLI terminal simulator
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded uppercase font-bold tracking-wide">Ready</span>
                {showCli ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </div>
            </button>

            {showCli && (
              <div className="flex flex-col md:flex-row h-64 border-b border-slate-800" id="cli-console-content">
                {/* Terminal Quick Actions */}
                <div className="w-full md:w-56 border-b md:border-b-0 md:border-r border-slate-800 p-4 bg-[#0e111a]/40 shrink-0 flex flex-col justify-between" id="cli-quick-actions">
                  <div className="space-y-2">
                    <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold block mb-1">Interactive Triggers</span>
                    <button
                      onClick={() => runSimulatedCli("gumroad pages preview")}
                      disabled={isCliLoading}
                      className="w-full px-3 py-2 bg-[#151922] border border-slate-800 hover:border-slate-700 text-slate-300 text-[11px] font-bold rounded-lg text-left hover:text-white transition-all flex items-center justify-between group active:scale-[0.98]"
                    >
                      <span>Preview Page</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-fuchsia-400 group-hover:translate-x-0.5 transition-all" />
                    </button>
                    <button
                      onClick={() => runSimulatedCli("gumroad pages push profile")}
                      disabled={isCliLoading}
                      className="w-full px-3 py-2 bg-fuchsia-950/30 border border-fuchsia-900/50 hover:border-fuchsia-800 text-fuchsia-300 text-[11px] font-bold rounded-lg text-left hover:text-fuchsia-200 transition-all flex items-center justify-between group active:scale-[0.98]"
                    >
                      <span>Publish Profile</span>
                      <ArrowRight className="w-3.5 h-3.5 text-fuchsia-600 group-hover:text-fuchsia-400 group-hover:translate-x-0.5 transition-all" />
                    </button>
                    <button
                      onClick={() => runSimulatedCli("gumroad pages push github")}
                      disabled={isCliLoading}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-[11px] font-bold rounded-lg text-left hover:text-white transition-all flex items-center justify-between group active:scale-[0.98]"
                    >
                      <span className="flex items-center gap-1.5">
                        <Github className="w-3.5 h-3.5 text-slate-400" /> Push to GitHub
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-fuchsia-400 group-hover:translate-x-0.5 transition-all" />
                    </button>
                  </div>

                  <div className="text-[10px] text-slate-500 leading-relaxed border-t border-slate-850 pt-2 block md:flex md:flex-col" id="cli-hints">
                    <p className="font-semibold text-slate-400 mb-0.5">CLI Terminal Tips:</p>
                    <p>Both <code className="font-mono text-slate-400">preview</code> and <code className="font-mono text-slate-400">push</code> are fully integrated. Running <code className="font-mono text-slate-400">gumroad pages push github</code> compiles and commits the code directly to your GitHub repository.</p>
                  </div>
                </div>

                {/* Terminal logs area */}
                <div className="flex-grow flex flex-col bg-[#05070c] p-4 font-mono text-[11px] text-slate-300 overflow-y-auto" id="cli-terminal-logs">
                  <div className="flex-grow space-y-1">
                    {cliLogs.map((log, idx) => {
                      let colorClass = "text-slate-300";
                      if (log.startsWith(">")) colorClass = "text-fuchsia-400 font-bold";
                      else if (log.includes("SUCCESS") || log.includes("succeeded") || log.includes("success")) colorClass = "text-emerald-400 font-semibold";
                      else if (log.includes("Error") || log.includes("Error:")) colorClass = "text-rose-400 font-semibold";
                      else if (log.includes("⚡") || log.includes("📦")) colorClass = "text-cyan-400 font-semibold";
                      else if (log.startsWith("[")) colorClass = "text-slate-500";

                      return (
                        <div key={idx} className={`${colorClass} leading-relaxed whitespace-pre-wrap`}>
                          {log}
                        </div>
                      );
                    })}
                    {isCliLoading && (
                      <div className="text-slate-500 flex items-center gap-1.5 pt-0.5 font-bold">
                        <RefreshCw className="w-3 h-3 animate-spin text-fuchsia-500" /> CLI executing...
                      </div>
                    )}
                    <div ref={terminalBottomRef} />
                  </div>

                  {/* Terminal CLI Input Box */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      runSimulatedCli(cliCommand);
                    }}
                    className="flex items-center gap-2 border-t border-slate-850 pt-3 mt-2 shrink-0"
                    id="cli-input-form"
                  >
                    <span className="text-fuchsia-500 font-black tracking-widest">$</span>
                    <input
                      type="text"
                      value={cliCommand}
                      onChange={(e) => setCliCommand(e.target.value)}
                      placeholder="Type a command (e.g. gumroad pages push profile)"
                      className="flex-grow bg-transparent border-none outline-none text-slate-200 font-mono text-[11px]"
                      disabled={isCliLoading}
                    />
                    <button
                      type="submit"
                      disabled={isCliLoading || !cliCommand.trim()}
                      className="text-slate-500 hover:text-white disabled:opacity-40"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
