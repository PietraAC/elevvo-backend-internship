const queries = [
  'something warm and light for a snowy hike',
  'quiet headphones for a long flight',
  'a soft light for reading in bed at night',
  'help my sore muscles after a hard workout',
  'carry cold drinks and lunch to the beach'
];

const elements = Object.fromEntries([
  'searchForm', 'query', 'compareButton', 'queryChips', 'error', 'results', 'cacheBadge',
  'totalMs', 'embeddingMs', 'databaseMs', 'cacheMs', 'model', 'catalogVersion', 'cacheTtl',
  'coldBadge', 'warmBadge', 'coldTime', 'warmTime', 'serviceStatus'
].map((id) => [id, document.getElementById(id)]));

queries.forEach((query) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = query;
  button.addEventListener('click', () => {
    elements.query.value = query;
    void runSearch(query);
  });
  elements.queryChips.append(button);
});

function badge(element, status) {
  element.textContent = status;
  element.className = `badge ${status.toLowerCase()}`;
}

function setBusy(busy) {
  document.querySelectorAll('button').forEach((button) => { button.disabled = busy; });
  elements.results.classList.toggle('loading', busy);
}

function render(payload) {
  badge(elements.cacheBadge, payload.meta.cache.status);
  elements.totalMs.textContent = payload.meta.timing.totalMs.toFixed(1);
  elements.embeddingMs.textContent = payload.meta.timing.embeddingMs.toFixed(1);
  elements.databaseMs.textContent = payload.meta.timing.databaseMs.toFixed(1);
  elements.cacheMs.textContent = payload.meta.timing.cacheMs.toFixed(1);
  elements.model.textContent = payload.meta.model;
  elements.catalogVersion.textContent = payload.meta.catalogVersion;
  elements.cacheTtl.textContent = `${payload.meta.cache.ttlRemainingSeconds ?? payload.meta.cache.ttlSeconds}s`;
  elements.results.replaceChildren(...payload.data.map((product, index) => {
    const article = document.createElement('article');
    article.className = 'result';
    article.innerHTML = `
      <span class="rank">${index + 1}</span>
      <div><h3 class="product-name"></h3><p class="product-meta"></p></div>
      <div class="score"><strong>${Math.round(product.similarity * 100)}%</strong><small>similarity</small><div class="score-track"><i></i></div></div>`;
    article.querySelector('.product-name').textContent = product.name;
    article.querySelector('.product-meta').textContent = `${product.category} · $${product.price}`;
    article.querySelector('.score-track i').style.width = `${product.similarity * 100}%`;
    return article;
  }));
}

async function requestSearch(query) {
  const response = await fetch(`/api/products/search?q=${encodeURIComponent(query)}&limit=5`);
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error?.message ?? 'Search failed.');
  return payload;
}

async function runSearch(query) {
  elements.error.hidden = true;
  setBusy(true);
  try {
    const payload = await requestSearch(query);
    render(payload);
    return payload;
  } catch (error) {
    elements.error.textContent = error instanceof Error ? error.message : 'Search failed.';
    elements.error.hidden = false;
  } finally {
    setBusy(false);
  }
}

elements.searchForm.addEventListener('submit', (event) => {
  event.preventDefault();
  void runSearch(elements.query.value);
});

elements.compareButton.addEventListener('click', async () => {
  elements.error.hidden = true;
  setBusy(true);
  try {
    const cold = await requestSearch(elements.query.value);
    const warm = await requestSearch(elements.query.value);
    badge(elements.coldBadge, cold.meta.cache.status);
    badge(elements.warmBadge, warm.meta.cache.status);
    elements.coldTime.textContent = `${cold.meta.timing.totalMs.toFixed(1)} ms`;
    elements.warmTime.textContent = `${warm.meta.timing.totalMs.toFixed(1)} ms`;
    render(warm);
  } catch (error) {
    elements.error.textContent = error instanceof Error ? error.message : 'Comparison failed.';
    elements.error.hidden = false;
  } finally {
    setBusy(false);
  }
});

fetch('/health/ready')
  .then((response) => response.json())
  .then((payload) => { elements.serviceStatus.textContent = payload.status; })
  .catch(() => { elements.serviceStatus.textContent = 'OFFLINE'; });

void runSearch(elements.query.value);
