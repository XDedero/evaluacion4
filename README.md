# PCfacts - Portal de equipamiento tecnológico

Aplicación web para la gestión de un catálogo de equipos tecnológicos. Permite visualizar productos por categoría, buscar por nombre, administrar el inventario mediante un panel CRUD protegido con contraseña, gestionar una papelera de reciclaje y realizar pedidos con control de stock.

---

## 1) FUNCIONAMIENTO DE LA PÁGINA

### 1.1 Navegación por categorías

En el nav se encuentra el botón **Categoria** que despliega un menú con las categorías de productos. Al hacer clic en una categoría se filtran los productos correspondientes y se muestran en la página principal.

El menú de categorías se define en el array `componentsMenu` y la función `goToCategory` abre una nueva pestaña con el parámetro `categoria` en la URL, que luego es leído por `getCategoryFromURL` para establecer la categoría activa:

```jsx
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

const goToCategory = (category) => {
  window.open('/?categoria=' + encodeURIComponent(category), '_blank')
}
```

### 1.2 Barra de búsqueda

En el centro del nav se encuentra una barra de búsqueda que permite buscar productos por nombre o categoría. Al escribir, se filtran los productos que contienen el texto ingresado mediante un `useMemo` que recalcula los resultados de forma eficiente:

```jsx
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
```

### 1.3 Barra de navegación

En la barra nav se encuentran los enlaces: **Inicio**, **Productos**, **CRUD**, **Papelera** y **Contacto**. Los enlaces CRUD y Papelera dirigen al panel de administración que se encuentra más abajo en la misma página.

---

## 2) PANEL DE ADMINISTRACIÓN (CRUD) Y PAPELERA

### 2.1 Creación de productos

El formulario de creación permite ingresar nombre, stock y categoría. Al seleccionar una categoría se despliega un menú de especificaciones técnicas específico para esa categoría (cada categoría tiene sus propios campos técnicos universales). El administrador ingresa los valores correspondientes a cada especificación.

**Especificaciones técnicas por categoría (`specTemplates`):**

```jsx
const specTemplates = {
  'Notebooks': ['Procesador', 'RAM', 'Almacenamiento', 'Pantalla', 'Sistema Operativo', 'Peso'],
  'Routers': ['Estándar Wi-Fi', 'Bandas', 'Velocidad', 'Puertos Ethernet', 'Procesador', 'Memoria'],
  'Switches': ['Puertos', 'Velocidad', 'Tipo', 'VLANs', 'PoE', 'Montaje'],
  'Access Points': ['Estándar Wi-Fi', 'Bandas', 'Velocidad', 'Antenas', 'Alimentación', 'Gestión'],
  'Impresoras': ['Tecnología', 'Velocidad', 'Resolución', 'Conectividad', 'Funciones', 'Rendimiento / Ciclo Mensual'],
  'Sensores IoT': ['Tipo', 'Mediciones', 'Rango / Alcance', 'Precisión', 'Conectividad', 'Batería / Alimentación'],
  'Kits Arduino': ['Microcontrolador', 'Voltaje', 'Pines digitales', 'Pines analógicos', 'Memoria', 'Incluye'],
  'Cámaras de Vigilancia': ['Resolución', 'Sensor', 'Visión nocturna', 'Conectividad', 'Protección', 'Compresión / Almacenamiento'],
  'Cable de Red': ['Categoría', 'Longitud', 'Blindaje', 'Calibre', 'Ancho de banda', 'Velocidad'],
};
```

**Creación del producto (`handleSubmit`):**

```jsx
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

  const validSpecs = specs.filter(s => s.value.trim() !== '');

  if (editingId) {
    setProducts(products.map(p =>
      p.id === editingId
        ? { ...p, name: name.trim(), stock: stockNum, category: selectedCategory, specs: validSpecs }
        : p
    ));
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
  }

  resetForm();
};
```

### 2.2 Edición de productos

Al hacer clic en **Editar** en un producto del inventario, se carga el formulario con los datos del producto seleccionado, permitiendo modificar cualquier campo:

```jsx
const handleEdit = (product) => {
  setEditingId(product.id);
  setName(product.name);
  setStock(product.stock != null ? product.stock.toString() : '0');
  setSelectedCategory(product.category || '');

  const labels = specTemplates[product.category] || [];
  if (product.specs && product.specs.length > 0) {
    setSpecs(labels.map(label => {
      const existing = product.specs.find(s => s.label === label);
      return existing || { label, value: '' };
    }));
  } else {
    setSpecs(getDefaultSpecs(product.category));
  }

  document.getElementById('crud-form')?.scrollIntoView({ behavior: 'smooth' });
};
```

