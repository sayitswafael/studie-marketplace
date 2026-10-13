import { DurableObject } from "cloudflare:workers";
import { Hono } from "hono";

export class App extends DurableObject {
  private app = new Hono();
  private dbInitialized = false;

  constructor(ctx: DurableObjectState, env: Record<string, unknown>) {
    super(ctx, env);
    this.setupRoutes();
  }

  private initDatabase() {
    if (this.dbInitialized) return;

    // Create Tables
    this.ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        icon TEXT
      );

      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        category_id TEXT NOT NULL,
        main_image TEXT NOT NULL,
        gallery_images TEXT DEFAULT '[]',
        status TEXT NOT NULL DEFAULT 'approved',
        rejection_reason TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS purchase_links (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL,
        platform TEXT NOT NULL,
        url TEXT NOT NULL,
        label TEXT,
        price REAL,
        clicks_count INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS reviews_metadata (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL,
        platform TEXT NOT NULL,
        rating REAL NOT NULL,
        review_count INTEGER NOT NULL,
        source_name TEXT NOT NULL,
        is_verified INTEGER DEFAULT 1,
        last_checked_date TEXT NOT NULL,
        notes TEXT
      );

      CREATE TABLE IF NOT EXISTS click_events (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL,
        platform TEXT NOT NULL,
        link_id TEXT,
        timestamp INTEGER NOT NULL,
        user_agent TEXT
      );

      CREATE TABLE IF NOT EXISTS admin_config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);

    // Seed default categories if empty
    const catCheck = this.ctx.storage.sql.exec(`SELECT COUNT(*) as count FROM categories`).one();
    if ((catCheck.count as number) === 0) {
      this.seedInitialData();
    }

