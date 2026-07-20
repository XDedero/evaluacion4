import React, { useState, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

// Hash SHA-256 de la contraseña "evaluacionfinal"
const PASSWORD_HASH = 'e3582e71541675b5a4e093723285104564fd5d83d1c570e277daba1250c96ace';

// Función para calcular SHA-256 en el navegador
async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Plantilla de especificaciones para cada categoría
const specTemplates = {
  'Notebooks': [
    'Procesador',
    'RAM',
    'Almacenamiento',
    'Pantalla',
    'Sistema Operativo',
    'Peso',
  ],
  'Routers': [
    'Estándar Wi-Fi',
    'Bandas',
    'Velocidad',
    'Puertos Ethernet',
    'Procesador',
    'Memoria',
  ],
  'Switches': [
    'Puertos',
    'Velocidad',
    'Tipo',
    'VLANs',
    'PoE',
    'Montaje',
  ],
  'Access Points': [
    'Estándar Wi-Fi',
    'Bandas',
    'Velocidad',
    'Antenas',
    'Alimentación',
    'Gestión',
  ],
  'Impresoras': [
    'Tecnología',
    'Velocidad',
    'Resolución',
    'Conectividad',
    'Funciones',
    'Rendimiento / Ciclo Mensual',
  ],
  'Sensores IoT': [
    'Tipo',
    'Mediciones',
    'Rango / Alcance',
    'Precisión',
    'Conectividad',
    'Batería / Alimentación',
  ],
  'Kits Arduino': [
    'Microcontrolador',
    'Voltaje',
    'Pines digitales',
    'Pines analógicos',
    'Memoria',
    'Incluye',
  ],
  'Cámaras de Vigilancia': [
    'Resolución',
    'Sensor',
    'Visión nocturna',
    'Conectividad',
    'Protección',
    'Compresión / Almacenamiento',
  ],
  'Cable de Red': [
    'Categoría',
    'Longitud',
    'Blindaje',
    'Calibre',
    'Ancho de banda',
    'Velocidad',
  ],
};

// Obtener valores por defecto vacíos para una categoría
function getDefaultSpecs(category) {
  const labels = specTemplates[category] || [];
  return labels.map(label => ({ label, value: '' }));
}

export default function CrudProductos({ products, setProducts, categories, trash, setTrash, orderCounts, onOrderPlaced }) {
  // Estado de autenticación con sessionStorage (persiste al recargar pero no al cerrar pestaña)
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('adminAuth') === 'true';
  });
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [orders, setOrders] = useLocalStorage('crudOrders', []);

  const [name, setName] = useState('');
  const [stock, setStock] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [specs, setSpecs] = useState([]);

  // Order form state
  const [orderProductId, setOrderProductId] = useState('');
  const [orderQuantity, setOrderQuantity] = useState('');

  const resetForm = () => {
    setName('');
    setStock('');
    setSelectedCategory('');
    setSpecs([]);
    setEditingId(null);
  };

  // Manejar login
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      const hash = await sha256(authPassword);
      if (hash === PASSWORD_HASH) {
        setIsAuthenticated(true);
        sessionStorage.setItem('adminAuth', 'true');
        setAuthPassword('');
      } else {
        setAuthError('Contraseña incorrecta. Inténtalo de nuevo.');
      }
    } catch {
      setAuthError('Error al verificar la contraseña.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Cerrar sesión
  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('adminAuth');
    setAuthPassword('');
    setAuthError('');
  };

  // Cuando cambia la categoría (nuevo producto), cargar template de specs
  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat);
    if (!editingId) {
      // Solo reiniciar specs si no estamos editando
      setSpecs(getDefaultSpecs(cat));
    } else {
      // Si estamos editando, preservar specs actuales pero si no tiene, cargar default
      const labels = specTemplates[cat] || [];
      if (labels.length > 0) {
        setSpecs(labels.map(label => {
          const existing = specs.find(s => s.label === label);
          return existing || { label, value: '' };
        }));
      }
    }
  };

  const handleSpecChange = (index, value) => {
    const updated = [...specs];
    updated[index] = { ...updated[index], value };
    setSpecs(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      alert('Debes iniciar sesión para realizar esta operación.');
      return;
    }

    if (!name.trim() || !stock.trim()) {
      alert('Completa todos los campos.');
      return;
    }
    if (!selectedCategory) {
      alert('Selecciona una categoría para el producto.');
      return;
    }

    const stockNum = parseInt(stock, 10);
    if (isNaN(stockNum) || stockNum < 0) {
      alert('El stock debe ser un número válido (0 o mayor).');
      return;
    }

    // Filtrar specs vacías
    const validSpecs = specs.filter(s => s.value.trim() !== '');

    if (editingId) {
      setProducts(products.map(p =>
        p.id === editingId
          ? { ...p, name: name.trim(), stock: stockNum, category: selectedCategory, specs: validSpecs }
          : p
      ));
      alert('Producto actualizado con éxito');
    } else {
      const newProduct = {
        id: Date.now(),
        name: name.trim(),
        stock: stockNum,
        category: selectedCategory,
        specs: validSpecs,
        images: ['img1', 'img2', 'img3'],
      };
      setProducts([...products, newProduct]);
      alert('Producto agregado al catálogo');
    }

    resetForm();
  };

  const handleEdit = (product) => {
    if (!isAuthenticated) {
      alert('Debes iniciar sesión para editar productos.');
      return;
    }

    setEditingId(product.id);
    setName(product.name);
    setStock(product.stock != null ? product.stock.toString() : '0');
    setSelectedCategory(product.category || '');

    // Cargar specs del producto o usar template de la categoría
    const labels = specTemplates[product.category] || [];
    if (product.specs && product.specs.length > 0) {
      // Mapear labels con valores existentes
      setSpecs(labels.map(label => {
        const existing = product.specs.find(s => s.label === label);
        return existing || { label, value: '' };
      }));
    } else {
      setSpecs(getDefaultSpecs(product.category));
    }

    document.getElementById('crud-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCancel = () => {
    resetForm();
  };

  const handleDelete = (product) => {
    if (!isAuthenticated) {
      alert('Debes iniciar sesión para eliminar productos.');
      return;
    }

    if (window.confirm(`¿Mover "${product.name}" a la papelera de reciclaje?`)) {
      setProducts(products.filter(p => p.id !== product.id));
      setTrash([...trash, { ...product, deletedAt: new Date().toLocaleString('es-CL', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
      }) }]);
    }
  };

  const handleRestoreFromTrash = (id) => {
    if (!isAuthenticated) {
      alert('Debes iniciar sesión para restaurar productos.');
      return;
    }

    const item = trash.find(t => String(t.id) === String(id));
    if (!item) return;
    const { deletedAt, ...product } = item;
    setProducts([...products, product]);
    setTrash(trash.filter(t => String(t.id) !== String(id)));
  };

  const handleDeletePermanently = (id) => {
    if (!isAuthenticated) {
      alert('Debes iniciar sesión para eliminar productos permanentemente.');
      return;
    }

    const item = trash.find(t => String(t.id) === String(id));
    if (!item) return;
    if (window.confirm(`¿Eliminar permanentemente "${item.name}"? Esta acción no se puede deshacer.`)) {
      setTrash(trash.filter(t => String(t.id) !== String(id)));
      setOrders(orders.filter(o => String(o.productId) !== String(id)));
    }
  };

  const handleEmptyTrash = () => {
    if (!isAuthenticated) {
      alert('Debes iniciar sesión para vaciar la papelera.');
      return;
    }

    if (trash.length === 0) return;
    if (window.confirm(`¿Vaciar toda la papelera? Se eliminarán ${trash.length} producto(s) permanentemente.`)) {
      setTrash([]);
    }
  };

  const handleDeleteOrder = (orderId) => {
    if (!isAuthenticated) {
      alert('Debes iniciar sesión para eliminar pedidos.');
      return;
    }

    const order = orders.find(o => String(o.id) === String(orderId));
    if (!order) return;

    if (window.confirm(`¿Eliminar el pedido de ${order.quantity} x "${order.productName}"? Se restaurará el stock.`)) {
      setProducts(products.map(p =>
        String(p.id) === String(order.productId)
          ? { ...p, stock: p.stock + order.quantity }
          : p
      ));
      setOrders(orders.filter(o => String(o.id) !== String(orderId)));
    }
  };

  const handleOrderSubmit = (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      alert('Debes iniciar sesión para realizar pedidos.');
      return;
    }

    if (!orderProductId || !orderQuantity.trim()) {
      alert('Selecciona un producto e ingresa una cantidad.');
      return;
    }

    const quantity = parseInt(orderQuantity, 10);
    if (isNaN(quantity) || quantity <= 0) {
      alert('La cantidad debe ser un número mayor a 0.');
      return;
    }

    const product = products.find(p => String(p.id) === String(orderProductId));
    if (!product) {
      alert('Producto no encontrado.');
      return;
    }

    if (quantity > product.stock) {
      alert(`Stock insuficiente. Solo hay ${product.stock} unidades disponibles.`);
      return;
    }

    setProducts(products.map(p =>
      String(p.id) === String(orderProductId)
        ? { ...p, stock: p.stock - quantity }
        : p
    ));

    // Incrementar contador de pedidos del producto (cookie)
    if (onOrderPlaced) {
      onOrderPlaced(product.id);
    }

    const now = new Date();
    const newOrder = {
      id: Date.now(),
      productId: product.id,
      productName: product.name,
      quantity: quantity,
      timestamp: now.toLocaleString('es-CL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    };

    setOrders([newOrder, ...orders]);
    setOrderProductId('');
    setOrderQuantity('');
    alert(`Pedido realizado: ${quantity} x ${product.name}`);
  };

  const filteredProducts = searchTerm.trim()
    ? products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.trim().toLowerCase())
      )
    : products;

  return (
    <section className="crud-section" id="crud">
      <div className="crud-container">
        <h2 className="crud-title">Panel de Administración</h2>

        {/* Formulario de autenticación */}
        {!isAuthenticated ? (
          <div className="auth-container">
            <div className="auth-form">
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#1e3a5f" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
              <h3 style={{ textAlign: 'center', marginBottom: '6px', color: '#1e3a5f' }}>
                Acceso Restringido
              </h3>
              <p style={{ textAlign: 'center', marginBottom: '20px', color: '#6b7280', fontSize: '14px' }}>
                Ingresa la contraseña para acceder al panel de administración.
              </p>
              {authError && (
                <div style={{
                  background: '#fee2e2',
                  border: '1px solid #fca5a5',
                  color: '#dc2626',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  fontSize: '14px',
                }}>
                  {authError}
                </div>
              )}
              <form onSubmit={handleLogin}>
                <div className="form-group">
                  <label htmlFor="admin-password">Contraseña</label>
                  <input
                    type="password"
                    id="admin-password"
                    required
                    placeholder="Ingresa la contraseña de administrador"
                    value={authPassword}
                    onChange={(e) => { setAuthPassword(e.target.value); setAuthError(''); }}
                    autoFocus
                  />
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn-primary" disabled={authLoading}>
                    {authLoading ? 'Verificando...' : 'Ingresar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <>
            {/* Barra de estado de sesión */}
            <div style={{
              background: '#d1fae5',
              border: '1px solid #6ee7b7',
              color: '#065f46',
              padding: '10px 16px',
              borderRadius: '8px',
              marginBottom: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '14px',
            }}>
              <span>✅ Sesión iniciada correctamente. Puedes administrar los productos.</span>
              <button
                type="button"
                onClick={handleLogout}
                style={{
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                Cerrar Sesión
              </button>
            </div>

            {/* Formulario de registro/edición de producto */}
            <form id="crud-form" onSubmit={handleSubmit} className="crud-form">
              <div className="form-grid form-grid-three">
                <div className="form-group">
                  <label htmlFor="product-name">Nombre del Producto</label>
                  <input
                    type="text"
                    id="product-name"
                    required
                    placeholder="Ej: Router TP-Link Archer"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="product-stock">Stock</label>
                  <input
                    type="number"
                    id="product-stock"
                    required
                    min="0"
                    placeholder="Ej: 10"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="product-category">Categoría</label>
                  <select
                    id="product-category"
                    required
                    value={selectedCategory}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="order-select"
                  >
                    <option value="">-- Selecciona --</option>
                    {categories.map((cat) => (
                      <option key={cat.category} value={cat.category}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Campos dinámicos de especificaciones según categoría */}
              {specs.length > 0 && (
                <div className="specs-section">
                  <h4 className="specs-heading">Especificaciones Técnicas</h4>
                  <div className="specs-grid">
                    {specs.map((spec, index) => (
                      <div className="form-group" key={spec.label}>
                        <label>{spec.label}</label>
                        <input
                          type="text"
                          placeholder={`Ej: ${spec.label}`}
                          value={spec.value}
                          onChange={(e) => handleSpecChange(index, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  {editingId ? 'Actualizar Producto' : 'Agregar al Catálogo'}
                </button>
                {editingId && (
                  <button type="button" onClick={handleCancel} className="btn-secondary">
                    Cancelar Edición
                  </button>
                )}
              </div>
            </form>

            <hr className="crud-divider" />

            {/* Búsqueda de productos */}
            <div className="search-bar-container">
              <label htmlFor="crud-search" className="search-label">
                Buscar Producto del Catálogo
              </label>
              <input
                id="crud-search"
                type="text"
                placeholder="Buscar por nombre (ej: Cable de Red UTP Cat6 100 metros)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            {/* Inventario */}
            <h3 className="crud-subtitle">Inventario del Catálogo</h3>
            <div className="table-responsive">
              <table className="crud-table">
                <thead>
                  <tr>
                    <th>Nombre del Equipo</th>
                    <th>Categoría</th>
                    <th>Stock</th>
                    <th>Pedidos</th>
                    <th className="text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', color: '#9ca3af' }}>
                        {searchTerm.trim()
                          ? 'No se encontraron productos con ese nombre.'
                          : 'No hay productos registrados.'}
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => (
                      <tr key={product.id}>
                        <td>{product.name}</td>
                        <td>{product.category || '—'}</td>
                        <td>
                          <span className={product.stock === 0 ? 'stock-zero' : 'stock-ok'}>
                            {product.stock}
                          </span>
                        </td>
                        <td>
                          {orderCounts && orderCounts[product.id]
                            ? <span style={{ color: '#f97316', fontWeight: 'bold' }}>🔥 {orderCounts[product.id]}</span>
                            : <span style={{ color: '#9ca3af' }}>0</span>
                          }
                        </td>
                        <td className="text-center">
                          <button className="btn-edit" onClick={() => handleEdit(product)}>
                            Editar
                          </button>
                          <button className="btn-delete" onClick={() => handleDelete(product)}>
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <hr className="crud-divider" />

            {/* Formulario de pedidos */}
            <h3 className="crud-subtitle">Realizar Pedido</h3>
            <form onSubmit={handleOrderSubmit} className="crud-form">
              <div className="form-grid order-grid">
                <div className="form-group">
                  <label htmlFor="order-product">Producto</label>
                  <select
                    id="order-product"
                    required
                    value={orderProductId}
                    onChange={(e) => setOrderProductId(e.target.value)}
                    className="order-select"
                  >
                    <option value="">-- Selecciona un producto --</option>
                    {products
                      .filter(p => p.stock > 0)
                      .map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Stock: {p.stock})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="order-quantity">Cantidad a Pedir</label>
                  <input
                    type="number"
                    id="order-quantity"
                    required
                    min="1"
                    placeholder="Ej: 3"
                    value={orderQuantity}
                    onChange={(e) => setOrderQuantity(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-order">
                  Realizar Pedido
                </button>
              </div>
            </form>

            <hr className="crud-divider" />

            {/* Historial de pedidos */}
            <h3 className="crud-subtitle">Historial de Pedidos</h3>
            <div className="table-responsive">
              <table className="crud-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Fecha y Hora</th>
                    <th className="text-center">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', color: '#9ca3af' }}>
                        No hay pedidos registrados.
                      </td>
                    </tr>
                  ) : (
                    orders.map((order) => (
                      <tr key={order.id}>
                        <td>{order.productName}</td>
                        <td>{order.quantity}</td>
                        <td>{order.timestamp}</td>
                        <td className="text-center">
                          <button
                            className="btn-delete"
                            onClick={() => handleDeleteOrder(order.id)}
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <hr className="crud-divider" />

            {/* Papelera de reciclaje */}
            <h3 className="crud-subtitle" id="papelera">
              🗑️ Papelera de Reciclaje
            </h3>
            {trash.length > 0 && (
              <div className="form-actions" style={{ marginBottom: '15px' }}>
                <button
                  type="button"
                  className="btn-delete"
                  onClick={handleEmptyTrash}
                >
                  Vaciar Papelera ({trash.length})
                </button>
              </div>
            )}
            <div className="table-responsive">
              <table className="crud-table">
                <thead>
                  <tr>
                    <th>Nombre del Equipo</th>
                    <th>Categoría</th>
                    <th>Stock</th>
                    <th>Eliminado el</th>
                    <th className="text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {trash.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', color: '#9ca3af' }}>
                        La papelera está vacía.
                      </td>
                    </tr>
                  ) : (
                    trash.map((item) => (
                      <tr key={item.id}>
                        <td>{item.name}</td>
                        <td>{item.category || '—'}</td>
                        <td>{item.stock}</td>
                        <td>{item.deletedAt}</td>
                        <td className="text-center">
                          <button
                            className="btn-edit"
                            onClick={() => handleRestoreFromTrash(item.id)}
                          >
                            Restaurar
                          </button>
                          <button
                            className="btn-delete"
                            onClick={() => handleDeletePermanently(item.id)}
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </section>
  );
}