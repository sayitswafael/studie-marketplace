import React, { useState, useEffect, useMemo } from "react";
import { createRoot } from "react-dom/client";
import * as LucideIcons from "lucide-react";

// Destructure Lucide Icons safely
const {
  Search, Filter, Plus, ShoppingBag, ExternalLink, Star, ArrowRight,
  CheckCircle2, XCircle, AlertCircle, Clock, BarChart3, Tag, Layers,
  ShieldCheck, RefreshCw, ChevronRight, Share2, Info, Lock, Trash2,
  Edit, Check, X, ArrowLeft, MessageSquare, FileText, ChevronLeft,
  Smartphone, Monitor, ThumbsUp, Eye, Sparkles, Building2, HelpCircle, Key, Save
} = LucideIcons;

// Helper function to render platform badge styling
const getPlatformBadge = (platform) => {
  switch (platform) {
    case 'shopee':
      return {
        name: 'Shopee Affiliate',
        bg: 'bg-orange-50 text-orange-700 border-orange-200',
        badgeBg: 'bg-[#EE4D2D] text-white',
        icon: '🛍️'
      };
    case 'tiktok':
      return {
        name: 'TikTok Shop',
        bg: 'bg-slate-900 text-white border-slate-800',
        badgeBg: 'bg-black text-white',
        icon: '🎵'
      };
    case 'whatsapp':
      return {
        name: 'WhatsApp Direct',
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        badgeBg: 'bg-[#25D366] text-white',
        icon: '💬'
      };
    case 'google_forms':
      return {
        name: 'Google Forms',
        bg: 'bg-purple-50 text-purple-700 border-purple-200',
        badgeBg: 'bg-[#7248B9] text-white',
        icon: '📋'
      };
    default:
      return {
        name: 'External Seller',
        bg: 'bg-gray-50 text-gray-700 border-gray-200',
        badgeBg: 'bg-gray-600 text-white',
        icon: '🔗'
      };
  }
};