### 2.3 Eliminación de productos y papelera de reciclaje

Al hacer clic en **Eliminar**, el producto se mueve a la papelera de reciclaje en lugar de eliminarse permanentemente. La papelera se almacena en **localStorage** para persistir los datos incluso al recargar la página.

**Mover producto a la papelera:**

```jsx
const handleDelete = (product) => {
  if (window.confirm(`¿Mover "${product.name}" a la papelera de reciclaje?`)) {
    setProducts(products.filter(p => p.id !== product.id));
    setTrash([...trash, { ...product, deletedAt: new Date().toLocaleString('es-CL', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    }) }]);
  }
};
```

**Persistencia de la papelera en localStorage:**

```jsx
// Carga inicial desde localStorage
const [trash, setTrash] = useState(() => {
  const saved = localStorage.getItem('trashProducts');
  return saved ? JSON.parse(saved) : [];
})

// Sincronización automática: cada cambio en trash se guarda en localStorage
useEffect(() => {
  localStorage.setItem('trashProducts', JSON.stringify(trash))
}, [trash])
```

**Restaurar producto desde la papelera:**

```jsx
const handleRestoreFromTrash = (id) => {
  const item = trash.find(t => String(t.id) === String(id));
  if (!item) return;
  const { deletedAt, ...product } = item;
  setProducts([...products, product]);
  setTrash(trash.filter(t => String(t.id) !== String(id)));
};
```

**Eliminar permanentemente:**

```jsx
const handleDeletePermanently = (id) => {
  const item = trash.find(t => String(t.id) === String(id));
  if (!item) return;
  if (window.confirm(`¿Eliminar permanentemente "${item.name}"? Esta acción no se puede deshacer.`)) {
    setTrash(trash.filter(t => String(t.id) !== String(id)));
    setOrders(orders.filter(o => String(o.productId) !== String(id)));
  }
};
```

---

## 3) MODAL DE DETALLES DEL PRODUCTO

Al hacer clic en cualquier producto del catálogo se despliega una ventana modal con las especificaciones técnicas del equipo. El modal se controla mediante el estado `selectedProduct`:

```jsx
const [selectedProduct, setSelectedProduct] = useState(null)

const openProductModal = (product) => {
  setSelectedProduct(product)
}

const closeProductModal = () => {
  setSelectedProduct(null)
}
```

El modal (`ProductDetailModal`) recibe el producto como prop y muestra un carrusel de imágenes (placeholder), categoría, nombre, stock disponible y una tabla de especificaciones técnicas.

---

## 4) AUTENTICACIÓN CON CONTRASEÑA HASHEADA

El panel de administración está protegido con autenticación. La contraseña `evaluacionfinal` se almacena de forma segura mediante **hash SHA-256**, tanto en el servidor como en la validación del cliente.

**Hash SHA-256 de la contraseña:**
```
e3582e71541675b5a4e093723285104564fd5d83d1c570e277daba1250c96ace
```

**Almacenamiento seguro en archivo JSON (`data/admin.json`):**

```json
{
  "passwordHash": "e3582e71541675b5a4e093723285104564fd5d83d1c570e277daba1250c96ace"
}
```

**Verificación de contraseña en el frontend:**

```jsx
const PASSWORD_HASH = 'e3582e71541675b5a4e093723285104564fd5d83d1c570e277daba1250c96ace';

async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const handleLogin = async (e) => {
  e.preventDefault();
  setAuthLoading(true);

  try {
    const hash = await sha256(authPassword);
    if (hash === PASSWORD_HASH) {
      setIsAuthenticated(true);
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
```

**Endpoint de autenticación en el servidor (`server.cjs`):**

```js
app.post('/api/auth', (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ success: false, message: 'Contraseña requerida.' });
  }

  const admin = readJson(adminPath);
  const hash = crypto.createHash('sha256').update(password).digest('hex');

  if (hash === admin.passwordHash) {
    return res.json({ success: true, message: 'Autenticación exitosa.' });
  } else {
    return res.status(401).json({ success: false, message: 'Contraseña incorrecta.' });
  }
});
```

**Contraseña para pruebas:** `evaluacionfinal`

---

## 5) SISTEMA DE PEDIDOS

### 5.1 Validación de stock

Antes de realizar un pedido, se valida que la cantidad solicitada no supere el stock disponible del producto:

