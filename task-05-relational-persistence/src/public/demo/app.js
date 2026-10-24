const elements = {
  apiStatus: document.getElementById("apiStatus"),
  productCount: document.getElementById("productCount"),
  stockCount: document.getElementById("stockCount"),
  catalog: document.getElementById("catalog")
};

function productCard(product) {
  const article = document.createElement("article");
  article.className = "product";
  const name = document.createElement("strong");
  const price = document.createElement("strong");
  const meta = document.createElement("span");
  const stock = document.createElement("span");
  name.textContent = product.name;
  price.className = "price";
  price.textContent = `$${product.price}`;
  meta.textContent = `${product.category.toUpperCase()} · ${product.sku}`;
  stock.className = "stock";
  stock.textContent = `${product.stock} in stock`;
  article.append(name, price, meta, stock);
  return article;
}

async function loadEvidence() {
  try {
    const [healthResponse, productsResponse] = await Promise.all([
      fetch("/health"),
      fetch("/api/products?take=5&active=true")
    ]);
    if (!healthResponse.ok || !productsResponse.ok) throw new Error("The API did not return a successful response.");
    const health = await healthResponse.json();
    const products = await productsResponse.json();
    elements.apiStatus.textContent = health.status;
    elements.productCount.textContent = String(products.pagination.total);
    elements.stockCount.textContent = String(products.items.filter((product) => product.stock > 0).length);
    elements.catalog.replaceChildren(...products.items.map(productCard));
  } catch {
    elements.apiStatus.textContent = "OFFLINE";
    elements.catalog.innerHTML = '<div class="loading">Start the API and seed the database to load live evidence.</div>';
  }
}

void loadEvidence();