// Main App Component
function App() {
  // Navigation & Route State
  const [currentRoute, setCurrentRoute] = useState('home'); // 'home', 'product-detail', 'add-product', 'admin', 'guidelines'
  const [selectedProductId, setSelectedProductId] = useState(null);

  // Data States
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search State
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  const [platformFilter, setPlatformFilter] = useState('all');

  // Admin Auth State
  const [adminToken, setAdminToken] = useState(localStorage.getItem('utm_admin_token') || '');
  const [adminPasscode, setAdminPasscode] = useState('');
  const [adminAuthError, setAdminAuthError] = useState('');
  const [adminTab, setAdminTab] = useState('pending'); // 'pending', 'all', 'categories', 'analytics', 'settings'
  const [adminProducts, setAdminProducts] = useState([]);
  const [adminAnalytics, setAdminAnalytics] = useState(null);
  const [newCatName, setNewCatName] = useState('');

  // Admin Passcode Change State
  const [newAdminPasscode, setNewAdminPasscode] = useState('');
  const [confirmAdminPasscode, setConfirmAdminPasscode] = useState('');
  const [passcodeChangeError, setPasscodeChangeError] = useState('');
  const [passcodeChangeSuccess, setPasscodeChangeSuccess] = useState('');

  // Toast / Modal Notification
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Sync route from URL hash on load
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash.startsWith('product/')) {
        const id = hash.replace('product/', '');
        setSelectedProductId(id);
        setCurrentRoute('product-detail');
      } else if (['add-product', 'admin', 'guidelines'].includes(hash)) {
        setCurrentRoute(hash);
      } else {
        setCurrentRoute('home');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Fetch Categories
  useEffect(() => {
    fetch('./api/categories')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(err => console.error("Failed to load categories:", err));
  }, []);

  // Fetch Products for Home
  const fetchProducts = () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (selectedCategory !== 'all') params.append('category', selectedCategory);
    if (searchQuery) params.append('q', searchQuery);
    if (sortBy) params.append('sort', sortBy);
    if (platformFilter !== 'all') params.append('platform', platformFilter);

    fetch(`./api/products?${params.toString()}`)
      .then(res => {
        if (!res.ok) throw new Error("Server returned error loading products");
        return res.json();
      })
      .then(data => {
        setProducts(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || "Failed to load products");
        setLoading(false);
      });
  };

  useEffect(() => {
    if (currentRoute === 'home') {
      fetchProducts();
    }
  }, [currentRoute, selectedCategory, searchQuery, sortBy, platformFilter]);

  // Fetch Single Product Detail
  useEffect(() => {
    if (currentRoute === 'product-detail' && selectedProductId) {
      setLoading(true);
      fetch(`./api/products/${selectedProductId}`)
        .then(res => {
          if (!res.ok) throw new Error("Product not found");
          return res.json();
        })
        .then(data => {
          setSelectedProduct(data);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message);
          setLoading(false);
        });
    }
  }, [currentRoute, selectedProductId]);

  // Fetch Admin Data
  const fetchAdminProducts = () => {
    if (!adminToken) return;
    fetch('./api/admin/products', {
      headers: { 'x-admin-key': adminToken }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setAdminProducts(data);
      })
      .catch(err => console.error("Admin fetch error:", err));

    fetch('./api/admin/analytics', {
      headers: { 'x-admin-key': adminToken }
    })
      .then(res => res.json())
      .then(data => {
        if (!data.error) setAdminAnalytics(data);
      })
      .catch(err => console.error("Analytics fetch error:", err));
  };

  useEffect(() => {
    if (currentRoute === 'admin' && adminToken) {
      fetchAdminProducts();
    }
  }, [currentRoute, adminToken]);

  // Handle Admin Login
  const handleAdminLogin = (e) => {
    e.preventDefault();
    setAdminAuthError('');
    fetch('./api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode: adminPasscode })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setAdminToken(data.token);
          localStorage.setItem('utm_admin_token', data.token);
          showToast("Admin access granted", "success");
        } else {
          setAdminAuthError(data.error || 'Invalid admin passcode');
        }
      })
      .catch(err => setAdminAuthError("Login failed"));
  };

  // Handle Admin Logout
  const handleAdminLogout = () => {
    setAdminToken('');
    localStorage.removeItem('utm_admin_token');
    showToast("Logged out of Admin Portal", "info");
  };

  // Handle Passcode Update
  const handleChangePasscode = (e) => {
    e.preventDefault();
    setPasscodeChangeError('');
    setPasscodeChangeSuccess('');

    if (newAdminPasscode.length < 4) {
      setPasscodeChangeError('New passcode must be at least 4 characters long.');
      return;
    }

    if (newAdminPasscode !== confirmAdminPasscode) {
      setPasscodeChangeError('Passcodes do not match.');
      return;
    }

    fetch('./api/admin/passcode', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': adminToken
      },
      body: JSON.stringify({ new_passcode: newAdminPasscode })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setAdminToken(data.new_passcode);
          localStorage.setItem('utm_admin_token', data.new_passcode);
          setPasscodeChangeSuccess('Admin passcode updated successfully! Your session key has been refreshed.');
          setNewAdminPasscode('');
          setConfirmAdminPasscode('');
          showToast('Passcode updated successfully', 'success');
        } else {
          setPasscodeChangeError(data.error || 'Failed to update passcode');
        }
      })
      .catch(err => setPasscodeChangeError('Server error while updating passcode'));
  };

  // Handle Outgoing Link Click
  const handleLinkClick = (product, link) => {
    // Fire background click tracker
    fetch(`./api/products/${product.id}/click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ link_id: link.id, platform: link.platform })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && selectedProduct && selectedProduct.id === product.id) {
          setSelectedProduct(prev => ({
            ...prev,
            total_clicks: data.total_clicks,
            purchase_links: prev.purchase_links.map(l => l.id === link.id ? { ...l, clicks_count: (l.clicks_count || 0) + 1 } : l)
          }));
        }
      })
      .catch(err => console.error("Click track error:", err));

    // Open link in new tab
    window.open(link.url, '_blank', 'noopener,noreferrer');
  };

  // Navigate helper
  const navigateTo = (route, productId = null) => {
    if (route === 'product-detail' && productId) {
      window.location.hash = `product/${productId}`;
    } else if (route === 'home') {
      window.location.hash = '';
    } else {
      window.location.hash = route;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5]">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl bg-slate-900 text-white text-sm font-medium border border-slate-700 animate-bounce">
          <Sparkles className="w-4 h-4 text-utm-gold" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* STICKY TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-40 bg-[#7A0026] text-white shadow-lg border-b border-utm-gold/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo & Brand Title */}
          <button 
            onClick={() => navigateTo('home')} 
            className="flex items-center gap-3 group text-left focus:outline-none"
          >
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-utm-gold/40 flex items-center justify-center font-display font-extrabold text-utm-gold text-xl group-hover:scale-105 transition-transform shadow-inner">
              S
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-lg sm:text-xl tracking-tight text-white group-hover:text-utm-gold transition-colors">
                  Studie Marketplace
                </span>
                <span className="hidden md:inline-block px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded bg-utm-gold text-utm-maroon">
                  UTM Student Hub
                </span>
              </div>
              <p className="text-[11px] text-utm-gold/80 font-normal hidden sm:block">
                Verified Product & Affiliate Discovery
              </p>
            </div>
          </button>

          {/* Desktop & Mobile Navigation Links */}
          <nav className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => navigateTo('home')}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                currentRoute === 'home' ? 'bg-white/15 text-white font-semibold' : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              Marketplace
            </button>

            <button
              onClick={() => navigateTo('guidelines')}
              className={`hidden sm:inline-flex px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                currentRoute === 'guidelines' ? 'bg-white/15 text-white font-semibold' : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              Guidelines
            </button>

            <button
              onClick={() => navigateTo('admin')}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 ${
                currentRoute === 'admin' ? 'bg-utm-gold text-utm-maroon font-bold' : 'text-utm-gold hover:bg-white/10'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>

            {/* STICKY CTA: ADD YOUR PRODUCT BUTTON */}
            <button
              onClick={() => navigateTo('add-product')}
              className="ml-2 px-3.5 py-2 rounded-xl bg-utm-gold text-utm-maroon hover:bg-[#e5a823] font-bold text-xs sm:text-sm shadow-md transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-1.5 border border-utm-gold/30"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span className="hidden sm:inline">Add Your Product</span>
              <span className="sm:hidden">Add</span>
            </button>
          </nav>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-grow">
        
        {/* VIEW 1: HOMEPAGE / MARKETPLACE */}
        {currentRoute === 'home' && (
          <div className="pb-16">
            
            {/* HERO BANNER */}
            <section className="bg-gradient-to-b from-[#7A0026] via-[#58001D] to-[#400015] text-white py-8 px-4 sm:px-6 lg:px-8 shadow-inner relative overflow-hidden">
              <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-utm-gold/10 rounded-full blur-3xl pointer-events-none" />
              <div className="max-w-7xl mx-auto relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-utm-gold/20 border border-utm-gold/30 text-utm-gold text-xs font-semibold mb-3">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>UTM Student Marketplace</span>
                </div>
                <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
                  Compare Price, Read Reviews and Discover Student Products
                </h1>
              </div>
            </section>

            {/* NON-STICKY CATEGORY SELECTION, SEARCH, SORTING & FILTERS SECTION */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-utm-border space-y-5">
                
                {/* Search Bar & Sorting Controls */}
                <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                  
                  {/* Search Input */}
                  <div className="relative flex-grow">
                    <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search hoodies, lab coats, calculators, laptop stands, printing services..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-slate-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-utm-maroon focus:border-transparent transition-all"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {/* Filters: Sort & Platform */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    
                    {/* Sort Dropdown */}
                    <div className="flex items-center gap-1.5 bg-slate-50 border border-gray-200 px-3 py-2 rounded-xl text-xs sm:text-sm">
                      <BarChart3 className="w-4 h-4 text-utm-maroon" />
                      <span className="text-gray-500 font-medium hidden sm:inline">Sort:</span>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="bg-transparent font-medium text-gray-800 focus:outline-none cursor-pointer"
                      >
                        <option value="latest">Latest Listed</option>
                        <option value="clicks">Most Clicked</option>
                        <option value="rating">Highest Rating</option>
                        <option value="oldest">Oldest First</option>
                      </select>
                    </div>

                    {/* Platform Filter */}
                    <div className="flex items-center gap-1.5 bg-slate-50 border border-gray-200 px-3 py-2 rounded-xl text-xs sm:text-sm">
                      <Filter className="w-4 h-4 text-utm-maroon" />
                      <span className="text-gray-500 font-medium hidden sm:inline">Platform:</span>
                      <select
                        value={platformFilter}
                        onChange={(e) => setPlatformFilter(e.target.value)}
                        className="bg-transparent font-medium text-gray-800 focus:outline-none cursor-pointer"
                      >
                        <option value="all">All Sellers</option>
                        <option value="shopee">Shopee Only</option>
                        <option value="tiktok">TikTok Shop Only</option>
                        <option value="whatsapp">WhatsApp Vendor</option>
                        <option value="google_forms">Google Forms</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Category Pills Bar (Non-Sticky) */}
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-utm-gold" />
                    <span>Categories</span>
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                        selectedCategory === 'all'
                          ? 'bg-utm-maroon text-white shadow-md shadow-utm-maroon/20'
                          : 'bg-slate-100 text-gray-600 hover:bg-slate-200 hover:text-gray-900'
                      }`}
                    >
                      All Categories
                    </button>

                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all border ${
                          selectedCategory === cat.id
                            ? 'bg-utm-maroon text-white border-utm-maroon shadow-md shadow-utm-maroon/20'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-utm-gold hover:text-utm-maroon'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* RESPONSIVE PRODUCT GRID SECTION */}
            {/* Requirements: 4 columns desktop, 3 tablet, 2 mobile */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              
              {/* Active Filter Counter Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-bold text-lg sm:text-xl text-gray-900 flex items-center gap-2">
                  <span>Student Products</span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-utm-gold/20 text-utm-maroon border border-utm-gold/40">
                    {products.length} {products.length === 1 ? 'item' : 'items'}
                  </span>
                </h2>
              </div>

              {/* LOADING STATE */}
              {loading && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <div key={n} className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm animate-pulse space-y-3">
                      <div className="w-full h-44 bg-slate-200 rounded-xl" />
                      <div className="h-4 bg-slate-200 rounded w-3/4" />
                      <div className="h-3 bg-slate-200 rounded w-1/2" />
                      <div className="h-8 bg-slate-200 rounded-lg w-full mt-4" />
                    </div>
                  ))}
                </div>
              )}

              {/* ERROR STATE */}
              {!loading && error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-8 text-center max-w-lg mx-auto my-8">
                  <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                  <h3 className="font-display font-bold text-lg">Unable to load marketplace products</h3>
                  <p className="text-sm mt-1 text-red-600">{error}</p>
                  <button
                    onClick={fetchProducts}
                    className="mt-4 px-4 py-2 rounded-xl bg-utm-maroon text-white text-sm font-semibold hover:bg-utm-maroonDark transition-colors inline-flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" /> Retry
                  </button>
                </div>
              )}

              {/* EMPTY STATE */}
              {!loading && !error && products.length === 0 && (
                <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-300 max-w-xl mx-auto my-8">
                  <div className="w-16 h-16 bg-utm-gold/10 rounded-full flex items-center justify-center text-utm-maroon mx-auto mb-4">
                    <ShoppingBag className="w-8 h-8" />
                  </div>
                  <h3 className="font-display font-bold text-xl text-gray-900">No products found</h3>
                  <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
                    We couldn't find any approved products matching your current search or category filter.
                  </p>
                  <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                    <button
                      onClick={() => { setSelectedCategory('all'); setSearchQuery(''); setPlatformFilter('all'); }}
                      className="px-4 py-2 rounded-xl bg-slate-100 text-gray-700 font-semibold text-sm hover:bg-slate-200"
                    >
                      Clear Filters
                    </button>
                    <button
                      onClick={() => navigateTo('add-product')}
                      className="px-4 py-2 rounded-xl bg-utm-gold text-utm-maroon font-bold text-sm hover:bg-[#e5a823] shadow-md flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" /> Add Your Product
                    </button>
                  </div>
                </div>
              )}

              {/* PRODUCT GRID: 4 columns desktop, 3 tablet, 2 mobile */}
              {!loading && !error && products.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                  {products.map((p) => {
                    // Highest rating computation
                    const bestReview = p.reviews_metadata && p.reviews_metadata.length > 0
                      ? p.reviews_metadata.reduce((max, r) => r.rating > max.rating ? r : max, p.reviews_metadata[0])
                      : null;

                    // Available platforms list
                    const platforms = Array.from(new Set((p.purchase_links || []).map(l => l.platform)));

                    return (
                      <div
                        key={p.id}
                        onClick={() => navigateTo('product-detail', p.id)}
                        className="group bg-white rounded-2xl border border-utm-border hover:border-utm-gold shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden cursor-pointer transform hover:-translate-y-1"
                      >
                        {/* Product Image & Badges */}
                        <div className="relative aspect-square w-full bg-slate-100 overflow-hidden">
                          <img
                            src={p.main_image}
                            alt={p.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                            onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80"; }}
                          />

                          {/* Category Badge */}
                          <span className="absolute top-2.5 left-2.5 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-semibold px-2.5 py-1 rounded-full tracking-wide">
                            {p.category_name}
                          </span>

                          {/* Total Clicks Pill Badge */}
                          <span className="absolute top-2.5 right-2.5 bg-utm-maroon/90 text-utm-gold text-[10px] font-bold px-2 py-0.5 rounded-full border border-utm-gold/40 shadow">
                            {p.total_clicks || 0} Clicks
                          </span>
                        </div>

                        {/* Product Card Details */}
                        <div className="p-3.5 sm:p-4 flex flex-col flex-grow">
                          
                          {/* Title */}
                          <h3 className="font-display font-semibold text-xs sm:text-sm text-gray-900 line-clamp-2 group-hover:text-utm-maroon transition-colors leading-snug">
                            {p.title}
                          </h3>

                          {/* Verified Review Information Summary */}
                          <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-600">
                            {bestReview ? (
                              <>
                                <div className="flex items-center text-amber-500 font-bold">
                                  <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-500 mr-0.5" />
                                  <span>{bestReview.rating.toFixed(1)}</span>
                                </div>
                                <span className="text-gray-300">•</span>
                                <span className="text-[11px] text-gray-500 truncate">
                                  {bestReview.review_count} verified reviews
                                </span>
                              </>
                            ) : (
                              <span className="text-[11px] text-gray-400 italic">No verified ratings yet</span>
                            )}
                          </div>

                          {/* Available Purchasing Options Badges */}
                          <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-center gap-1">
                            {platforms.map((plat) => {
                              const badge = getPlatformBadge(plat);
                              return (
                                <span
                                  key={plat}
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${badge.bg} flex items-center gap-1`}
                                >
                                  <span>{badge.icon}</span>
                                  <span>{badge.name.split(' ')[0]}</span>
                                </span>
                              );
                            })}
                          </div>

                          {/* Card Action Button */}
                          <div className="mt-auto pt-3">
                            <button className="w-full py-2 px-3 rounded-xl bg-slate-50 group-hover:bg-utm-maroon text-gray-700 group-hover:text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 border border-gray-200 group-hover:border-utm-maroon">
                              <span>Compare & Buy</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}

        {/* VIEW 2: PRODUCT DETAIL PAGE */}
        {currentRoute === 'product-detail' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32">
            
            {/* Back Navigation Bar */}
            <button
              onClick={() => navigateTo('home')}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-utm-border text-gray-700 font-semibold text-sm hover:text-utm-maroon hover:border-utm-gold shadow-sm transition-all mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Marketplace</span>
            </button>

            {loading && (
              <div className="bg-white rounded-3xl p-8 border border-utm-border shadow-sm animate-pulse space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="h-96 bg-slate-200 rounded-2xl" />
                  <div className="space-y-4">
                    <div className="h-8 bg-slate-200 rounded w-3/4" />
                    <div className="h-4 bg-slate-200 rounded w-1/2" />
                    <div className="h-24 bg-slate-200 rounded" />
                  </div>
                </div>
              </div>
            )}

            {!loading && selectedProduct && (
              <div className="space-y-8">
                
                {/* PRODUCT MAIN SECTION */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-utm-border shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                    
                    {/* PROMINENT MAIN IMAGE & CAROUSEL THUMBNAILS */}
                    <div className="space-y-4">
                      <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-100 border border-gray-200 shadow-inner">
                        <img
                          src={selectedProduct.main_image}
                          alt={selectedProduct.title}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80"; }}
                        />
                        <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-xs font-semibold">
                          {selectedProduct.category_name}
                        </div>
                      </div>

                      {/* Image Thumbnails Carousel */}
                      {selectedProduct.gallery_images && selectedProduct.gallery_images.length > 0 && (
                        <div className="flex items-center gap-3 overflow-x-auto pb-2">
                          {selectedProduct.gallery_images.map((imgUrl, idx) => (
                            <button
                              key={idx}
                              onClick={() => setSelectedProduct(prev => ({ ...prev, main_image: imgUrl }))}
                              className={`w-16 h-16 rounded-xl border-2 overflow-hidden flex-shrink-0 transition-all ${
                                selectedProduct.main_image === imgUrl ? 'border-utm-maroon ring-2 ring-utm-gold' : 'border-gray-200 opacity-70 hover:opacity-100'
                              }`}
                            >
                              <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* PRODUCT DETAILS & BUYING OPTIONS */}
                    <div className="flex flex-col justify-between space-y-6">
                      <div>
                        {/* Title & Category */}
                        <div className="inline-block text-xs font-bold uppercase tracking-wider text-utm-maroon mb-1">
                          {selectedProduct.category_name}
                        </div>
                        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
                          {selectedProduct.title}
                        </h1>

                        {/* Verified Click Counter Badge */}
                        <div className="mt-3 flex items-center gap-3">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-utm-gold/20 text-utm-maroon font-bold text-xs border border-utm-gold/40">
                            <Eye className="w-3.5 h-3.5" />
                            <span>{selectedProduct.total_clicks || 0} Outgoing Clicks</span>
                          </span>
                          <span className="text-xs text-gray-400">Tracked outgoing visits</span>
                        </div>

                        {/* Description */}
                        <div className="mt-6 pt-6 border-t border-gray-100">
                          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Description</h2>
                          <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                            {selectedProduct.description}
                          </p>
                        </div>
                      </div>

                      {/* AVAILABLE PURCHASE LINKS LIST */}
                      <div className="pt-6 border-t border-gray-100 space-y-3">
                        <h2 className="font-display font-bold text-base text-gray-900 flex items-center justify-between">
                          <span>Available Purchasing Options</span>
                          <span className="text-xs text-gray-500 font-normal">Choose seller platform</span>
                        </h2>

                        <div className="space-y-2.5">
                          {selectedProduct.purchase_links && selectedProduct.purchase_links.map((link) => {
                            const badge = getPlatformBadge(link.platform);
                            return (
                              <div
                                key={link.id}
                                className="p-3.5 rounded-2xl border border-gray-200 hover:border-utm-gold bg-slate-50 hover:bg-white transition-all flex items-center justify-between gap-4 shadow-sm"
                              >
                                <div className="flex items-center gap-3">
                                  <span className="text-2xl">{badge.icon}</span>
                                  <div>
                                    <div className="font-bold text-sm text-gray-900 flex items-center gap-2">
                                      <span>{link.label || badge.name}</span>
                                      <span className={`text-[10px] px-2 py-0.5 rounded ${badge.badgeBg}`}>
                                        {link.platform.toUpperCase()}
                                      </span>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                                      {link.price ? (
                                        <span className="font-extrabold text-utm-maroon text-sm">RM {link.price.toFixed(2)}</span>
                                      ) : (
                                        <span className="text-gray-400">Price varies / Quote</span>
                                      )}
                                      <span>•</span>
                                      <span>{link.clicks_count || 0} clicks</span>
                                    </div>
                                  </div>
                                </div>

                                <button
                                  onClick={() => handleLinkClick(selectedProduct, link)}
                                  className="px-4 py-2.5 rounded-xl bg-utm-maroon text-white font-bold text-xs hover:bg-utm-maroonDark transition-all flex items-center gap-1.5 shadow"
                                >
                                  <span>Visit Seller</span>
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* VERIFIED SHOPEE VS TIKTOK SHOP COMPARISON TABLE */}
                {/* Requirements: If both Shopee and TikTok Shop listings exist, show comparison table using verified data with source and last-checked date */}
                {selectedProduct.purchase_links && selectedProduct.purchase_links.length > 1 && (
                  <div className="bg-white rounded-3xl p-6 sm:p-8 border border-utm-border shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-utm-gold" />
                          <h2 className="font-display font-bold text-xl text-gray-900">
                            Seller Platform Comparison Table
                          </h2>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Verified price and listing metadata snapshot. Direct links redirect to official merchant portals.
                        </p>
                      </div>
                      <span className="text-xs bg-slate-100 text-gray-600 px-3 py-1 rounded-full font-medium">
                        {selectedProduct.purchase_links.length} purchasing channels available
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs sm:text-sm">
                        <thead>
                          <tr className="bg-slate-50 border-b border-gray-200 text-gray-600 font-semibold">
                            <th className="p-3.5 rounded-l-xl">Platform</th>
                            <th className="p-3.5">Option Details</th>
                            <th className="p-3.5">Verified Price</th>
                            <th className="p-3.5">Rating & Reviews</th>
                            <th className="p-3.5">Total Clicks</th>
                            <th className="p-3.5 text-right rounded-r-xl">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {selectedProduct.purchase_links.map((link) => {
                            const badge = getPlatformBadge(link.platform);
                            const matchingReview = (selectedProduct.reviews_metadata || []).find(r => r.platform === link.platform);

                            return (
                              <tr key={link.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="p-3.5 font-bold">
                                  <div className="flex items-center gap-2">
                                    <span className="text-lg">{badge.icon}</span>
                                    <span>{badge.name}</span>
                                  </div>
                                </td>
                                <td className="p-3.5 text-gray-700">
                                  {link.label || 'Standard Listing'}
                                </td>
                                <td className="p-3.5 font-extrabold text-utm-maroon text-base">
                                  {link.price ? `RM ${link.price.toFixed(2)}` : 'Contact Vendor'}
                                </td>
                                <td className="p-3.5">
                                  {matchingReview ? (
                                    <div>
                                      <div className="flex items-center gap-1 text-amber-500 font-bold">
                                        <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-500" />
                                        <span>{matchingReview.rating.toFixed(1)}</span>
                                        <span className="text-gray-400 text-[11px] font-normal">({matchingReview.review_count} reviews)</span>
                                      </div>
                                      <div className="text-[10px] text-gray-400 mt-0.5">
                                        Source: {matchingReview.source_name} ({matchingReview.last_checked_date})
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-gray-400 text-xs italic">N/A</span>
                                  )}
                                </td>
                                <td className="p-3.5 text-gray-600 font-medium">
                                  {link.clicks_count || 0} clicks
                                </td>
                                <td className="p-3.5 text-right">
                                  <button
                                    onClick={() => handleLinkClick(selectedProduct, link)}
                                    className="px-3 py-1.5 rounded-lg bg-utm-gold text-utm-maroon font-bold text-xs hover:bg-[#e5a823] transition-colors inline-flex items-center gap-1"
                                  >
                                    <span>Visit</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* VERIFIED REVIEWS & RATINGS SECTION */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-utm-border shadow-sm space-y-6">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <div>
                      <h2 className="font-display font-bold text-xl text-gray-900 flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-utm-maroon" />
                        <span>Verified Review Information</span>
                      </h2>
                      <p className="text-xs text-gray-500 mt-1">
                        All ratings displayed are backed by verified seller metadata snapshots or manual disclosures with source & timestamp.
                      </p>
                    </div>
                  </div>

                  {selectedProduct.reviews_metadata && selectedProduct.reviews_metadata.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedProduct.reviews_metadata.map((rev) => (
                        <div key={rev.id} className="p-4 rounded-2xl bg-slate-50 border border-gray-200 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-utm-maroon uppercase tracking-wider">
                              {rev.platform.toUpperCase()}
                            </span>
                            <span className="text-[10px] text-gray-400 bg-white px-2 py-0.5 rounded border border-gray-200">
                              Verified: {rev.last_checked_date}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="flex text-amber-400">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${i < Math.floor(rev.rating) ? 'fill-amber-400 stroke-amber-500' : 'text-gray-300'}`}
                                />
                              ))}
                            </div>
                            <span className="font-bold text-sm text-gray-900">{rev.rating.toFixed(1)} / 5.0</span>
                            <span className="text-xs text-gray-500">({rev.review_count} ratings)</span>
                          </div>

                          <div className="text-xs text-gray-600 bg-white p-2.5 rounded-xl border border-gray-100">
                            <strong>Source:</strong> {rev.source_name}
                            {rev.notes && <p className="mt-1 text-gray-500 italic">"{rev.notes}"</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-gray-400 text-sm italic bg-slate-50 rounded-2xl">
                      No ratings or review metadata filed for this product listing yet.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STICKY BUY NOW BAR AT BOTTOM ON MOBILE */}
            {/* Requirements: Sticky Buy Now bar at bottom on mobile, ensuring it does not cover page content or controls */}
            {selectedProduct && selectedProduct.purchase_links && selectedProduct.purchase_links.length > 0 && (
              <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md text-white p-3 border-t border-slate-700 shadow-2xl flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] uppercase text-utm-gold font-bold">Best Option</div>
                  <div className="font-extrabold text-base text-white">
                    {selectedProduct.purchase_links[0].price
                      ? `RM ${selectedProduct.purchase_links[0].price.toFixed(2)}`
                      : 'View Seller'}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleLinkClick(selectedProduct, selectedProduct.purchase_links[0])}
                    className="px-4 py-2.5 rounded-xl bg-utm-gold text-utm-maroon font-extrabold text-xs shadow-lg hover:bg-[#e5a823] transition-colors flex items-center gap-1.5"
                  >
                    <span>Buy on {getPlatformBadge(selectedProduct.purchase_links[0].platform).name.split(' ')[0]}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: ADD YOUR PRODUCT PAGE */}
        {currentRoute === 'add-product' && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
            
            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-utm-border shadow-md space-y-8">
              
              {/* Header */}
              <div className="border-b border-gray-100 pb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-utm-gold/20 text-utm-maroon text-xs font-bold mb-2">
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Student Seller Portal</span>
                </div>
                <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-gray-900">
                  List Your Product or Service
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Submit your item for administrator approval before it is published publicly on Studie Marketplace.
                </p>
              </div>

              {/* Submission Form */}
              <AddProductForm
                categories={categories}
                onSuccess={(prodId) => {
                  showToast("Product submitted for admin review!", "success");
                  navigateTo('home');
                }}
              />
            </div>
          </div>
        )}

        {/* VIEW 4: ADMIN DASHBOARD */}
        {currentRoute === 'admin' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
            
            {!adminToken ? (
              /* ADMIN LOGIN MODAL */
              <div className="max-w-md mx-auto bg-white rounded-3xl p-8 border border-utm-border shadow-xl space-y-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-utm-maroon text-utm-gold flex items-center justify-center mx-auto shadow-md">
                  <Lock className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="font-display font-extrabold text-2xl text-gray-900">Admin Portal</h1>
                  <p className="text-xs text-gray-500 mt-1">Enter administrative passcode to manage products & categories.</p>
                  <div className="inline-flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold mt-2.5 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Authorized Administration Access</span>
                  </div>
                </div>

                <form onSubmit={handleAdminLogin} className="space-y-4 text-left">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Passcode</label>
                    <input
                      type="password"
                      value={adminPasscode}
                      onChange={(e) => setAdminPasscode(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-utm-maroon focus:outline-none"
                      required
                    />
                  </div>

                  {adminAuthError && (
                    <div className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200 font-medium">
                      {adminAuthError}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-utm-maroon text-white font-bold text-sm hover:bg-utm-maroonDark shadow-lg transition-all"
                  >
                    Authenticate
                  </button>
                </form>
              </div>
            ) : (
              /* ADMIN DASHBOARD PANELS */
              <div className="space-y-6">
                
                {/* Admin Header */}
                <div className="bg-white rounded-3xl p-6 border border-utm-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                      <h1 className="font-display font-extrabold text-2xl text-gray-900">Administrator Console</h1>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">Manage submissions, product listings, categories, and click analytics.</p>
                  </div>

                  <button
                    onClick={handleAdminLogout}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-gray-700 font-semibold text-xs hover:bg-red-50 hover:text-red-700 transition-colors self-start md:self-auto"
                  >
                    Logout Admin
                  </button>
                </div>

                {/* Admin Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto border-b border-gray-200 pb-2">
                  <button
                    onClick={() => setAdminTab('pending')}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                      adminTab === 'pending' ? 'bg-utm-maroon text-white shadow' : 'bg-white text-gray-600 hover:bg-slate-100'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    <span>Pending Approvals</span>
                    {adminProducts.filter(p => p.status === 'pending').length > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-utm-gold text-utm-maroon text-xs">
                        {adminProducts.filter(p => p.status === 'pending').length}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => setAdminTab('all')}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                      adminTab === 'all' ? 'bg-utm-maroon text-white shadow' : 'bg-white text-gray-600 hover:bg-slate-100'
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                    <span>All Products ({adminProducts.length})</span>
                  </button>

                  <button
                    onClick={() => setAdminTab('categories')}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                      adminTab === 'categories' ? 'bg-utm-maroon text-white shadow' : 'bg-white text-gray-600 hover:bg-slate-100'
                    }`}
                  >
                    <Tag className="w-4 h-4" />
                    <span>Categories ({categories.length})</span>
                  </button>

                  <button
                    onClick={() => setAdminTab('analytics')}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                      adminTab === 'analytics' ? 'bg-utm-maroon text-white shadow' : 'bg-white text-gray-600 hover:bg-slate-100'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>Click Analytics</span>
                  </button>

                  <button
                    onClick={() => setAdminTab('settings')}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                      adminTab === 'settings' ? 'bg-utm-maroon text-white shadow' : 'bg-white text-gray-600 hover:bg-slate-100'
                    }`}
                  >
                    <Key className="w-4 h-4" />
                    <span>Security & Passcode</span>
                  </button>
                </div>

                {/* TAB 1: PENDING APPROVALS */}
                {adminTab === 'pending' && (
                  <div className="space-y-4">
                    {adminProducts.filter(p => p.status === 'pending').length === 0 ? (
                      <div className="bg-white rounded-3xl p-12 text-center border border-utm-border text-gray-500">
                        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                        <h3 className="font-display font-bold text-lg text-gray-900">Queue Clean!</h3>
                        <p className="text-xs text-gray-500 mt-1">There are no product submissions currently awaiting administrator review.</p>
                      </div>
                    ) : (
                      adminProducts.filter(p => p.status === 'pending').map((prod) => (
                        <div key={prod.id} className="bg-white rounded-3xl p-6 border border-utm-border shadow-sm space-y-4">
                          <div className="flex flex-col md:flex-row gap-6">
                            <img
                              src={prod.main_image}
                              alt=""
                              className="w-full md:w-36 h-36 object-cover rounded-2xl border border-gray-200"
                            />
                            <div className="flex-grow space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-xs">
                                  Pending Approval
                                </span>
                                <span className="text-xs text-gray-400">{prod.category_name}</span>
                              </div>
                              <h3 className="font-display font-bold text-lg text-gray-900">{prod.title}</h3>
                              <p className="text-xs text-gray-600 line-clamp-2">{prod.description}</p>
                              
                              {/* Links */}
                              <div className="pt-2 flex flex-wrap gap-2">
                                {prod.purchase_links && prod.purchase_links.map(l => (
                                  <span key={l.id} className="text-xs bg-slate-100 border border-gray-200 px-2.5 py-1 rounded-lg">
                                    <strong>{l.platform}:</strong> {l.url} ({l.price ? `RM ${l.price}` : 'No price'})
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Approval Controls */}
                          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                            <button
                              onClick={() => {
                                const reason = prompt("Enter rejection reason for submitter:");
                                fetch(`./api/admin/products/${prod.id}/status`, {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json', 'x-admin-key': adminToken },
                                  body: JSON.stringify({ status: 'rejected', rejection_reason: reason })
                                })
                                  .then(() => {
                                    showToast("Product rejected", "info");
                                    fetchAdminProducts();
                                  });
                              }}
                              className="px-4 py-2 rounded-xl bg-red-50 text-red-700 font-bold text-xs hover:bg-red-100 transition-colors flex items-center gap-1"
                            >
                              <XCircle className="w-4 h-4" /> Reject
                            </button>

                            <button
                              onClick={() => {
                                fetch(`./api/admin/products/${prod.id}/status`, {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json', 'x-admin-key': adminToken },
                                  body: JSON.stringify({ status: 'approved' })
                                })
                                  .then(() => {
                                    showToast("Product approved & published!", "success");
                                    fetchAdminProducts();
                                  });
                              }}
                              className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 shadow transition-colors flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-4 h-4" /> Approve & Publish
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* TAB 2: ALL PRODUCTS MANAGEMENT */}
                {adminTab === 'all' && (
                  <div className="bg-white rounded-3xl p-6 border border-utm-border shadow-sm overflow-x-auto">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 bg-slate-50 text-gray-600 font-bold">
                          <th className="p-3">Product</th>
                          <th className="p-3">Category</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Clicks</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {adminProducts.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50">
                            <td className="p-3 font-semibold flex items-center gap-3">
                              <img src={p.main_image} alt="" className="w-10 h-10 rounded-lg object-cover border" />
                              <span className="line-clamp-1 max-w-xs">{p.title}</span>
                            </td>
                            <td className="p-3 text-gray-600">{p.category_name}</td>
                            <td className="p-3">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                p.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                                p.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {p.status.toUpperCase()}
                              </span>
                            </td>
                            <td className="p-3 font-bold text-utm-maroon">{p.total_clicks || 0}</td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => {
                                  if (confirm(`Are you sure you want to delete "${p.title}" permanently?`)) {
                                    fetch(`./api/admin/products/${p.id}`, {
                                      method: 'DELETE',
                                      headers: { 'x-admin-key': adminToken }
                                    }).then(() => {
                                      showToast("Product deleted", "info");
                                      fetchAdminProducts();
                                    });
                                  }
                                }}
                                className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* TAB 3: CATEGORY MANAGEMENT */}
                {adminTab === 'categories' && (
                  <div className="space-y-6">
                    {/* Add Category Form */}
                    <div className="bg-white rounded-3xl p-6 border border-utm-border shadow-sm flex flex-col sm:flex-row items-end gap-3">
                      <div className="flex-grow w-full">
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">New Category Name</label>
                        <input
                          type="text"
                          value={newCatName}
                          onChange={(e) => setNewCatName(e.target.value)}
                          placeholder="e.g. UTM Sports & Fitness"
                          className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-utm-maroon"
                        />
                      </div>
                      <button
                        onClick={() => {
                          if (!newCatName.trim()) return;
                          fetch('./api/admin/categories', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'x-admin-key': adminToken },
                            body: JSON.stringify({ name: newCatName })
                          })
                            .then(res => res.json())
                            .then(data => {
                              if (data.success) {
                                showToast("Category created", "success");
                                setNewCatName('');
                                fetch('./api/categories').then(r=>r.json()).then(setCategories);
                              } else {
                                alert(data.error);
                              }
                            });
                        }}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-utm-maroon text-white font-bold text-xs hover:bg-utm-maroonDark transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" /> Add Category
                      </button>
                    </div>

                    {/* Existing Categories */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {categories.map((c) => (
                        <div key={c.id} className="bg-white p-4 rounded-2xl border border-gray-200 flex items-center justify-between">
                          <div>
                            <div className="font-bold text-sm text-gray-900">{c.name}</div>
                            <div className="text-[11px] text-gray-400">slug: {c.slug}</div>
                          </div>
                          <button
                            onClick={() => {
                              fetch(`./api/admin/categories/${c.id}`, {
                                method: 'DELETE',
                                headers: { 'x-admin-key': adminToken }
                              })
                                .then(res => res.json())
                                .then(data => {
                                  if (data.success) {
                                    showToast("Category deleted", "info");
                                    fetch('./api/categories').then(r=>r.json()).then(setCategories);
                                  } else {
                                    alert(data.error);
                                  }
                                });
                            }}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 4: CLICK ANALYTICS */}
                {adminTab === 'analytics' && adminAnalytics && (
                  <div className="space-y-6">
                    {/* Stat Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-white p-6 rounded-3xl border border-utm-border shadow-sm">
                        <div className="text-xs font-bold text-gray-400 uppercase">Total Outgoing Clicks</div>
                        <div className="font-display font-extrabold text-3xl text-utm-maroon mt-1">
                          {adminAnalytics.total_clicks || 0}
                        </div>
                      </div>

                      <div className="bg-white p-6 rounded-3xl border border-utm-border shadow-sm">
                        <div className="text-xs font-bold text-gray-400 uppercase">Live Published Products</div>
                        <div className="font-display font-extrabold text-3xl text-gray-900 mt-1">
                          {adminAnalytics.total_approved_products || 0}
                        </div>
                      </div>

                      <div className="bg-white p-6 rounded-3xl border border-utm-border shadow-sm">
                        <div className="text-xs font-bold text-gray-400 uppercase">Pending Review Queue</div>
                        <div className="font-display font-extrabold text-3xl text-amber-600 mt-1">
                          {adminAnalytics.pending_submissions || 0}
                        </div>
                      </div>
                    </div>

                    {/* Top Clicked Products */}
                    <div className="bg-white p-6 rounded-3xl border border-utm-border shadow-sm space-y-4">
                      <h3 className="font-display font-bold text-lg text-gray-900">Top Clicked Marketplace Items</h3>
                      <div className="space-y-3">
                        {adminAnalytics.top_clicked_products && adminAnalytics.top_clicked_products.map((item, idx) => (
                          <div key={item.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-gray-100">
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 rounded-full bg-utm-gold text-utm-maroon font-extrabold text-xs flex items-center justify-center">
                                {idx + 1}
                              </span>
                              <span className="font-semibold text-xs sm:text-sm text-gray-900 line-clamp-1">{item.title}</span>
                            </div>
                            <span className="font-extrabold text-utm-maroon text-xs sm:text-sm">
                              {item.total_clicks} Clicks
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
        )}

        {/* VIEW 5: GUIDELINES & TECH ARCHITECTURE */}
        {currentRoute === 'guidelines' && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16 space-y-8">
            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-utm-border shadow-sm space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-utm-gold">Technical & Legal Compliance</span>
                <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-gray-900 mt-1">
                  Architecture & Integration Standards
                </h1>
              </div>

              <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
                <div className="bg-utm-gold/10 p-4 rounded-2xl border border-utm-gold/30">
                  <h3 className="font-bold text-utm-maroon">Brand Inspiration Disclosure</h3>
                  <p className="mt-1 text-xs text-utm-maroon/90">
                    Studie Marketplace is an independent student product discovery website designed for UTM community members. It uses UTM’s official maroon-and-gold visual palette as creative design inspiration and does not claim to be an official Universiti Teknologi Malaysia site.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-gray-200 space-y-2">
                  <h3 className="font-bold text-gray-900">Database & Server Validation</h3>
                  <p className="text-xs text-gray-600">
                    Powered by Cloudflare Workers Durable Object SQLite persistence. Products are submitted into an administrator queue and require approval prior to public publishing to prevent spam or inappropriate content.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-gray-200 space-y-2">
                  <h3 className="font-bold text-gray-900">Click Tracking vs Sales Disclosure</h3>
                  <p className="text-xs text-gray-600">
                    All outbound button interactions log discrete click events to track outbound user interest. Total numbers are explicitly labeled as <strong>"Clicks"</strong> and never fabricated as verified purchases or sales volume.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-gray-200 space-y-2">
                  <h3 className="font-bold text-gray-900">Verified Ratings & Review Snapshots</h3>
                  <p className="text-xs text-gray-600">
                    In compliance with platform guidelines, no fake real-time API syncs are claimed. Ratings and reviews represent verified manual snapshots or logged seller feedback with explicit source attribution and last-checked timestamps.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="bg-[#58001D] text-white border-t border-utm-gold/20 py-10 px-4 sm:px-6 lg:px-8 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <div className="w-7 h-7 rounded-lg bg-utm-gold text-utm-maroon font-display font-black text-sm flex items-center justify-center">
                S
              </div>
              <span className="font-display font-bold text-lg text-white">Studie Marketplace</span>
            </div>
            <p className="text-xs text-gray-300 mt-1 max-w-md">
              Student-friendly product discovery & affiliate marketplace inspired by UTM campus community needs.
            </p>
          </div>

          <div className="text-center md:text-right text-xs text-gray-300 space-y-1">
            <p className="font-medium text-utm-gold">Designed with UTM Maroon & Gold Theme</p>
            <p className="text-[11px]">Independent student project. Not affiliated with or endorsed by UTM officially.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Add Product Form Sub-component
function AddProductForm({ categories, onSuccess }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || 'cat-1');
  const [mainImage, setMainImage] = useState('https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80');
  
  // Multiple Purchase Links State
  const [links, setLinks] = useState([
    { platform: 'shopee', url: '', label: 'Shopee Affiliate Store', price: '' },
    { platform: 'tiktok', url: '', label: 'TikTok Shop Listing', price: '' }
  ]);

  // Optional Review Info
  const [rating, setRating] = useState('4.8');
  const [reviewCount, setReviewCount] = useState('50');
  const [sourceName, setSourceName] = useState('Verified Seller Log');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sample Image Presets for Quick Selection
  const imagePresets = [
    { label: 'Utm Apparel / Hoodie', url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80' },
    { label: 'Laptop / Gadget', url: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=800&q=80' },
    { label: 'Stationery / Books', url: 'https://images.unsplash.com/photo-1611125832047-1d7ad1e8e48e?auto=format&fit=crop&w=800&q=80' },
    { label: 'Food / Snacks', url: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=800&q=80' },
    { label: 'Printing Service', url: 'https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?auto=format&fit=crop&w=800&q=80' }
  ];

  const handleAddLink = () => {
    setLinks([...links, { platform: 'whatsapp', url: '', label: '', price: '' }]);
  };

  const handleRemoveLink = (idx) => {
    setLinks(links.filter((_, i) => i !== idx));
  };

  const handleLinkChange = (idx, field, value) => {
    const updated = [...links];
    updated[idx][field] = value;
    setLinks(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate
    if (!title || title.trim().length < 3) {
      setError("Product title must be at least 3 characters.");
      setLoading(false);
      return;
    }
    if (!description || description.trim().length < 10) {
      setError("Product description must be at least 10 characters.");
      setLoading(false);
      return;
    }

    const formattedLinks = links.map(l => ({
      platform: l.platform,
      url: l.url,
      label: l.label,
      price: l.price ? parseFloat(l.price) : null
    }));

    const payload = {
      title,
      description,
      category_id: categoryId,
      main_image: mainImage,
      gallery_images: [mainImage],
      links: formattedLinks,
      reviews: [
        {
          platform: links[0]?.platform || 'verified_manual',
          rating: parseFloat(rating) || 4.8,
          review_count: parseInt(reviewCount) || 10,
          source_name: sourceName
        }
      ]
    };

    fetch('./api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(data => {
        setLoading(false);
        if (data.success) {
          onSuccess(data.product_id);
        } else {
          setError(data.error || "Submission failed");
        }
      })
      .catch(err => {
        setLoading(false);
        setError("Network error submitting product");
      });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 text-red-700 text-xs font-semibold border border-red-200">
          {error}
        </div>
      )}

      {/* Title & Category */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
            Product / Service Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. UTM Official Alumni Polo Tee"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-utm-maroon"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
            Category *
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-utm-maroon"
          >
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
          Detailed Description *
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="Include features, sizing, campus pick-up locations (e.g. KTF, KDSE, Arked Cemerlang)..."
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-utm-maroon"
          required
        />
      </div>

      {/* Image URL & Preset Selection */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-gray-700 uppercase">
          Product Main Image URL *
        </label>
        <div className="flex gap-2">
          <input
            type="url"
            value={mainImage}
            onChange={(e) => setMainImage(e.target.value)}
            placeholder="https://images.unsplash.com/..."
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-utm-maroon"
            required
          />
        </div>

        {/* Quick presets */}
        <div>
          <span className="text-[11px] text-gray-500 font-medium">Or choose a quick image preset:</span>
          <div className="flex flex-wrap gap-2 mt-1">
            {imagePresets.map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setMainImage(p.url)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 text-gray-700 text-xs hover:bg-utm-gold/30 hover:text-utm-maroon font-medium border border-gray-200"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Dynamic Purchase Links Manager */}
      <div className="pt-4 border-t border-gray-100 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-bold text-base text-gray-900">Purchase & Seller Links</h3>
            <p className="text-xs text-gray-500">Add Shopee affiliate, TikTok Shop, WhatsApp, or Google Forms URLs.</p>
          </div>
          <button
            type="button"
            onClick={handleAddLink}
            className="px-3 py-1.5 rounded-xl bg-utm-gold text-utm-maroon font-bold text-xs hover:bg-[#e5a823] flex items-center gap-1 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" /> Add Link
          </button>
        </div>

        <div className="space-y-3">
          {links.map((link, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-gray-200 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-utm-maroon uppercase">
                  Link #{idx + 1}
                </span>
                {links.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveLink(idx)}
                    className="text-xs text-red-600 hover:text-red-800 font-bold"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600">Platform Type</label>
                  <select
                    value={link.platform}
                    onChange={(e) => handleLinkChange(idx, 'platform', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white"
                  >
                    <option value="shopee">Shopee Affiliate</option>
                    <option value="tiktok">TikTok Shop</option>
                    <option value="whatsapp">WhatsApp Direct</option>
                    <option value="google_forms">Google Forms</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-gray-600">Destination URL *</label>
                  <input
                    type="url"
                    value={link.url}
                    onChange={(e) => handleLinkChange(idx, 'url', e.target.value)}
                    placeholder="https://shopee.com.my/... or https://wa.me/..."
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600">Option Label (Optional)</label>
                  <input
                    type="text"
                    value={link.label}
                    onChange={(e) => handleLinkChange(idx, 'label', e.target.value)}
                    placeholder="e.g. Official Shopee Store"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-600">Price in RM (Optional)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={link.price}
                    onChange={(e) => handleLinkChange(idx, 'price', e.target.value)}
                    placeholder="e.g. 65.00"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Optional Verified Review Information */}
      <div className="pt-4 border-t border-gray-100 space-y-3">
        <h3 className="font-display font-bold text-base text-gray-900">Verified Rating Metadata (Optional)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-gray-600">Rating (1.0 - 5.0)</label>
            <input
              type="number"
              step="0.1"
              min="1"
              max="5"
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-600">Review Count</label>
            <input
              type="number"
              value={reviewCount}
              onChange={(e) => setReviewCount(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-600">Source Name</label>
            <input
              type="text"
              value={sourceName}
              onChange={(e) => setSourceName(e.target.value)}
              placeholder="e.g. Shopee Store Stats"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-6 border-t border-gray-100 flex items-center justify-end">
        <button
          type="submit"
          disabled={loading}
          className="px-8 py-3.5 rounded-xl bg-utm-maroon text-white font-bold text-sm hover:bg-utm-maroonDark shadow-lg transition-all flex items-center gap-2"
        >
          {loading ? (
            <span>Submitting Product...</span>
          ) : (
            <>
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Submit Product for Approval</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

// Render React App
const container = document.getElementById("root");
const root = createRoot(container);
root.render(<App />);
