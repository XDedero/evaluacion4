import React, { useState, useEffect } from 'react';

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

export default function CrudProductos({ products, setProducts, categories, trash, setTrash }) {
  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('crudOrders');
    return saved ? JSON.parse(saved) : [];
  });

  const [name, setName] = useState('');
  const [stock, setStock] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [specs, setSpecs] = useState([]);

  // Order form state
  const [orderProductId, setOrderProductId] = useState('');
  const [orderQuantity, setOrderQuantity] = useState('');

  useEffect(() => {
    localStorage.setItem('crudOrders', JSON.stringify(orders));
  }, [orders]);

  const resetForm = () => {
    setName('');
    setStock('');
    setSelectedCategory('');
    setSpecs([]);
    setEditingId(null);
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
    if (window.confirm(`¿Mover "${product.name}" a la papelera de reciclaje?`)) {
      setProducts(products.filter(p => p.id !== product.id));
      setTrash([...trash, { ...product, deletedAt: new Date().toLocaleString('es-CL', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
      }) }]);
    }
  };

  const handleRestoreFromTrash = (id) => {
    const item = trash.find(t => String(t.id) === String(id));
    if (!item) return;
    const { deletedAt, ...product } = item;
    setProducts([...products, product]);
    setTrash(trash.filter(t => String(t.id) !== String(id)));
  };

  const handleDeletePermanently = (id) => {
    const item = trash.find(t => String(t.id) === String(id));
    if (!item) return;
    if (window.confirm(`¿Eliminar permanentemente "${item.name}"? Esta acción no se puede deshacer.`)) {
      setTrash(trash.filter(t => String(t.id) !== String(id)));
      setOrders(orders.filter(o => String(o.productId) !== String(id)));
    }
  };

  const handleEmptyTrash = () => {
    if (trash.length === 0) return;
    if (window.confirm(`¿Vaciar toda la papelera? Se eliminarán ${trash.length} producto(s) permanentemente.`)) {
      setTrash([]);
    }
  };

  const handleDeleteOrder = (orderId) => {
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
                <th className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', color: '#9ca3af' }}>
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
      </div>
    </section>
  );
}