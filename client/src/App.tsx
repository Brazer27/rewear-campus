import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';

type ProductCondition = 'Like New' | 'Good' | 'Fair';
type Category = 'Atasan' | 'Outerwear' | 'Tas' | 'Aksesori' | 'Sepatu';

type Product = {
  id: number;
  name: string;
  category: Category;
  description: string;
  price: number;
  condition: ProductCondition;
  seller_name: string;
  created_at: string;
};

type ProductForm = {
  name: string;
  category: Category;
  description: string;
  price: string;
  condition: ProductCondition;
  sellerName: string;
};

const initialForm: ProductForm = {
  name: '',
  category: 'Atasan',
  description: '',
  price: '',
  condition: 'Good',
  sellerName: ''
};

const categoryDetails: Record<Category, { icon: string; className: string }> = {
  Atasan: { icon: '✳', className: 'art-top' },
  Outerwear: { icon: '◈', className: 'art-outerwear' },
  Tas: { icon: '▱', className: 'art-bag' },
  Aksesori: { icon: '✧', className: 'art-accessory' },
  Sepatu: { icon: '⌁', className: 'art-shoes' }
};

const formatRupiah = (amount: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount);

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<ProductForm>(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeCategory, setActiveCategory] = useState('Semua');

  async function loadProducts() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error('Produk belum dapat dimuat. Coba muat ulang halaman.');
      const data: Product[] = await response.json();
      setProducts(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Terjadi kesalahan saat memuat produk.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProducts();
  }, []);

  const categories = useMemo(
    () => ['Semua', ...Array.from(new Set(products.map((product) => product.category)))],
    [products]
  );

  const visibleProducts = useMemo(
    () => activeCategory === 'Semua'
      ? products
      : products.filter((product) => product.category === activeCategory),
    [products, activeCategory]
  );

  function updateForm<K extends keyof ProductForm>(key: K, value: ProductForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, price: Number(form.price) })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Produk gagal ditambahkan.');

      setProducts((current) => [result.product as Product, ...current]);
      setForm(initialForm);
      setSuccess('Produk berhasil ditambahkan dan tersimpan di PostgreSQL.');
      setActiveCategory('Semua');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Terjadi kesalahan saat menyimpan produk.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="ReWear Campus home">
          <span className="brand-mark">R</span>
          <span>rewear<span className="brand-light">campus</span></span>
        </a>
        <nav className="header-nav" aria-label="Navigasi utama">
          <a href="#catalog">Jelajahi</a>
          <a href="#sell">Jual barang</a>
        </nav>
        <a className="header-cta" href="#sell">Mulai menjual <span>↗</span></a>
      </header>

      <main id="top">
        <section className="hero-section">
          <div className="hero-copy">
            <span className="eyebrow"><span className="eyebrow-dot" /> CAMPUS PRELOVED MARKETPLACE</span>
            <h1>Good finds.<br /><em>Better</em> futures.</h1>
            <p className="hero-description">
              Temukan fashion preloved favoritmu, atau beri kesempatan kedua untuk barang yang sudah tidak kamu pakai.
            </p>
            <div className="hero-actions">
              <a className="button button-dark" href="#catalog">Jelajahi barang <span>↓</span></a>
              <a className="text-link" href="#sell">Jual barangmu <span>↗</span></a>
            </div>
            <div className="hero-footnote">
              <span className="mini-avatar-stack"><i>R</i><i>N</i><i>A</i></span>
              <span>Made for students, shared by students.</span>
            </div>
          </div>
          <div className="hero-art" aria-label="Ilustrasi fashion preloved">
            <div className="hero-orbit orbit-one" />
            <div className="hero-orbit orbit-two" />
            <div className="hero-sticker sticker-top">PRE-LOVED<br />PRE-LOVED</div>
            <div className="hero-garment">
              <div className="garment-neck" />
              <div className="garment-pocket" />
              <div className="garment-seam" />
            </div>
            <div className="hero-tag"><span>01 / 03</span><strong>Second life,<br />same style.</strong></div>
            <div className="hero-sticker sticker-bottom">REUSE<br />REPEAT ✳</div>
          </div>
        </section>

        <section className="value-strip" aria-label="Keunggulan ReWear Campus">
          <div><span className="value-icon">↗</span><span><strong>Affordable finds</strong><small>Harga ramah mahasiswa</small></span></div>
          <div><span className="value-icon">✳</span><span><strong>Give it a new life</strong><small>Kurangi limbah fashion</small></span></div>
          <div><span className="value-icon">⌂</span><span><strong>Campus community</strong><small>Dari mahasiswa, untuk mahasiswa</small></span></div>
        </section>

        <section className="catalog-section" id="catalog">
          <div className="section-heading">
            <div>
              <span className="eyebrow">THE CAMPUS CLOSET</span>
              <h2>Freshly <em>reworn.</em></h2>
              <p>Barang preloved yang masih punya banyak cerita.</p>
            </div>
            <span className="product-count">{products.length.toString().padStart(2, '0')} ITEMS</span>
          </div>

          <div className="catalog-toolbar">
            <div className="category-tabs" aria-label="Filter kategori">
              {categories.map((category) => (
                <button
                  className={activeCategory === category ? 'category-tab active' : 'category-tab'}
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  type="button"
                >
                  {category}
                </button>
              ))}
            </div>
            <span className="sort-label">CURATED FOR CAMPUS LIFE</span>
          </div>

          {error && <div className="notice notice-error" role="alert">{error}</div>}
          {success && <div className="notice notice-success" role="status">{success}</div>}

          {loading ? (
            <div className="empty-state">Sedang memuat koleksi...</div>
          ) : visibleProducts.length === 0 ? (
            <div className="empty-state">Belum ada produk dalam kategori ini. Jadilah yang pertama menjual!</div>
          ) : (
            <div className="product-grid">
              {visibleProducts.map((product, index) => {
                const art = categoryDetails[product.category] || categoryDetails.Atasan;
                return (
                  <article className="product-card" key={product.id}>
                    <div className={`product-art ${art.className}`}>
                      <span className="art-index">RW / {String(index + 1).padStart(2, '0')}</span>
                      <span className="art-symbol">{art.icon}</span>
                      <span className="art-caption">SECOND<br />LIFE GOODS</span>
                      <span className="condition-pill">{product.condition}</span>
                    </div>
                    <div className="product-info">
                      <div className="product-meta"><span>{product.category}</span><span>by {product.seller_name}</span></div>
                      <h3>{product.name}</h3>
                      <p>{product.description || 'Preloved item, ready for a new story.'}</p>
                      <div className="product-bottom">
                        <strong>{formatRupiah(product.price)}</strong>
                        <span className="product-arrow">↗</span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="sell-section" id="sell">
          <div className="sell-intro">
            <span className="eyebrow eyebrow-light">PASS IT ON</span>
            <h2>Your closet.<br /><em>Someone's</em> new favorite.</h2>
            <p>Punya barang yang masih bagus tapi jarang dipakai? Tambahkan ke ReWear Campus dan temukan pemilik barunya.</p>
            <div className="sell-note"><span>✳</span> Small steps, more sustainable style.</div>
          </div>
          <form className="sell-form" onSubmit={handleSubmit}>
            <div className="form-heading"><span>01 — NEW LISTING</span><strong>List an item</strong></div>
            <label>
              Nama produk
              <input
                maxLength={120}
                onChange={(event) => updateForm('name', event.target.value)}
                placeholder="Contoh: Vintage Denim Jacket"
                required
                value={form.name}
              />
            </label>
            <div className="form-row">
              <label>
                Kategori
                <select onChange={(event) => updateForm('category', event.target.value as Category)} value={form.category}>
                  <option>Atasan</option><option>Outerwear</option><option>Tas</option><option>Aksesori</option><option>Sepatu</option>
                </select>
              </label>
              <label>
                Harga (Rp)
                <input
                  min="1"
                  onChange={(event) => updateForm('price', event.target.value)}
                  placeholder="85000"
                  required
                  type="number"
                  value={form.price}
                />
              </label>
            </div>
            <div className="form-row">
              <label>
                Kondisi
                <select onChange={(event) => updateForm('condition', event.target.value as ProductCondition)} value={form.condition}>
                  <option value="Like New">Like New</option><option value="Good">Good</option><option value="Fair">Fair</option>
                </select>
              </label>
              <label>
                Nama penjual
                <input
                  maxLength={80}
                  onChange={(event) => updateForm('sellerName', event.target.value)}
                  placeholder="Nama kamu"
                  required
                  value={form.sellerName}
                />
              </label>
            </div>
            <label>
              Deskripsi
              <textarea
                maxLength={1000}
                onChange={(event) => updateForm('description', event.target.value)}
                placeholder="Ceritakan sedikit tentang barang ini..."
                rows={3}
                value={form.description}
              />
            </label>
            <button className="button button-lime submit-button" disabled={submitting} type="submit">
              {submitting ? 'Menyimpan...' : 'Publikasikan produk'} <span>↗</span>
            </button>
            <p className="form-disclaimer">Dengan mempublikasikan, produk akan langsung ditampilkan pada katalog demo ini.</p>
          </form>
        </section>
      </main>

      <footer className="site-footer">
        <a className="brand brand-footer" href="#top"><span className="brand-mark">R</span><span>rewear<span className="brand-light">campus</span></span></a>
        <span>GIVE FASHION A SECOND LIFE.</span>
        <span>BUILT FOR CAMPUS COMMUNITY · 2026</span>
      </footer>
    </div>
  );
}

export default App;
