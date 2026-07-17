const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3001;

app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

const productsPath = path.join(__dirname, 'data', 'products.json');
const ordersPath = path.join(__dirname, 'data', 'orders.json');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

app.get('/api/products', (req, res) => {
  const products = readJson(productsPath);
  res.json(products);
});

app.post('/api/orders', (req, res) => {
  const orders = readJson(ordersPath);
  const newOrder = {
    id: Date.now(),
    items: req.body.items,
    total: req.body.total,
    createdAt: new Date().toISOString(),
  };

  orders.push(newOrder);
  writeJson(ordersPath, orders);
  res.status(201).json(newOrder);
});

app.put('/api/products', (req, res) => {
  writeJson(productsPath, req.body);
  res.json({ message: 'Productos actualizados' });
});

app.listen(port, () => {
  console.log(`API escuchando en http://localhost:${port}`);
});