```jsx
const product = products.find(p => String(p.id) === String(orderProductId));
if (!product) {
  alert('Producto no encontrado.');
  return;
}

if (quantity > product.stock) {
  alert(`Stock insuficiente. Solo hay ${product.stock} unidades disponibles.`);
  return;
}
```

### 5.2 Actualización de stock al realizar el pedido

Al confirmar el pedido, se descuenta la cantidad del stock del producto:

```jsx
setProducts(products.map(p =>
  String(p.id) === String(orderProductId)
    ? { ...p, stock: p.stock - quantity }
    : p
));
```

### 5.3 Almacenamiento en el historial de pedidos

El pedido se registra en el historial con fecha, hora, producto y cantidad:

```jsx
const newOrder = {
  id: Date.now(),
  productId: product.id,
  productName: product.name,
  quantity: quantity,
  timestamp: now.toLocaleString('es-CL', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }),
};

setOrders([newOrder, ...orders]);
```

El historial de pedidos también se persiste en **localStorage** mediante la clave `crudOrders`:

```jsx
const [orders, setOrders] = useState(() => {
  const saved = localStorage.getItem('crudOrders');
  return saved ? JSON.parse(saved) : [];
});

useEffect(() => {
  localStorage.setItem('crudOrders', JSON.stringify(orders));
}, [orders]);
```

### 5.4 Actualización de stock al eliminar el pedido

Si se elimina un pedido del historial, la cantidad pedida se reintegra al stock:

```jsx
const handleDeleteOrder = (orderId) => {
  const order = orders.find(o => String(o.id) === String(orderId));
  if (!order) return;

  setProducts(products.map(p =>
    String(p.id) === String(order.productId)
      ? { ...p, stock: p.stock + order.quantity }
      : p
  ));
  setOrders(orders.filter(o => String(o.id) !== String(orderId)));
};
```

---

## 6) OPTIMIZACIONES Y FUNCIONALIDADES ADICIONALES

### 6.1 `useMemo` para filtrado eficiente

El filtrado de productos (`filteredProducts`) utiliza `useMemo` para evitar recalcular la lista filtrada en cada renderizado. Solo se recalcula cuando cambian `products`, `searchValue` o `activeCategory`. Esto mejora el rendimiento al evitar filtrados innecesarios.

### 6.2 `useCallback` en el modal de producto

En el componente `ProductDetailModal`, las funciones de navegación del carrusel (`goToPrev` y `goToNext`) usan `useCallback` para mantener referencias estables y evitar re-renderizados del efecto de teclado (`useEffect` con `keydown`):

```jsx
const goToPrev = useCallback(() => {
  setCurrentImage((prev) => (prev === 0 ? images.length - 1 : prev - 1))
}, [images.length])

const goToNext = useCallback(() => {
  setCurrentImage((prev) => (prev === images.length - 1 ? 0 : prev + 1))
}, [images.length])

useEffect(() => {
  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      onClose()
    } else if (event.key === 'ArrowLeft') {
      goToPrev()
    } else if (event.key === 'ArrowRight') {
      goToNext()
    }
  }
  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}, [onClose, goToPrev, goToNext])
```

Esto permite navegar por las imágenes del producto usando las teclas de flecha (`←` `→`) y cerrar el modal con `Escape`.

### 6.3 `useEffect` para scroll al inicio

Al cargar la página o hacer clic en "Inicio", se usa un `useEffect` con `window.scrollTo` para garantizar que la página comience en el tope (`#inicio`) y no en la sección CRUD:

```jsx
useEffect(() => {
  window.scrollTo(0, 0);
}, []);
```

### 6.4 Persistencia del catálogo en `localStorage`

Los productos del catálogo principal también se persisten en `localStorage` bajo la clave `catalogProducts`. Esto permite que los productos agregados mediante el CRUD se mantengan al recargar la página:

```jsx
const [products, setProducts] = useState(() => {
  const saved = localStorage.getItem('catalogProducts');
  return saved ? JSON.parse(saved) : [];
})

useEffect(() => {
  if (!loading) {
    localStorage.setItem('catalogProducts', JSON.stringify(products))
  }
}, [products, loading])
```

### 6.5 Resumen de almacenamiento en el navegador

| Clave de localStorage | Contenido | Uso |
|---|---|---|
| `catalogProducts` | Lista completa de productos | Persistir catálogo tras operaciones CRUD |
| `trashProducts` | Productos eliminados | Papelera de reciclaje |
| `crudOrders` | Historial de pedidos | Mantener registro de préstamos de equipos |