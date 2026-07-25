export interface Socials {
  twitter?: string;
  github?: string;
  website?: string;
}

export interface EmailSignup {
  enabled: boolean;
  title: string;
  description: string;
  buttonText: string;
  successMessage: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  rating: number;
  reviews: number;
  tag?: string;
  url: string;
  image: string;
  category: string;
}

export interface GitHubConfig {
  repository: string;
  branch: string;
  token: string;
  enabled: boolean;
}

export interface GumroadConfig {
  username: string;
  fullName: string;
  tagline: string;
  bio: string;
  avatarUrl: string;
  accentColor: string;
  socials: Socials;
  theme: 'dark' | 'light' | 'system';
  emailSignup: EmailSignup;
  products: Product[];
  github?: GitHubConfig;
}

export function compileProfileHtml(config: GumroadConfig): string {
  const accentColor = config.accentColor || '#ff90e8';
  
  // Generate products HTML
  const productsHtml = config.products.map(p => {
    // Generate star rating SVG
    const fullStars = Math.floor(p.rating);
    const hasHalfStar = p.rating % 1 !== 0;
    let starsHtml = '';
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        starsHtml += `<svg class="star-icon filled" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>`;
      } else if (i === fullStars && hasHalfStar) {
        starsHtml += `<svg class="star-icon half-filled" viewBox="0 0 24 24">
          <defs>
            <linearGradient id="half-${p.id}">
              <stop offset="50%" stop-color="currentColor"/>
              <stop offset="50%" stop-color="var(--gray-300)" stop-opacity="0.3"/>
            </linearGradient>
          </defs>
          <path fill="url(#half-${p.id})" d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
        </svg>`;
      } else {
        starsHtml += `<svg class="star-icon empty" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>`;
      }
    }

    const tagHtml = p.tag ? `<span class="product-tag">${p.tag}</span>` : '';

    return `
    <div class="product-card" id="product-${p.id}">
      <div class="product-image-container">
        <img class="product-image" src="${p.image}" alt="${p.name}" loading="lazy" referrerPolicy="no-referrer">
        ${tagHtml}
        <span class="product-category">${p.category}</span>
      </div>
      <div class="product-content">
        <div class="product-header">
          <h3 class="product-title">${p.name}</h3>
          <span class="product-price">${p.price}</span>
        </div>
        <p class="product-description">${p.description}</p>
        <div class="product-footer">
          <div class="product-rating">
            <div class="stars-container">${starsHtml}</div>
            <span class="rating-text">${p.rating} (${p.reviews})</span>
          </div>
          <a class="view-product-btn" href="${p.url}" target="_blank" rel="noopener noreferrer">
            View Product
            <svg class="btn-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </a>
        </div>
      </div>
    </div>
    `;
  }).join('\n');

  // Social Links HTML
  let socialsHtml = '';
  if (config.socials.twitter) {
    socialsHtml += `
    <a href="${config.socials.twitter}" class="social-link" aria-label="Twitter / X" target="_blank" rel="noopener noreferrer">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="social-icon"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
    </a>`;
  }
  if (config.socials.github) {
    socialsHtml += `
    <a href="${config.socials.github}" class="social-link" aria-label="GitHub" target="_blank" rel="noopener noreferrer">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="social-icon"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
    </a>`;
  }
  if (config.socials.website) {
    socialsHtml += `
    <a href="${config.socials.website}" class="social-link" aria-label="Website" target="_blank" rel="noopener noreferrer">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="social-icon"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
    </a>`;
  }

  // Newsletter Section HTML
  const newsletterHtml = config.emailSignup.enabled ? `
  <section class="newsletter-section" id="newsletter">
    <div class="newsletter-container">
      <div class="newsletter-header">
        <div class="newsletter-badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="badge-icon"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          Newsletter
        </div>
        <h2 class="newsletter-title">${config.emailSignup.title}</h2>
        <p class="newsletter-description">${config.emailSignup.description}</p>
      </div>
      
      <form data-gumroad-follow action="https://app.gumroad.com/follow/${config.username}" method="POST" class="newsletter-form" id="follow-form">
        <input type="hidden" name="seller_id" value="${config.username}">
        <div class="input-group">
          <input type="email" name="email" placeholder="Enter your email address" required class="newsletter-input" aria-label="Email Address">
          <button type="submit" class="newsletter-submit-btn">
            <span>${config.emailSignup.buttonText}</span>
            <svg class="submit-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
        </div>
        <p data-gumroad-follow-message class="follow-message success-message hidden" id="follow-message">${config.emailSignup.successMessage}</p>
      </form>
    </div>
  </section>
  ` : '';

  // Theme configuration scripting
  const themeScript = `
    const themeToggleBtn = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;

    function setTheme(theme) {
      if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        htmlElement.classList.add('dark');
        themeToggleBtn.innerHTML = \`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="theme-icon"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>\`;
        localStorage.setItem('gumroad-theme', 'dark');
      } else {
        htmlElement.classList.remove('dark');
        themeToggleBtn.innerHTML = \`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="theme-icon"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>\`;
        localStorage.setItem('gumroad-theme', 'light');
      }
    }

    // Initialize Theme
    const savedTheme = localStorage.getItem('gumroad-theme') || '${config.theme}';
    setTheme(savedTheme);

    themeToggleBtn.addEventListener('click', () => {
      const isDark = htmlElement.classList.contains('dark');
      setTheme(isDark ? 'light' : 'dark');
    });

    // Intercept form submission to show the data-gumroad-follow-message smoothly
    const form = document.getElementById('follow-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        // Since Gumroad standard mechanism handles follow submission, we can show the message
        // smoothly upon form submission.
        const messageEl = document.getElementById('follow-message');
        if (messageEl) {
          messageEl.classList.remove('hidden');
          messageEl.classList.add('visible');
          
          // Smooth scroll to message
          messageEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });
    }
  `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${config.fullName} - Gumroad Profile</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,600;0,700;0,800;1,600&display=swap" rel="stylesheet">
  
  <style>
    /* Global Reset & Base Variables */
    :root {
      --font-display: 'Playfair Display', Georgia, serif;
      --font-body: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      
      /* Light Mode Colors (Cool Slate Neutrals with Premium Contrast) */
      --color-bg: #f8fafc;
      --color-surface: #ffffff;
      --color-text: #0f172a;
      --color-text-muted: #64748b;
      --color-border: #e2e8f0;
      --color-gray-100: #f1f5f9;
      --color-gray-200: #e2e8f0;
      --color-accent: ${accentColor};
      --color-accent-hover: #e06ec7;
      --color-card-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.05);
      --color-star: #fbbf24;
    }

    html.dark {
      /* Dark Mode Colors (Deep Obsidian Cool Tones) */
      --color-bg: #090d16;
      --color-surface: #111827;
      --color-text: #f9fafb;
      --color-text-muted: #9ca3af;
      --color-border: #1f2937;
      --color-gray-100: #1f2937;
      --color-gray-200: #374151;
      --color-card-shadow: 0 4px 24px -4px rgba(0, 0, 0, 0.4);
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: var(--color-bg);
      color: var(--color-text);
      font-family: var(--font-body);
      line-height: 1.6;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      transition: background-color 0.3s ease, color 0.3s ease;
    }

    /* Scrollbar Styling */
    ::-webkit-scrollbar {
      width: 10px;
    }
    ::-webkit-scrollbar-track {
      background: var(--color-bg);
    }
    ::-webkit-scrollbar-thumb {
      background: var(--color-border);
      border-radius: 5px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: var(--color-text-muted);
    }

    /* Container Utility */
    .container {
      width: 100%;
      max-width: 1100px;
      margin: 0 auto;
      padding: 0 24px;
    }

    /* Header Nav */
    .header-nav {
      padding: 24px 0;
      display: flex;
      justify-content: flex-end;
      align-items: center;
    }

    .theme-toggle-btn {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      color: var(--color-text);
      cursor: pointer;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: var(--color-card-shadow);
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .theme-toggle-btn:hover {
      transform: scale(1.05);
      border-color: var(--color-text);
    }

    .theme-icon {
      width: 20px;
      height: 20px;
    }

    /* Hero Section */
    .hero-section {
      text-align: center;
      padding: 40px 0 64px;
    }

    .hero-avatar-wrapper {
      position: relative;
      width: 120px;
      height: 120px;
      margin: 0 auto 24px;
    }

    .hero-avatar {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 50%;
      border: 3px solid var(--color-accent);
      padding: 4px;
      background-color: var(--color-bg);
      box-shadow: var(--color-card-shadow);
    }

    .hero-title-group {
      margin-bottom: 24px;
    }

    .hero-title {
      font-family: var(--font-display);
      font-size: 3rem;
      font-weight: 800;
      line-height: 1.15;
      margin-bottom: 8px;
      letter-spacing: -0.03em;
    }

    .hero-tagline {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--color-text-muted);
      letter-spacing: -0.01em;
    }

    .hero-bio {
      max-width: 680px;
      margin: 0 auto 32px;
      font-size: 1.125rem;
      color: var(--color-text-muted);
      line-height: 1.7;
    }

    .socials-row {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 16px;
    }

    .social-link {
      color: var(--color-text-muted);
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      width: 44px;
      height: 44px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: var(--color-card-shadow);
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      text-decoration: none;
    }

    .social-link:hover {
      color: var(--color-text);
      border-color: var(--color-text);
      transform: translateY(-2px);
    }

    .social-icon {
      width: 20px;
      height: 20px;
    }

    /* Section Headers */
    .section-title {
      font-family: var(--font-display);
      font-size: 2rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      margin-bottom: 32px;
      position: relative;
      display: inline-block;
    }

    .section-title::after {
      content: '';
      position: absolute;
      left: 0;
      bottom: -6px;
      width: 40px;
      height: 3px;
      background-color: var(--color-accent);
      border-radius: 2px;
    }

    /* Products Section */
    .products-section {
      padding: 64px 0;
    }

    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 32px;
    }

    /* Product Cards */
    .product-card {
      background-color: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: 16px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: var(--color-card-shadow);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .product-card:hover {
      transform: translateY(-6px);
      box-shadow: 0 12px 30px -4px rgba(15, 23, 42, 0.08);
      border-color: var(--color-text-muted);
    }

    .product-image-container {
      position: relative;
      height: 200px;
      overflow: hidden;
      background-color: var(--color-gray-100);
    }

    .product-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.5s ease;
    }

    .product-card:hover .product-image {
      transform: scale(1.04);
    }

    .product-tag {
      position: absolute;
      top: 12px;
      left: 12px;
      background-color: var(--color-accent);
      color: #000000;
      font-weight: 700;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 4px 10px;
      border-radius: 99px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }

    .product-category {
      position: absolute;
      bottom: 12px;
      right: 12px;
      background-color: rgba(15, 23, 42, 0.85);
      color: #ffffff;
      font-weight: 600;
      font-size: 0.75rem;
      padding: 4px 10px;
      border-radius: 6px;
      backdrop-filter: blur(4px);
    }

    .product-content {
      padding: 24px;
      display: flex;
      flex-direction: column;
      flex-grow: 1;
    }

    .product-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 12px;
    }

    .product-title {
      font-size: 1.25rem;
      font-weight: 700;
      line-height: 1.3;
      letter-spacing: -0.01em;
    }

    .product-price {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--color-accent);
      white-space: nowrap;
    }

    .product-description {
      color: var(--color-text-muted);
      font-size: 0.95rem;
      line-height: 1.6;
      margin-bottom: 24px;
      flex-grow: 1;
    }

    .product-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 16px;
      border-top: 1px solid var(--color-border);
      gap: 16px;
    }

    .product-rating {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .stars-container {
      display: flex;
      align-items: center;
    }

    .star-icon {
      width: 16px;
      height: 16px;
    }

    .star-icon.filled {
      color: var(--color-star);
      fill: var(--color-star);
    }

    .star-icon.half-filled {
      color: var(--color-star);
    }

    .star-icon.empty {
      color: var(--color-text-muted);
      opacity: 0.3;
    }

    .rating-text {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--color-text-muted);
    }

    .view-product-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      background-color: var(--color-text);
      color: var(--color-bg);
      text-decoration: none;
      font-weight: 600;
      font-size: 0.9rem;
      padding: 10px 18px;
      border-radius: 8px;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .view-product-btn:hover {
      background-color: var(--color-accent);
      color: #000000;
      transform: translateX(2px);
    }

    .btn-arrow {
      width: 16px;
      height: 16px;
      transition: transform 0.2s ease;
    }

    .view-product-btn:hover .btn-arrow {
      transform: translateX(4px);
    }

    /* Newsletter Section */
    .newsletter-section {
      padding: 64px 0 96px;
    }

    .newsletter-container {
      background-color: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: 24px;
      padding: 48px 40px;
      text-align: center;
      box-shadow: var(--color-card-shadow);
      position: relative;
      overflow: hidden;
    }

    .newsletter-container::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 4px;
      background-color: var(--color-accent);
    }

    .newsletter-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background-color: var(--color-gray-100);
      border: 1px solid var(--color-border);
      padding: 6px 14px;
      border-radius: 99px;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--color-text-muted);
      margin-bottom: 20px;
    }

    .badge-icon {
      width: 14px;
      height: 14px;
    }

    .newsletter-title {
      font-family: var(--font-display);
      font-size: 2.25rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      margin-bottom: 12px;
    }

    .newsletter-description {
      max-width: 580px;
      margin: 0 auto 32px;
      color: var(--color-text-muted);
      font-size: 1.05rem;
      line-height: 1.6;
    }

    .newsletter-form {
      max-width: 520px;
      margin: 0 auto;
    }

    .input-group {
      display: flex;
      flex-direction: row;
      background: var(--color-gray-100);
      border: 1px solid var(--color-border);
      padding: 6px;
      border-radius: 12px;
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.02);
      transition: all 0.2s ease;
    }

    .input-group:focus-within {
      border-color: var(--color-text);
      box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.08);
    }

    .newsletter-input {
      flex-grow: 1;
      background: transparent;
      border: none;
      outline: none;
      padding: 12px 16px;
      font-family: var(--font-body);
      font-size: 1rem;
      color: var(--color-text);
      min-width: 0;
    }

    .newsletter-input::placeholder {
      color: var(--color-text-muted);
      opacity: 0.7;
    }

    .newsletter-submit-btn {
      background-color: var(--color-text);
      color: var(--color-bg);
      border: none;
      outline: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.95rem;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .newsletter-submit-btn:hover {
      background-color: var(--color-accent);
      color: #000000;
    }

    .submit-arrow {
      width: 16px;
      height: 16px;
      transition: transform 0.2s ease;
    }

    .newsletter-submit-btn:hover .submit-arrow {
      transform: translateX(3px);
    }

    .follow-message {
      font-size: 0.95rem;
      font-weight: 600;
      margin-top: 16px;
      transition: all 0.3s ease;
    }

    .follow-message.success-message {
      color: #10b981;
    }

    .hidden {
      display: none;
      opacity: 0;
    }

    .visible {
      display: block;
      opacity: 1;
    }

    /* Footer */
    footer {
      margin-top: auto;
      border-top: 1px solid var(--color-border);
      padding: 40px 0;
      text-align: center;
      background-color: var(--color-surface);
    }

    .footer-text {
      font-size: 0.9rem;
      color: var(--color-text-muted);
      margin-bottom: 8px;
    }

    .footer-powered {
      font-size: 0.8rem;
      color: var(--color-text-muted);
      opacity: 0.7;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
    }

    .footer-powered a {
      color: var(--color-text);
      text-decoration: none;
      font-weight: 600;
    }

    .footer-powered a:hover {
      text-decoration: underline;
    }

    /* Responsive Queries */
    @media (max-width: 768px) {
      .hero-title {
        font-size: 2.25rem;
      }
      .newsletter-container {
        padding: 32px 24px;
      }
      .newsletter-title {
        font-size: 1.75rem;
      }
      .input-group {
        flex-direction: column;
        background: transparent;
        border: none;
        padding: 0;
        gap: 12px;
      }
      .newsletter-input {
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: 10px;
        padding: 14px 16px;
        width: 100%;
      }
      .newsletter-submit-btn {
        width: 100%;
        justify-content: center;
        padding: 14px;
        border-radius: 10px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <header class="header-nav">
      <button class="theme-toggle-btn" id="theme-toggle" aria-label="Toggle light/dark theme">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="theme-icon"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
      </button>
    </header>

    <main>
      <section class="hero-section">
        <div class="hero-avatar-wrapper">
          <img class="hero-avatar" src="${config.avatarUrl}" alt="${config.fullName}" referrerpolicy="no-referrer">
        </div>
        <div class="hero-title-group">
          <h1 class="hero-title">${config.fullName}</h1>
          <p class="hero-tagline">${config.tagline}</p>
        </div>
        <p class="hero-bio">${config.bio}</p>
        <div class="socials-row">
          ${socialsHtml}
        </div>
      </section>

      <section class="products-section">
        <h2 class="section-title">Digital Products</h2>
        <div class="products-grid">
          ${productsHtml}
        </div>
      </section>

      ${newsletterHtml}
    </main>
  </div>

  <footer>
    <div class="container">
      <p class="footer-text">© <span id="current-year"></span> ${config.fullName}. All rights reserved.</p>
      <p class="footer-powered">
        Built for <a href="https://gumroad.com/${config.username}" target="_blank" rel="noopener noreferrer">@${config.username}</a>
      </p>
    </div>
  </footer>

  <script>
    document.getElementById('current-year').textContent = new Date().getFullYear();
    ${themeScript}
  </script>
</body>
</html>`;
}
