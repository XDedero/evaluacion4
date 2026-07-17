import { useEffect, useMemo, useState } from 'react'
import './App.css'
import ProductDetailModal from './components/ProductDetailModal'
import CrudProductos from './components/CrudProductos';

const componentsMenu = [
  { label: 'Notebooks', category: 'Notebooks' },
  { label: 'Routers', category: 'Routers' },
  { label: 'Switches', category: 'Switches' },
  { label: 'Access Points', category: 'Access Points' },
  { label: 'Impresoras', category: 'Impresoras' },
  { label: 'Sensores IoT', category: 'Sensores IoT' },
  { label: 'Kits Arduino', category: 'Kits Arduino' },
  { label: 'Cámaras de Vigilancia', category: 'Cámaras de Vigilancia' },
  { label: 'Cable de Red', category: 'Cable de Red' },
]

function getCategoryFromURL() {
  const params = new URLSearchParams(window.location.search)
  return params.get('categoria') || ''
}

function App() {
  const [isNavOpen, setIsNavOpen] = useState(false)
  const [isComponentsOpen, setIsComponentsOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('catalogProducts');
    return saved ? JSON.parse(saved) : [];
  })
  const [trash, setTrash] = useState(() => {
    const saved = localStorage.getItem('trashProducts');
    return saved ? JSON.parse(saved) : [];
  })
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [activeCategory, setActiveCategory] = useState(getCategoryFromURL)

  useEffect(() => {
    const loadProducts = async () => {
      // Si ya hay productos en localStorage, no recargar del servidor
      const saved = localStorage.getItem('catalogProducts');
      if (saved && JSON.parse(saved).length > 0) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/products')
        if (!response.ok) {
          throw new Error('No se pudieron cargar los productos.')
        }
        const data = await response.json()
        setProducts(data)
        localStorage.setItem('catalogProducts', JSON.stringify(data))
      } catch (error) {
        try {
          const fallbackResponse = await fetch('/products.json')
          const fallbackData = await fallbackResponse.json()
          setProducts(fallbackData)
          localStorage.setItem('catalogProducts', JSON.stringify(fallbackData))
        } catch {
          setMessage('No se pudieron cargar los productos.')
        }
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [])

  // Persistir productos y papelera a localStorage cada vez que cambien
  useEffect(() => {
    if (!loading) {
      localStorage.setItem('catalogProducts', JSON.stringify(products))
    }
  }, [products, loading])

  useEffect(() => {
    localStorage.setItem('trashProducts', JSON.stringify(trash))
  }, [trash])

  const filteredProducts = useMemo(() => {
    let result = products

    if (activeCategory) {
      result = result.filter(
        (product) => product.category === activeCategory,
      )
    }

    const query = searchValue.trim().toLowerCase()
    if (!query) return result
    return result.filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query),
    )
  }, [products, searchValue, activeCategory])

  const closeMenus = () => {
    setIsNavOpen(false)
    setIsComponentsOpen(false)
  }

  const openProductModal = (product) => {
    setSelectedProduct(product)
  }

  const closeProductModal = () => {
    setSelectedProduct(null)
  }

  const goToCategory = (category) => {
    window.open('/?categoria=' + encodeURIComponent(category), '_blank')
  }

  const clearCategory = () => {
    setActiveCategory('')
    window.history.replaceState(null, '', '/')
  }

  const heroTitle = activeCategory
    ? activeCategory
    : 'Encuentra los mejores equipos de red y tecnologia IoT'

  const heroDescription = activeCategory
    ? 'Mostrando productos de la categoria: ' + activeCategory
    : 'Bienvenido a PCfacts, tu portal de equipamiento tecnologico: notebooks, routers, switches, access points, impresoras, sensores IoT, kits Arduino y camaras de vigilancia.'

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" onClick={() => setActiveCategory('')}>
          <img src="logo.png" alt="Logo"
          width="85" height="70"></img>
        </a>

        <button
          type="button"
          className="nav-toggle"
          aria-label={isNavOpen ? 'Cerrar menu' : 'Abrir menu'}
          aria-expanded={isNavOpen}
          onClick={() => setIsNavOpen((current) => !current)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav className={`top-nav ${isNavOpen ? 'open' : ''}`}>
          <div className="nav-left">
            <div className={`nav-item dropdown ${isComponentsOpen ? 'open' : ''}`}>
              <button
                type="button"
                className="dropdown-toggle"
                aria-haspopup="true"
                aria-expanded={isComponentsOpen}
                onClick={() => setIsComponentsOpen((current) => !current)}
              >
                Categoria
              </button>
              <div className="dropdown-menu">
                {componentsMenu.map((item) => (
                  <button
                    key={item.category}
                    type="button"
                    className="dropdown-link"
                    onClick={() => {
                      closeMenus()
                      goToCategory(item.category)
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="nav-center">
            <form className="search-form" onSubmit={(event) => event.preventDefault()}>
              <label className="sr-only" htmlFor="search-input">
                Buscar productos
              </label>
              <input
                id="search-input"
                type="search"
                placeholder="Buscar productos..."
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
              />
            </form>
          </div>

          <div className="nav-right">
            <a href="/" onClick={() => { closeMenus(); setActiveCategory('') }}>
              Inicio
            </a>
            <a href="#productos" onClick={closeMenus}>
              Productos
            </a>
            <a href="#crud" onClick={closeMenus}>
              CRUD
            </a>
            <a href="#papelera" onClick={closeMenus}>
              Papelera
            </a>
            <a href="#contacto" onClick={closeMenus}>
              Contacto
            </a>
          </div>
        </nav>
      </header>

      <main className="page-content">
        <section className="hero" id="inicio">
          <h1>{heroTitle}</h1>
          <p>{heroDescription}</p>
          {activeCategory && (
            <button
              type="button"
              className="clear-category-btn"
              onClick={clearCategory}
            >
              Volver a todos los productos
            </button>
          )}
        </section>

        {message && <p className="status-message">{message}</p>}

        <section className="offer-section" id="productos">
          <div className="section-header">
            <div>
              <h2>Catalogo de productos</h2>
              <p>
                {activeCategory
                  ? 'Productos filtrados por: ' + activeCategory
                  : 'Explora nuestro catalogo de equipamiento tecnologico.'}
              </p>
            </div>
          </div>

          {loading && <p className="status-message">Cargando productos...</p>}

          {!loading && filteredProducts.length === 0 && (
            <p className="status-message">No se encontraron productos en esta categoria.</p>
          )}

          {activeCategory ? (
            <div className="offer-grid">
              {filteredProducts.map((product) => (
                <article
                  className="offer-card"
                  key={product.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openProductModal(product)}
                  onKeyDown={(e) => { if (e.key === 'Enter') openProductModal(product) }}
                >
                  <div className="offer-top">
                    <span className="badget">{product.category}</span>
                  </div>
                  <h3>{product.name}</h3>
                  <p className="card-note">Stock: {product.stock}</p>
                </article>
              ))}
            </div>
          ) : (
            componentsMenu.map(cat => {
              const catProducts = products.filter(p => p.category === cat.category);
              if (catProducts.length === 0) return null;
              return (
                <div key={cat.category} className="category-group">
                  <h3 className="category-group-title">{cat.label}</h3>
                  <div className="offer-grid">
                    {catProducts.map((product) => (
                      <article
                        className="offer-card"
                        key={product.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => openProductModal(product)}
                        onKeyDown={(e) => { if (e.key === 'Enter') openProductModal(product) }}
                      >
                        <div className="offer-top">
                          <span className="badget">{product.category}</span>
                        </div>
                        <h3>{product.name}</h3>
                        <p className="card-note">Stock: {product.stock}</p>
                      </article>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </section>
        <CrudProductos
          products={products}
          setProducts={setProducts}
          categories={componentsMenu}
          trash={trash}
          setTrash={setTrash}
        />
        <section className="info-section" id="contacto">
          <h2>Contacto</h2>
          <p>
            Si tienes alguna pregunta o necesitas asistencia, no dudes en contactarnos a traves de nuestro correo electronico: <a href="mailto:info@tienda.com">info@pcfacts.com</a>
          </p>
        </section>
      </main>

      {selectedProduct && (
        <ProductDetailModal product={selectedProduct} onClose={closeProductModal} />
      )}
    </div>
  )
}

export default App