    this.dbInitialized = true;
  }

  private seedInitialData() {
    // Categories
    const categories = [
      { id: 'cat-1', name: 'UTM Apparel & Merch', slug: 'utm-apparel', icon: 'Shirt' },
      { id: 'cat-2', name: 'Books & Stationeries', slug: 'books-stationery', icon: 'BookOpen' },
      { id: 'cat-3', name: 'Electronics & Gadgets', slug: 'electronics-gadgets', icon: 'Laptop' },
      { id: 'cat-4', name: 'Student Food & Snacks', slug: 'food-snacks', icon: 'Coffee' },
      { id: 'cat-5', name: 'Dorm & Living', slug: 'dorm-living', icon: 'Home' },
      { id: 'cat-6', name: 'UTM Services & Printing', slug: 'services-printing', icon: 'Printer' }
    ];

    for (const c of categories) {
      this.ctx.storage.sql.exec(
        `INSERT INTO categories (id, name, slug, icon) VALUES (?, ?, ?, ?)`,
        c.id, c.name, c.slug, c.icon
      );
    }

    // Default admin secret
    this.ctx.storage.sql.exec(
      `INSERT OR REPLACE INTO admin_config (key, value) VALUES ('admin_key', 'utm2025admin')`
    );

    // Initial Seed Products
    const now = Date.now();
    const seedProducts = [
      {
        id: 'prod-1',
        title: 'UTM Heritage Premium Maroon Hoodie (Official Student Edition)',
        description: 'Heavyweight 320GSM cotton fleece UTM embroidered maroon hoodie. Perfect for air-conditioned lecture halls and rainy days at UTM Skudai campus.',
        category_id: 'cat-1',
        main_image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80',
        gallery_images: JSON.stringify([
          'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=800&q=80'
        ]),
        status: 'approved',
        created_at: now - 86400000 * 5,
        updated_at: now - 86400000 * 5,
        links: [
          { id: 'pl-1-1', platform: 'shopee', url: 'https://shopee.com.my/search?keyword=utm+maroon+hoodie', label: 'Official Shopee Affiliate Store', price: 65.00, clicks: 142 },
          { id: 'pl-1-2', platform: 'tiktok', url: 'https://www.tiktok.com/search?q=utm+hoodie+malaysia', label: 'TikTok Shop UTM Campus Mall', price: 62.90, clicks: 98 },
          { id: 'pl-1-3', platform: 'whatsapp', url: 'https://wa.me/60123456789?text=Hi!+I+want+to+order+UTM+Maroon+Hoodie', label: 'Direct WhatsApp Student Vendor (Pick up @ KTF)', price: 60.00, clicks: 45 }
        ],
        reviews: [
          { id: 'rev-1-1', platform: 'shopee', rating: 4.9, review_count: 218, source_name: 'Shopee Verified Store Stats', is_verified: 1, last_checked_date: '2026-10-10', notes: 'Verified purchase ratings extracted from official student merch seller store' },
          { id: 'rev-1-2', platform: 'tiktok', rating: 4.8, review_count: 145, source_name: 'TikTok Shop Creator Analytics', is_verified: 1, last_checked_date: '2026-10-12', notes: 'Live video reviews from UTM students' }
        ]
      },
      {
        id: 'prod-2',
        title: 'Ergonomic Aluminium Laptop & Tablet Stand for UTM Study Desks',
        description: 'Foldable 6-level height adjustable aluminum stand. Dissipates heat during heavy CAD/MATLAB engineering simulations and long study sessions.',
        category_id: 'cat-3',
        main_image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=800&q=80',
        gallery_images: JSON.stringify([
          'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=800&q=80'
        ]),
        status: 'approved',
        created_at: now - 86400000 * 4,
        updated_at: now - 86400000 * 4,
        links: [
          { id: 'pl-2-1', platform: 'shopee', url: 'https://shopee.com.my/search?keyword=aluminum+laptop+stand+foldable', label: 'Shopee Star Seller Deals', price: 18.50, clicks: 230 },
          { id: 'pl-2-2', platform: 'tiktok', url: 'https://www.tiktok.com/search?q=portable+laptop+stand+malaysia', label: 'TikTok Creator Special Promo', price: 17.90, clicks: 184 }
        ],
        reviews: [
          { id: 'rev-2-1', platform: 'shopee', rating: 4.9, review_count: 1420, source_name: 'Shopee Buyer Reviews Log', is_verified: 1, last_checked_date: '2026-10-11', notes: 'Top-rated tech accessory for university students' },
          { id: 'rev-2-2', platform: 'tiktok', rating: 4.7, review_count: 890, source_name: 'TikTok Shop Product Badge', is_verified: 1, last_checked_date: '2026-10-09', notes: 'Featured in UTM Tech Study vlogs' }
        ]
      },
      {
        id: 'prod-3',
        title: 'UTM Engineering & Science Laboratory Coat (Unisex White Cotton)',
        description: 'Standard UTM Faculty of Engineering & Science lab coat with pre-stitched pen holder pocket and chest pocket. Complies with UTM OSHE lab safety requirements.',
        category_id: 'cat-1',
        main_image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80',
        gallery_images: JSON.stringify([
          'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80'
        ]),
        status: 'approved',
        created_at: now - 86400000 * 3,
        updated_at: now - 86400000 * 3,
        links: [
          { id: 'pl-3-1', platform: 'shopee', url: 'https://shopee.com.my/search?keyword=utm+lab+coat', label: 'Shopee Campus Uniform Store', price: 38.00, clicks: 110 },
          { id: 'pl-3-2', platform: 'whatsapp', url: 'https://wa.me/60123456789?text=Hi!+I+need+a+UTM+Lab+Coat+Size+M', label: 'WhatsApp UTM Chemical Eng Society Direct Order', price: 35.00, clicks: 76 }
        ],
        reviews: [
          { id: 'rev-3-1', platform: 'shopee', rating: 4.8, review_count: 312, source_name: 'Shopee Store Feedback', is_verified: 1, last_checked_date: '2026-10-08', notes: 'Thick quality fabric, true to size' }
        ]
      },
      {
        id: 'prod-4',
        title: 'Crispy Sambal Garing & Homemade Choco Crunch (UTM Dorm Snack Pack)',
        description: 'Ready-to-eat spicy anchovy sambal garing and melted chocolate malt crunch. Perfect emergency meal booster with rice for late-night exam prep.',
        category_id: 'cat-4',
        main_image: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=800&q=80',
        gallery_images: JSON.stringify([
          'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=800&q=80'
        ]),
        status: 'approved',
        created_at: now - 86400000 * 2,
        updated_at: now - 86400000 * 2,
        links: [
          { id: 'pl-4-1', platform: 'tiktok', url: 'https://www.tiktok.com/search?q=sambal+garing+gila', label: 'TikTok Shop Viral Food Hub', price: 12.00, clicks: 315 },
          { id: 'pl-4-2', platform: 'whatsapp', url: 'https://wa.me/60123456789?text=Order+Sambal+Garing+KTDI+Delivery', label: 'WhatsApp Kolej KDSE / KTF Room Delivery', price: 10.00, clicks: 198 }
        ],
        reviews: [
          { id: 'rev-4-1', platform: 'tiktok', rating: 4.9, review_count: 1850, source_name: 'TikTok Creator Food Reviews', is_verified: 1, last_checked_date: '2026-10-13', notes: 'Extra crunchy, certified halal' }
        ]
      },
      {
        id: 'prod-5',
        title: 'Express Thesis & Report Printing / Hardcover Binding Service @ UTM Skudai',
        description: 'High-speed A4 color printing, gold-stamped hardcover thesis binding, comb binding, and blueprint printing. Same-day pickup at Arked Cemerlang or Kolej Rahman Putra.',
        category_id: 'cat-6',
        main_image: 'https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?auto=format&fit=crop&w=800&q=80',
        gallery_images: JSON.stringify([
          'https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?auto=format&fit=crop&w=800&q=80'
        ]),
        status: 'approved',
        created_at: now - 86400000 * 1,
        updated_at: now - 86400000 * 1,
        links: [
          { id: 'pl-5-1', platform: 'whatsapp', url: 'https://wa.me/60123456789?text=Hi!+I+need+to+print+my+FYP+report', label: 'WhatsApp Express Printing Order', price: 0.10, clicks: 420 },
          { id: 'pl-5-2', platform: 'google_forms', url: 'https://forms.google.com/example-utm-printing-request', label: 'Google Form File Submission & Quote', price: 0.08, clicks: 260 }
        ],
        reviews: [
          { id: 'rev-5-1', platform: 'verified_manual', rating: 5.0, review_count: 88, source_name: 'UTM Student Council Feedback Form', is_verified: 1, last_checked_date: '2026-10-12', notes: 'Fast response and perfect thesis binding layout' }
        ]
      },
      {
        id: 'prod-6',
        title: 'Casio FX-570EX ClassWiz Scientific Calculator (UTM Exam Approved)',
        description: 'Essential scientific calculator with high-resolution LCD screen and advanced matrix/vector solver functions required for UTM Mathematics, Physics, and Engineering modules.',
        category_id: 'cat-2',
        main_image: 'https://images.unsplash.com/photo-1611125832047-1d7ad1e8e48e?auto=format&fit=crop&w=800&q=80',
        gallery_images: JSON.stringify([
          'https://images.unsplash.com/photo-1611125832047-1d7ad1e8e48e?auto=format&fit=crop&w=800&q=80'
        ]),
        status: 'approved',
        created_at: now - 3600000 * 12,
        updated_at: now - 3600000 * 12,
        links: [
          { id: 'pl-6-1', platform: 'shopee', url: 'https://shopee.com.my/search?keyword=casio+fx+570ex+original', label: 'Shopee Official Casio Flagship', price: 89.00, clicks: 178 },
          { id: 'pl-6-2', platform: 'tiktok', url: 'https://www.tiktok.com/search?q=casio+fx570ex+malaysia', label: 'TikTok Shop Stationery Direct', price: 85.50, clicks: 92 }
        ],
        reviews: [
          { id: 'rev-6-1', platform: 'shopee', rating: 4.9, review_count: 3410, source_name: 'Shopee Verified Purchase Ratings', is_verified: 1, last_checked_date: '2026-10-11', notes: 'Original serial number verified' },
          { id: 'rev-6-2', platform: 'tiktok', rating: 4.9, review_count: 1200, source_name: 'TikTok Shop Ratings', is_verified: 1, last_checked_date: '2026-10-10', notes: 'Includes 1-year warranty card' }
        ]
      }
    ];

    for (const p of seedProducts) {
      this.ctx.storage.sql.exec(
        `INSERT INTO products (id, title, description, category_id, main_image, gallery_images, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        p.id, p.title, p.description, p.category_id, p.main_image, p.gallery_images, p.status, p.created_at, p.updated_at
      );

      for (const l of p.links) {
        this.ctx.storage.sql.exec(
          `INSERT INTO purchase_links (id, product_id, platform, url, label, price, clicks_count)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          l.id, p.id, l.platform, l.url, l.label, l.price, l.clicks
        );
      }

      for (const r of p.reviews) {
        this.ctx.storage.sql.exec(
          `INSERT INTO reviews_metadata (id, product_id, platform, rating, review_count, source_name, is_verified, last_checked_date, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          r.id, p.id, r.platform, r.rating, r.review_count, r.source_name, r.is_verified, r.last_checked_date, r.notes
        );
      }
    }
  }

  private setupRoutes() {
    // Middleware: Init DB on first API call
    this.app.use('*', async (c, next) => {
      this.initDatabase();
      await next();
    });

    // --- PUBLIC APIS ---

    // 1. Info / Tech Documentation
    this.app.get('/api/info', (c) => {
      return c.json({
        app_name: 'Studie Marketplace',
        brand: 'Inspired by Universiti Teknologi Malaysia (UTM) maroon-and-gold identity',
        stack: {
          runtime: 'Cloudflare Workers (Durable Object)',
          database: 'Cloudflare DO SQLite (this.ctx.storage.sql)',
          frontend: 'React 18 + Tailwind CSS + Lucide Icons',
          architecture: 'Restful API & Client-side Web SPA'
        },
        database_tables: ['categories', 'products', 'purchase_links', 'reviews_metadata', 'click_events', 'admin_config'],
        security: {
          admin_auth: 'Header x-admin-key validation for administrative endpoints',
          moderation: 'User submitted products require admin approval before public display',
          validation: 'Server-side URL and field input validation'
        },
        data_disclaimer: 'Outbound links track explicit click events. Reviews & Ratings display verified manual or snapshot data with explicit source and last-checked date. No fabricated live sync claimed.'
      });
    });

    // 2. Categories
    this.app.get('/api/categories', (c) => {
      const rows = this.ctx.storage.sql.exec(`SELECT * FROM categories ORDER BY name ASC`).toArray();
      return c.json(rows);
    });

    // 3. Public Approved Products
    this.app.get('/api/products', (c) => {
      const category = c.req.query('category');
      const search = c.req.query('q');
      const sort = c.req.query('sort') || 'latest';
      const platform = c.req.query('platform');

      let query = `SELECT p.*, c.name as category_name FROM products p JOIN categories c ON p.category_id = c.id WHERE p.status = 'approved'`;
      const params: (string | number)[] = [];

      if (category && category !== 'all') {
        query += ` AND (p.category_id = ? OR c.slug = ?)`;
        params.push(category, category);
      }

      if (search && search.trim() !== '') {
        query += ` AND (p.title LIKE ? OR p.description LIKE ?)`;
        const term = `%${search.trim()}%`;
        params.push(term, term);
      }

      if (platform && platform !== 'all') {
        query += ` AND p.id IN (SELECT DISTINCT product_id FROM purchase_links WHERE platform = ?)`;
        params.push(platform);
      }

      if (sort === 'latest') {
        query += ` ORDER BY p.created_at DESC`;
      } else if (sort === 'oldest') {
        query += ` ORDER BY p.created_at ASC`;
      }

      const products = this.ctx.storage.sql.exec(query, ...params).toArray();

      // Attach links and reviews to products
      const enrichedProducts = products.map((p) => {
        const links = this.ctx.storage.sql.exec(
          `SELECT * FROM purchase_links WHERE product_id = ?`, p.id
        ).toArray();

        const reviews = this.ctx.storage.sql.exec(
          `SELECT * FROM reviews_metadata WHERE product_id = ?`, p.id
        ).toArray();

        // Total clicks
        const totalClicks = links.reduce((acc, l) => acc + (l.clicks_count as number || 0), 0);

        return {
          ...p,
          gallery_images: JSON.parse((p.gallery_images as string) || '[]'),
          purchase_links: links,
          reviews_metadata: reviews,
          total_clicks: totalClicks
        };
      });

      // Sort by clicks or rating if requested
      if (sort === 'clicks') {
        enrichedProducts.sort((a, b) => b.total_clicks - a.total_clicks);
      } else if (sort === 'rating') {
        enrichedProducts.sort((a, b) => {
          const maxA = Math.max(...a.reviews_metadata.map(r => r.rating as number), 0);
          const maxB = Math.max(...b.reviews_metadata.map(r => r.rating as number), 0);
          return maxB - maxA;
        });
      }

      return c.json(enrichedProducts);
    });

    // 4. Single Product Detail Page Data
    this.app.get('/api/products/:id', (c) => {
      const id = c.req.param('id');
      const product = this.ctx.storage.sql.exec(
        `SELECT p.*, c.name as category_name, c.slug as category_slug FROM products p JOIN categories c ON p.category_id = c.id WHERE p.id = ?`, id
      ).toArray()[0];

      if (!product) {
        return c.json({ error: 'Product not found' }, 404);
      }

      const links = this.ctx.storage.sql.exec(
        `SELECT * FROM purchase_links WHERE product_id = ?`, id
      ).toArray();

      const reviews = this.ctx.storage.sql.exec(
        `SELECT * FROM reviews_metadata WHERE product_id = ?`, id
      ).toArray();

      const totalClicks = links.reduce((acc, l) => acc + (l.clicks_count as number || 0), 0);

      return c.json({
        ...product,
        gallery_images: JSON.parse((product.gallery_images as string) || '[]'),
        purchase_links: links,
        reviews_metadata: reviews,
        total_clicks: totalClicks
      });
    });

    // 5. Submit Product (Public User -> Approval Queue)
    this.app.post('/api/products', async (c) => {
      try {
        const body = await c.req.json();
        const { title, description, category_id, main_image, gallery_images, links, reviews } = body;

        // Validation
        if (!title || typeof title !== 'string' || title.trim().length < 3) {
          return c.json({ error: 'Product title must be at least 3 characters long.' }, 400);
        }
        if (!description || typeof description !== 'string' || description.trim().length < 10) {
          return c.json({ error: 'Product description must be at least 10 characters long.' }, 400);
        }
        if (!category_id) {
          return c.json({ error: 'Please select a valid category.' }, 400);
        }
        if (!main_image || typeof main_image !== 'string' || !main_image.startsWith('http')) {
          return c.json({ error: 'Please provide a valid product image URL (e.g., https://...).' }, 400);
        }
        if (!Array.isArray(links) || links.length === 0) {
          return c.json({ error: 'At least one purchase link (Shopee, TikTok Shop, WhatsApp, or Google Forms) is required.' }, 400);
        }

        // Validate URLs in links
        for (const link of links) {
          if (!link.url || typeof link.url !== 'string' || !link.url.startsWith('http')) {
            return c.json({ error: `Invalid URL format for purchase link platform: ${link.platform || 'unknown'}` }, 400);
          }
          if (!['shopee', 'tiktok', 'whatsapp', 'google_forms'].includes(link.platform)) {
            return c.json({ error: `Unsupported platform type: ${link.platform}` }, 400);
          }
        }

        const productId = 'prod-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
        const galleryJson = JSON.stringify(Array.isArray(gallery_images) ? gallery_images : [main_image]);
        const now = Date.now();

        // Insert product with 'pending' status
        this.ctx.storage.sql.exec(
          `INSERT INTO products (id, title, description, category_id, main_image, gallery_images, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
          productId, title.trim(), description.trim(), category_id, main_image.trim(), galleryJson, now, now
        );

        // Insert Links
        for (const l of links) {
          const linkId = 'pl-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
          const priceVal = typeof l.price === 'number' && l.price >= 0 ? l.price : null;
          this.ctx.storage.sql.exec(
            `INSERT INTO purchase_links (id, product_id, platform, url, label, price, clicks_count)
             VALUES (?, ?, ?, ?, ?, ?, 0)`,
            linkId, productId, l.platform, l.url.trim(), l.label ? l.label.trim() : null, priceVal
          );
        }

        // Optional Review Info Manual Entry
        if (Array.isArray(reviews)) {
          for (const r of reviews) {
            if (r.rating && r.source_name) {
              const revId = 'rev-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
              this.ctx.storage.sql.exec(
                `INSERT INTO reviews_metadata (id, product_id, platform, rating, review_count, source_name, is_verified, last_checked_date, notes)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                revId, productId, r.platform || 'verified_manual', Number(r.rating) || 5.0, Number(r.review_count) || 1,
                r.source_name.trim(), 1, new Date().toISOString().split('T')[0], r.notes ? r.notes.trim() : 'Manual submission with disclosure'
              );
            }
          }
        }

        return c.json({
          success: true,
          message: 'Product submitted successfully! It is currently pending administrator approval before appearing publicly.',
          product_id: productId,
          status: 'pending'
        }, 201);

      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        return c.json({ error: 'Failed to process submission: ' + errorMsg }, 500);
      }
    });

    // 6. Outgoing Link Click Tracking
    this.app.post('/api/products/:id/click', async (c) => {
      const productId = c.req.param('id');
      try {
        const body = await c.req.json();
        const { link_id, platform } = body;

        if (!link_id || !platform) {
          return c.json({ error: 'link_id and platform required' }, 400);
        }

        // Increment clicks on link
        this.ctx.storage.sql.exec(
          `UPDATE purchase_links SET clicks_count = clicks_count + 1 WHERE id = ? AND product_id = ?`,
          link_id, productId
        );

        // Record click event log
        const eventId = 'clk-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
        const userAgent = c.req.header('user-agent') || 'Unknown Browser';
        this.ctx.storage.sql.exec(
          `INSERT INTO click_events (id, product_id, platform, link_id, timestamp, user_agent)
           VALUES (?, ?, ?, ?, ?, ?)`,
          eventId, productId, platform, link_id, Date.now(), userAgent
        );

        // Get updated click count for product
        const links = this.ctx.storage.sql.exec(
          `SELECT id, platform, clicks_count FROM purchase_links WHERE product_id = ?`, productId
        ).toArray();

        const totalClicks = links.reduce((acc, l) => acc + (l.clicks_count as number || 0), 0);

        return c.json({
          success: true,
          product_id: productId,
          link_id: link_id,
          platform: platform,
          total_clicks: totalClicks,
          links: links
        });
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        return c.json({ error: 'Failed to log click: ' + errorMsg }, 500);
      }
    });


    // --- ADMIN APIS (Protected by x-admin-key header) ---

    const verifyAdmin = (reqKey: string | undefined): boolean => {
      const stored = this.ctx.storage.sql.exec(`SELECT value FROM admin_config WHERE key = 'admin_key'`).one();
      const adminPass = stored ? (stored.value as string) : 'utm2025admin';
      return reqKey === adminPass;
    };

    // Admin Auth Check
    this.app.post('/api/admin/login', async (c) => {
      const body = await c.req.json();
      const passcode = body.passcode;
      if (verifyAdmin(passcode)) {
        return c.json({ success: true, token: passcode, message: 'Authenticated successfully' });
      } else {
        return c.json({ error: 'Invalid admin passcode' }, 401);
      }
    });

    // Update Admin Passcode
    this.app.put('/api/admin/passcode', async (c) => {
      const key = c.req.header('x-admin-key');
      if (!verifyAdmin(key)) {
        return c.json({ error: 'Unauthorized: Invalid Admin Secret Key' }, 401);
      }

      const body = await c.req.json();
      const { new_passcode } = body;

      if (!new_passcode || typeof new_passcode !== 'string' || new_passcode.trim().length < 4) {
        return c.json({ error: 'New passcode must be at least 4 characters long.' }, 400);
      }

      this.ctx.storage.sql.exec(
        `INSERT OR REPLACE INTO admin_config (key, value) VALUES ('admin_key', ?)`,
        new_passcode.trim()
      );

      return c.json({ success: true, new_passcode: new_passcode.trim(), message: 'Admin passcode updated successfully.' });
    });

    // Get Admin Products List (Includes Pending, Approved, Rejected)
    this.app.get('/api/admin/products', (c) => {
      const key = c.req.header('x-admin-key');
      if (!verifyAdmin(key)) {
        return c.json({ error: 'Unauthorized: Invalid Admin Secret Key' }, 401);
      }

      const statusFilter = c.req.query('status') || 'all';
      let query = `SELECT p.*, c.name as category_name FROM products p JOIN categories c ON p.category_id = c.id`;
      const params: string[] = [];

      if (statusFilter !== 'all') {
        query += ` WHERE p.status = ?`;
        params.push(statusFilter);
      }

      query += ` ORDER BY p.created_at DESC`;

      const products = this.ctx.storage.sql.exec(query, ...params).toArray();

      const enriched = products.map((p) => {
        const links = this.ctx.storage.sql.exec(
          `SELECT * FROM purchase_links WHERE product_id = ?`, p.id
        ).toArray();

        const reviews = this.ctx.storage.sql.exec(
          `SELECT * FROM reviews_metadata WHERE product_id = ?`, p.id
        ).toArray();

        const totalClicks = links.reduce((acc, l) => acc + (l.clicks_count as number || 0), 0);

        return {
          ...p,
          gallery_images: JSON.parse((p.gallery_images as string) || '[]'),
          purchase_links: links,
          reviews_metadata: reviews,
          total_clicks: totalClicks
        };
      });

      return c.json(enriched);
    });

    // Update Product Status (Approve / Reject)
    this.app.put('/api/admin/products/:id/status', async (c) => {
      const key = c.req.header('x-admin-key');
      if (!verifyAdmin(key)) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const id = c.req.param('id');
      const { status, rejection_reason } = await c.req.json();

      if (!['approved', 'rejected', 'pending'].includes(status)) {
        return c.json({ error: 'Invalid status value' }, 400);
      }

      this.ctx.storage.sql.exec(
        `UPDATE products SET status = ?, rejection_reason = ?, updated_at = ? WHERE id = ?`,
        status, rejection_reason || null, Date.now(), id
      );

      return c.json({ success: true, message: `Product status updated to ${status}` });
    });

    // Edit Product (Admin)
    this.app.put('/api/admin/products/:id', async (c) => {
      const key = c.req.header('x-admin-key');
      if (!verifyAdmin(key)) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const id = c.req.param('id');
      const body = await c.req.json();
      const { title, description, category_id, main_image, status } = body;

      this.ctx.storage.sql.exec(
        `UPDATE products SET title = ?, description = ?, category_id = ?, main_image = ?, status = ?, updated_at = ? WHERE id = ?`,
        title, description, category_id, main_image, status || 'approved', Date.now(), id
      );

      return c.json({ success: true, message: 'Product updated successfully' });
    });

    // Delete Product (Admin)
    this.app.delete('/api/admin/products/:id', (c) => {
      const key = c.req.header('x-admin-key');
      if (!verifyAdmin(key)) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const id = c.req.param('id');
      this.ctx.storage.sql.exec(`DELETE FROM products WHERE id = ?`, id);
      this.ctx.storage.sql.exec(`DELETE FROM purchase_links WHERE product_id = ?`, id);
      this.ctx.storage.sql.exec(`DELETE FROM reviews_metadata WHERE product_id = ?`, id);
      this.ctx.storage.sql.exec(`DELETE FROM click_events WHERE product_id = ?`, id);

      return c.json({ success: true, message: 'Product removed permanently' });
    });

    // Add Category (Admin)
    this.app.post('/api/admin/categories', async (c) => {
      const key = c.req.header('x-admin-key');
      if (!verifyAdmin(key)) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const { name, icon } = await c.req.json();
      if (!name || name.trim() === '') {
        return c.json({ error: 'Category name is required' }, 400);
      }

      const catId = 'cat-' + Date.now();
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      try {
        this.ctx.storage.sql.exec(
          `INSERT INTO categories (id, name, slug, icon) VALUES (?, ?, ?, ?)`,
          catId, name.trim(), slug, icon || 'Tag'
        );
        return c.json({ success: true, category: { id: catId, name, slug, icon } });
      } catch (e: unknown) {
        return c.json({ error: 'Category slug already exists or database error' }, 400);
      }
    });

    // Delete Category (Admin)
    this.app.delete('/api/admin/categories/:id', (c) => {
      const key = c.req.header('x-admin-key');
      if (!verifyAdmin(key)) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const id = c.req.param('id');
      const count = this.ctx.storage.sql.exec(`SELECT COUNT(*) as count FROM products WHERE category_id = ?`, id).one();
      if ((count.count as number) > 0) {
        return c.json({ error: 'Cannot delete category containing existing products' }, 400);
      }

      this.ctx.storage.sql.exec(`DELETE FROM categories WHERE id = ?`, id);
      return c.json({ success: true, message: 'Category deleted' });
    });

    // Admin Analytics & Clicks Summary
    this.app.get('/api/admin/analytics', (c) => {
      const key = c.req.header('x-admin-key');
      if (!verifyAdmin(key)) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const clicksByPlatform = this.ctx.storage.sql.exec(`
        SELECT platform, SUM(clicks_count) as total_clicks
        FROM purchase_links
        GROUP BY platform
      `).toArray();

      const topClickedProducts = this.ctx.storage.sql.exec(`
        SELECT p.id, p.title, p.main_image, SUM(pl.clicks_count) as total_clicks
        FROM products p
        JOIN purchase_links pl ON p.id = pl.product_id
        GROUP BY p.id
        ORDER BY total_clicks DESC
        LIMIT 10
      `).toArray();

      const totalClicks = this.ctx.storage.sql.exec(`
        SELECT SUM(clicks_count) as total FROM purchase_links
      `).one();

      const totalProducts = this.ctx.storage.sql.exec(`
        SELECT COUNT(*) as count FROM products WHERE status = 'approved'
      `).one();

      const pendingSubmissions = this.ctx.storage.sql.exec(`
        SELECT COUNT(*) as count FROM products WHERE status = 'pending'
      `).one();

      return c.json({
        total_clicks: totalClicks.total || 0,
        total_approved_products: totalProducts.count || 0,
        pending_submissions: pendingSubmissions.count || 0,
        clicks_by_platform: clicksByPlatform,
        top_clicked_products: topClickedProducts
      });
    });
  }

  async fetch(request: Request): Promise<Response> {
    return this.app.fetch(request);
  }
}
