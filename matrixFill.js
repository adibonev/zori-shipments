const EXCHANGE_RATE = 0.92;

class ShipmentManager {
  constructor() {
    this.loadData();
    this.productIndex = 1;
  }

  loadData() {
    try {
      const shipmentsData = localStorage.getItem('shipments');
      this.shipments = shipmentsData ? JSON.parse(shipmentsData) : [];
      if (!Array.isArray(this.shipments)) this.shipments = [];
    } catch (e) {
      this.shipments = [];
    }
  }

  init() {
    this.setupEventListeners();
    this.render();
  }

  setupEventListeners() {
    const addBtn = document.getElementById('addShipmentBtn');
    const addProductBtn = document.getElementById('addProductBtn');
    const dateInput = document.getElementById('shipmentDate');

    if (addBtn) {
      addBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.addShipment();
      });
    }

    if (addProductBtn) {
      addProductBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.addProductField();
      });
    }

    if (dateInput) {
      dateInput.valueAsDate = new Date();
    }

    this.attachProductListeners();
  }

  attachProductListeners() {
    document.querySelectorAll('.productCost').forEach(input => {
      input.addEventListener('input', (e) => this.updateProductConversion(e.target));
    });

    document.querySelectorAll('.currency').forEach(select => {
      select.addEventListener('change', (e) => {
        const index = e.target.dataset.index;
        const costInput = document.querySelector(`.productCost[data-index="${index}"]`);
        if (costInput) this.updateProductConversion(costInput);
      });
    });

    document.querySelectorAll('.productSellPrice').forEach(input => {
      input.addEventListener('input', (e) => this.updateProductProfit(e.target));
    });

    document.querySelectorAll('.isSold').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => this.toggleSoldSection(e.target));
    });

    document.querySelectorAll('.btn-remove-product').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.removeProductField(e.target.dataset.index);
      });
    });
  }

  toggleSoldSection(checkbox) {
    const index = checkbox.dataset.index;
    const soldSection = document.querySelector(`.sold-section[data-index="${index}"]`);
    const sellPriceInput = document.querySelector(`.productSellPrice[data-index="${index}"]`);

    if (checkbox.checked) {
      if (soldSection) soldSection.style.display = '';
      if (sellPriceInput) sellPriceInput.setAttribute('required', 'required');
    } else {
      if (soldSection) soldSection.style.display = 'none';
      if (sellPriceInput) {
        sellPriceInput.removeAttribute('required');
        sellPriceInput.value = '';
        const profitInput = document.querySelector(`.productProfit[data-index="${index}"]`);
        if (profitInput) profitInput.value = '';
      }
    }
    this.updateTotals();
  }

  addProductField() {
    const container = document.getElementById('productsContainer');
    const newIndex = this.productIndex;
    this.productIndex++;

    const productItem = document.createElement('div');
    productItem.className = 'product-item';
    productItem.id = `product_${newIndex}`;
    productItem.innerHTML = `
      <h4>Продукт ${newIndex + 1}</h4>
      <div class="form-row">
        <div class="form-group">
          <label>Описание:</label>
          <input type="text" class="productName" data-index="${newIndex}" placeholder="Описание на продукта" required>
        </div>
        <div class="form-group">
          <label>Размер:</label>
          <select class="productSize" data-index="${newIndex}" required>
            <option value="">Избери размер</option>
            <option value="XS">XS</option>
            <option value="S">S</option>
            <option value="M">M</option>
            <option value="L">L</option>
            <option value="XL">XL</option>
            <option value="XXL">XXL</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Валута:</label>
          <select class="currency" data-index="${newIndex}" required>
            <option value="EUR">€ Евро</option>
            <option value="USD">$ Долар</option>
          </select>
        </div>
        <div class="form-group">
          <label>Цена на продукта:</label>
          <input type="number" class="productCost" data-index="${newIndex}" step="0.01" min="0" required>
        </div>
        <div class="form-group">
          <label>В евро:</label>
          <input type="number" class="convertedCost" data-index="${newIndex}" step="0.01" min="0" readonly>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group checkbox-group">
          <label>
            <input type="checkbox" class="isSold" data-index="${newIndex}" checked>
            Продаден ли е продуктът?
          </label>
        </div>
      </div>
      <div class="form-row sold-section" data-index="${newIndex}">
        <div class="form-group">
          <label>Цена продажба (€):</label>
          <input type="number" class="productSellPrice" data-index="${newIndex}" step="0.01" min="0" required>
        </div>
        <div class="form-group">
          <label>Печалба/Загуба (€):</label>
          <input type="number" class="productProfit" data-index="${newIndex}" step="0.01" readonly style="background: #f0f0f0;">
        </div>
      </div>
      <button type="button" class="btn-remove-product" data-index="${newIndex}">Премахни продукт</button>
    `;

    container.appendChild(productItem);
    document.querySelectorAll('.btn-remove-product').forEach(btn => btn.style.display = 'block');
    this.attachProductListeners();
  }

  removeProductField(index) {
    const productItem = document.getElementById(`product_${index}`);
    if (productItem) {
      productItem.remove();
      this.updateTotals();
    }
    const items = document.querySelectorAll('.product-item');
    if (items.length === 1) {
      document.querySelectorAll('.btn-remove-product').forEach(btn => btn.style.display = 'none');
    }
  }

  updateProductConversion(costInput) {
    if (!costInput) return;
    const index = costInput.dataset.index;
    const currencySelect = document.querySelector(`.currency[data-index="${index}"]`);
    const currency = currencySelect ? currencySelect.value : 'EUR';
    const productCost = parseFloat(costInput.value) || 0;
    const convertedInput = document.querySelector(`.convertedCost[data-index="${index}"]`);

    let convertedPrice = productCost;
    if (currency === 'USD') {
      convertedPrice = productCost * EXCHANGE_RATE;
    }

    if (convertedInput) convertedInput.value = convertedPrice.toFixed(2);

    const sellPriceInput = document.querySelector(`.productSellPrice[data-index="${index}"]`);
    if (sellPriceInput) this.updateProductProfit(sellPriceInput);
    this.updateTotals();
  }

  updateProductProfit(sellPriceInput) {
    if (!sellPriceInput) return;
    const index = sellPriceInput.dataset.index;
    const convertedCostInput = document.querySelector(`.convertedCost[data-index="${index}"]`);
    const convertedCost = convertedCostInput ? parseFloat(convertedCostInput.value) || 0 : 0;
    const sellPrice = parseFloat(sellPriceInput.value) || 0;
    const profitInput = document.querySelector(`.productProfit[data-index="${index}"]`);

    if (profitInput) profitInput.value = (sellPrice - convertedCost).toFixed(2);
    this.updateTotals();
  }

  updateTotals() {
    let totalProductCost = 0;
    let totalSellPrice = 0;

    document.querySelectorAll('.product-item').forEach(item => {
      const isSoldCheckbox = item.querySelector('.isSold');
      const isSold = isSoldCheckbox ? isSoldCheckbox.checked : true;
      const costInput = item.querySelector('.convertedCost');
      const sellPriceInput = item.querySelector('.productSellPrice');

      totalProductCost += costInput ? parseFloat(costInput.value) || 0 : 0;
      if (isSold) totalSellPrice += sellPriceInput ? parseFloat(sellPriceInput.value) || 0 : 0;
    });

    const totalProductInput = document.getElementById('totalProductCost');
    const totalSellInput = document.getElementById('totalSellPrice');
    if (totalProductInput) totalProductInput.value = totalProductCost.toFixed(2);
    if (totalSellInput) totalSellInput.value = totalSellPrice.toFixed(2);
  }

  addShipment() {
    const date = document.getElementById('shipmentDate').value;
    const transportCost = parseFloat(document.getElementById('transportCost').value) || 0;
    const products = [];

    document.querySelectorAll('.product-item').forEach((item) => {
      const name = item.querySelector('.productName')?.value.trim() || '';
      const size = item.querySelector('.productSize')?.value || '';
      const cost = parseFloat(item.querySelector('.convertedCost')?.value) || 0;
      const isSold = item.querySelector('.isSold')?.checked ?? true;
      const sellPrice = parseFloat(item.querySelector('.productSellPrice')?.value) || 0;

      if (name && size && cost > 0) {
        products.push({
          id: Date.now() + Math.random(),
          name, size, cost, isSold,
          sellPrice: isSold ? sellPrice : 0,
          profit: isSold ? sellPrice - cost : 0
        });
      }
    });

    if (!date) { alert('Моля попълнете датата!'); return; }
    if (products.length === 0) { alert('Моля добавете поне един продукт!'); return; }

    const totalProductCost = products.reduce((sum, p) => sum + p.cost, 0);
    const totalSellPrice = products.filter(p => p.isSold).reduce((sum, p) => sum + p.sellPrice, 0);

    this.shipments.push({
      id: Date.now(),
      date, products, transportCost, totalProductCost, totalSellPrice,
      totalCost: totalProductCost + transportCost,
      profit: totalSellPrice - (totalProductCost + transportCost)
    });

    this.save();
    this.clearForm();
    this.render();
    alert('✅ Пратка добавена!');
  }

  markProductAsSold(shipmentId, productId, sellPrice) {
    if (!sellPrice || sellPrice <= 0) { alert('Въведете валидна цена!'); return; }

    const shipment = this.shipments.find(s => s.id === shipmentId);
    const product = shipment?.products.find(p => p.id === productId);
    if (!product) { alert('Продуктът не е намерен!'); return; }

    product.isSold = true;
    product.sellPrice = sellPrice;
    product.profit = sellPrice - product.cost;

    shipment.totalSellPrice = shipment.products.filter(p => p.isSold).reduce((sum, p) => sum + p.sellPrice, 0);
    shipment.profit = shipment.totalSellPrice - shipment.totalCost;

    this.save();
    this.render();
    alert('✅ Продуктът е продаден!');
  }

  deleteShipment(id) {
    if (confirm('Изтриване на пратката?')) {
      this.shipments = this.shipments.filter(s => s.id !== id);
      this.save();
      this.render();
    }
  }

  deleteProduct(shipmentId, productId) {
    if (confirm('Изтриване на продукта?')) {
      const shipment = this.shipments.find(s => s.id === shipmentId);
      if (shipment) {
        shipment.products = shipment.products.filter(p => p.id !== productId);
        if (shipment.products.length === 0) {
          this.shipments = this.shipments.filter(s => s.id !== shipmentId);
        } else {
          shipment.totalProductCost = shipment.products.reduce((sum, p) => sum + p.cost, 0);
          shipment.totalCost = shipment.totalProductCost + shipment.transportCost;
          shipment.totalSellPrice = shipment.products.filter(p => p.isSold).reduce((sum, p) => sum + p.sellPrice, 0);
          shipment.profit = shipment.totalSellPrice - shipment.totalCost;
        }
        this.save();
        this.render();
      }
    }
  }

  save() {
    localStorage.setItem('shipments', JSON.stringify(this.shipments));
  }

  clearForm() {
    document.getElementById('shipmentForm').reset();
    document.getElementById('shipmentDate').valueAsDate = new Date();
    document.getElementById('totalProductCost').value = '';
    document.getElementById('totalSellPrice').value = '';
    document.getElementById('productsContainer').innerHTML = `
      <div class="product-item" id="product_0">
        <h4>Продукт 1</h4>
        <div class="form-row"><div class="form-group"><label>Описание:</label><input type="text" class="productName" data-index="0" placeholder="Описание" required></div><div class="form-group"><label>Размер:</label><select class="productSize" data-index="0" required><option value="">Избери</option><option value="XS">XS</option><option value="S">S</option><option value="M">M</option><option value="L">L</option><option value="XL">XL</option><option value="XXL">XXL</option></select></div></div>
        <div class="form-row"><div class="form-group"><label>Валута:</label><select class="currency" data-index="0" required><option value="EUR">€ Евро</option><option value="USD">$ Долар</option></select></div><div class="form-group"><label>Цена:</label><input type="number" class="productCost" data-index="0" step="0.01" min="0" required></div><div class="form-group"><label>В евро:</label><input type="number" class="convertedCost" data-index="0" step="0.01" readonly></div></div>
        <div class="form-row"><div class="form-group checkbox-group"><label><input type="checkbox" class="isSold" data-index="0" checked> Продаден?</label></div></div>
        <div class="form-row sold-section" data-index="0"><div class="form-group"><label>Продажба (€):</label><input type="number" class="productSellPrice" data-index="0" step="0.01" min="0" required></div><div class="form-group"><label>Печалба:</label><input type="number" class="productProfit" data-index="0" readonly style="background:#f0f0f0;"></div></div>
        <button type="button" class="btn-remove-product" data-index="0" style="display:none;">Премахни</button>
      </div>`;
    this.productIndex = 1;
    this.attachProductListeners();
  }

  render() {
    this.renderShipments();
    this.renderOverview();
  }

  renderShipments() {
    const container = document.getElementById('shipmentsContainer');
    if (!container) return;
    if (this.shipments.length === 0) { container.innerHTML = '<p style="text-align:center;color:#999;">Нямате пратки</p>'; return; }

    container.innerHTML = this.shipments.map(s => {
      const sold = (s.products || []).filter(p => p.isSold);
      const unsold = (s.products || []).filter(p => !p.isSold);
      return `<div class="shipment-card">
        <h3>Пратка от ${new Date(s.date).toLocaleDateString('bg-BG')}</h3>
        ${sold.length ? `<div class="products-list sold-products"><strong>✅ Продадени (${sold.length}):</strong>${sold.map(p => `<div class="product-row"><p>• ${p.name} (${p.size}) - ${(p.cost||0).toFixed(2)}€ → ${(p.sellPrice||0).toFixed(2)}€ <span class="${(p.profit||0)>=0?'profit-positive':'profit-negative'}">(${(p.profit||0).toFixed(2)}€)</span></p><button onclick="manager.deleteProduct(${s.id},${p.id})" class="btn-delete-small">✕</button></div>`).join('')}</div>` : ''}
        ${unsold.length ? `<div class="products-list unsold-products-list"><strong>⏳ Несолд (${unsold.length}):</strong>${unsold.map(p => `<div class="unsold-product-row"><p>• ${p.name} (${p.size}) - ${(p.cost||0).toFixed(2)}€</p><div class="unsold-actions"><input type="number" id="sell_${s.id}_${p.id}" step="0.01" placeholder="Цена €"><button onclick="manager.markProductAsSold(${s.id},${p.id},parseFloat(document.getElementById('sell_${s.id}_${p.id}').value))" class="btn-mark-sold">Продай</button><button onclick="manager.deleteProduct(${s.id},${p.id})" class="btn-delete-small">✕</button></div></div>`).join('')}</div>` : ''}
        <div class="shipment-summary"><p><strong>Продукти:</strong> ${(s.totalProductCost||0).toFixed(2)}€</p><p><strong>Транспорт:</strong> ${(s.transportCost||0).toFixed(2)}€</p><p><strong>Продажба:</strong> ${(s.totalSellPrice||0).toFixed(2)}€</p><p class="profit ${(s.profit||0)>=0?'positive':'negative'}"><strong>Печалба:</strong> ${(s.profit||0).toFixed(2)}€</p></div>
        <button class="delete-btn" onclick="manager.deleteShipment(${s.id})">Изтрий пратка</button>
      </div>`;
    }).join('');
  }

  renderOverview() {
    const totalCost = this.shipments.reduce((s, x) => s + (x.totalCost || 0), 0);
    const totalRevenue = this.shipments.reduce((s, x) => s + (x.totalSellPrice || 0), 0);
    const totalProfit = this.shipments.reduce((s, x) => s + (x.profit || 0), 0);
    let unsoldCount = 0;
    this.shipments.forEach(s => { unsoldCount += (s.products || []).filter(p => !p.isSold).length; });

    document.getElementById('totalCost').textContent = totalCost.toFixed(2);
    document.getElementById('totalRevenue').textContent = totalRevenue.toFixed(2);
    document.getElementById('totalProfit').textContent = totalProfit.toFixed(2);
    document.getElementById('shipmentCount').textContent = `${this.shipments.length} (${unsoldCount} несолд)`;
    this.updateCharts();
  }

  updateCharts() {
    const ctx1 = document.getElementById('profitChart');
    const ctx2 = document.getElementById('categoryChart');
    if (window.profitChart) window.profitChart.destroy();
    if (window.categoryChart) window.categoryChart.destroy();

    if (ctx1) {
      window.profitChart = new Chart(ctx1, {
        type: 'line',
        data: { labels: this.shipments.map(s => new Date(s.date).toLocaleDateString('bg-BG')), datasets: [{ label: 'Печалба (€)', data: this.shipments.map(s => s.profit || 0), borderColor: '#4CAF50', fill: true, backgroundColor: 'rgba(76,175,80,0.1)' }] },
        options: { responsive: true }
      });
    }

    if (ctx2) {
      const cost = this.shipments.reduce((s, x) => s + (x.totalCost || 0), 0);
      const profit = this.shipments.reduce((s, x) => s + (x.profit || 0), 0);
      window.categoryChart = new Chart(ctx2, {
        type: 'doughnut',
        data: { labels: ['Разходи', 'Печалба'], datasets: [{ data: [cost, Math.max(0, profit)], backgroundColor: ['#FF6384', '#36A2EB'] }] },
        options: { responsive: true }
      });
    }
  }
}

document.addEventListener('DOMContentLoaded', function() {
  window.manager = new ShipmentManager();
  manager.init();
});
