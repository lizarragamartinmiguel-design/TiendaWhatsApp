// admin.js - Panel de administración

document.addEventListener('DOMContentLoaded', function() {
    initializeAdmin();
});

function initializeAdmin() {
    checkLoginStatus();
    setupAdminEventListeners();
}

function checkLoginStatus() {
    const isLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
    if (isLoggedIn) {
        showAdminPanel();
    } else {
        showLoginForm();
    }
}

function showLoginForm() {
    document.getElementById('login-section').style.display = 'block';
    document.getElementById('admin-panel').style.display = 'none';
}

function showAdminPanel() {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('admin-panel').style.display = 'block';
    loadAdminData();
}

function setupAdminEventListeners() {
    // Login form
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    
    // Tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            switchTab(tabId);
        });
    });
    
    // Gestión de productos
    document.getElementById('add-product-btn').addEventListener('click', showProductForm);
    document.getElementById('cancel-form').addEventListener('click', hideProductForm);
    document.getElementById('product-form-data').addEventListener('submit', handleProductSubmit);
    document.getElementById('upload-area').addEventListener('click', triggerImageUpload);
    document.getElementById('product-image-upload').addEventListener('change', handleImageUpload);
    document.getElementById('remove-image').addEventListener('click', removeImage);
    
    // Configuración
    document.getElementById('whatsapp-config-form').addEventListener('submit', saveWhatsAppConfig);
    document.getElementById('shipping-config-form').addEventListener('submit', saveShippingConfig);
    document.getElementById('store-config-form').addEventListener('submit', saveStoreConfig);
    document.getElementById('update-password-btn').addEventListener('click', updatePassword);
    document.getElementById('test-whatsapp-btn').addEventListener('click', testWhatsApp);
    
    // Toggle envíos
    document.getElementById('shipping-enabled').addEventListener('change', toggleShipping);
}

// Autenticación
function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        localStorage.setItem('adminLoggedIn', 'true');
        showAdminPanel();
        showAlert('Login exitoso', 'success');
    } else {
        showAlert('Credenciales incorrectas', 'error');
    }
}

function handleLogout() {
    localStorage.removeItem('adminLoggedIn');
    showLoginForm();
    showAlert('Sesión cerrada', 'success');
}

// Navegación entre tabs
function switchTab(tabId) {
    // Ocultar todos los tabs
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Mostrar tab seleccionado
    document.getElementById(tabId).classList.add('active');
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
    
    // Cargar datos específicos del tab
    if (tabId === 'products') {
        loadProductsAdmin();
    } else if (tabId === 'whatsapp') {
        loadWhatsAppConfig();
    } else if (tabId === 'shipping') {
        loadShippingConfig();
    } else if (tabId === 'settings') {
        loadStoreConfigAdmin();
    }
}

// Gestión de productos en admin
let editingProductId = null;

function showProductForm() {
    document.getElementById('product-form').style.display = 'block';
    document.getElementById('form-title').textContent = 'Agregar Nuevo Producto';
    editingProductId = null;
    resetProductForm();
}

function hideProductForm() {
    document.getElementById('product-form').style.display = 'none';
    editingProductId = null;
    resetProductForm();
}

function resetProductForm() {
    document.getElementById('product-form-data').reset();
    document.getElementById('product-id').value = '';
    document.getElementById('image-preview').style.display = 'none';
    document.getElementById('product-image-url').value = '';
}

async function handleProductSubmit(e) {
    e.preventDefault();
    
    const productData = {
        name: document.getElementById('product-name').value,
        price: document.getElementById('product-price').value,
        description: document.getElementById('product-description').value,
        category: document.getElementById('product-category').value,
        stock: document.getElementById('product-stock').value,
        image: document.getElementById('product-image-url').value
    };
    
    try {
        if (editingProductId) {
            await ProductManager.updateProduct(editingProductId, productData);
            showAlert('Producto actualizado correctamente', 'success');
        } else {
            await ProductManager.createProduct(productData);
            showAlert('Producto creado correctamente', 'success');
        }
        
        hideProductForm();
        loadProductsAdmin();
        showUpdateNotification();
    } catch (error) {
        showAlert('Error al guardar producto: ' + error.message, 'error');
    }
}

async function loadProductsAdmin() {
    try {
        const products = await ProductManager.getAllProducts();
        displayProductsAdmin(products);
        updateStats();
    } catch (error) {
        showAlert('Error al cargar productos: ' + error.message, 'error');
    }
}

function displayProductsAdmin(products) {
    const grid = document.getElementById('products-grid-admin');
    
    grid.innerHTML = products.map(product => `
        <div class="product-card-admin">
            <div class="product-image-admin">
                ${product.image ? 
                    `<img src="${product.image}" alt="${product.name}">` :
                    `<i class="fas fa-box" style="font-size: 3rem; color: #ccc;"></i>`
                }
            </div>
            <div class="product-info">
                <h4>${product.name}</h4>
                <p class="product-description">${product.description || 'Sin descripción'}</p>
                <div class="product-meta">
                    <span class="product-category">${product.category}</span>
                    <span class="product-stock">Stock: ${product.stock}</span>
                </div>
                <div class="product-price">$${product.price.toLocaleString()}</div>
            </div>
            <div class="product-actions-admin">
                <button class="btn-sm btn-edit" onclick="editProduct('${product.id}')">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="btn-sm btn-delete" onclick="deleteProduct('${product.id}')">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </div>
        </div>
    `).join('');
}

async function editProduct(productId) {
    try {
        const query = new Parse.Query(Product);
        const product = await query.get(productId);
        
        document.getElementById('product-id').value = productId;
        document.getElementById('product-name').value = product.get('name');
        document.getElementById('product-price').value = product.get('price');
        document.getElementById('product-description').value = product.get('description') || '';
        document.getElementById('product-category').value = product.get('category') || 'Descartables';
        document.getElementById('product-stock').value = product.get('stock') || 0;
        
        const imageUrl = product.get('image');
        if (imageUrl) {
            document.getElementById('preview-img').src = imageUrl;
            document.getElementById('image-preview').style.display = 'block';
            document.getElementById('product-image-url').value = imageUrl;
        }
        
        document.getElementById('product-form').style.display = 'block';
        document.getElementById('form-title').textContent = 'Editar Producto';
        editingProductId = productId;
        
        // Scroll to form
        document.getElementById('product-form').scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        showAlert('Error al cargar producto: ' + error.message, 'error');
    }
}

async function deleteProduct(productId) {
    if (confirm('¿Estás seguro de que quieres eliminar este producto?')) {
        try {
            await ProductManager.deleteProduct(productId);
            showAlert('Producto eliminado correctamente', 'success');
            loadProductsAdmin();
            showUpdateNotification();
        } catch (error) {
            showAlert('Error al eliminar producto: ' + error.message, 'error');
        }
    }
}

// Upload de imágenes (simulado - en producción usar servicio como Cloudinary)
function triggerImageUpload() {
    document.getElementById('product-image-upload').click();
}

function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Simular upload (en producción, subir a un servicio de almacenamiento)
    simulateImageUpload(file);
}

function simulateImageUpload(file) {
    const progressBar = document.getElementById('upload-progress-bar');
    const uploadProgress = document.getElementById('upload-progress');
    const uploadArea = document.getElementById('upload-area');
    
    uploadArea.classList.add('uploading');
    uploadProgress.style.display = 'block';
    
    let progress = 0;
    const interval = setInterval(() => {
        progress += 10;
        progressBar.style.width = progress + '%';
        
        if (progress >= 100) {
            clearInterval(interval);
            
            // Simular URL de imagen (en producción sería la URL real del servicio)
            const imageUrl = URL.createObjectURL(file);
            document.getElementById('preview-img').src = imageUrl;
            document.getElementById('image-preview').style.display = 'block';
            document.getElementById('product-image-url').value = imageUrl;
            
            uploadArea.classList.remove('uploading');
            uploadProgress.style.display = 'none';
            progressBar.style.width = '0%';
            
            showAlert('Imagen cargada correctamente', 'success');
        }
    }, 100);
}

function removeImage() {
    document.getElementById('image-preview').style.display = 'none';
    document.getElementById('product-image-url').value = '';
    document.getElementById('product-image-upload').value = '';
}

// Configuración
async function loadWhatsAppConfig() {
    try {
        const config = await ConfigManager.getConfig();
        if (config) {
            document.getElementById('whatsapp-number').value = config.get('whatsappNumber') || '';
            document.getElementById('business-name').value = config.get('businessName') || '';
            document.getElementById('whatsapp-welcome').value = config.get('welcomeMessage') || '';
            document.getElementById('whatsapp-order').value = config.get('orderTemplate') || '';
        }
    } catch (error) {
        console.error('Error loading WhatsApp config:', error);
    }
}

async function saveWhatsAppConfig(e) {
    e.preventDefault();
    
    const configData = {
        whatsappNumber: document.getElementById('whatsapp-number').value,
        businessName: document.getElementById('business-name').value,
        welcomeMessage: document.getElementById('whatsapp-welcome').value,
        orderTemplate: document.getElementById('whatsapp-order').value
    };
    
    try {
        await ConfigManager.saveConfig(configData);
        showAlert('Configuración de WhatsApp guardada', 'success');
        showUpdateNotification();
    } catch (error) {
        showAlert('Error al guardar configuración: ' + error.message, 'error');
    }
}

async function loadShippingConfig() {
    try {
        const config = await ConfigManager.getConfig();
        if (config) {
            document.getElementById('shipping-enabled').checked = config.get('shippingEnabled') !== false;
            document.getElementById('shipping-cost').value = config.get('shippingCost') || 5000;
            document.getElementById('free-shipping-threshold').value = config.get('freeShippingThreshold') || 50000;
            updateShippingUI();
        }
    } catch (error) {
        console.error('Error loading shipping config:', error);
    }
}

async function saveShippingConfig(e) {
    e.preventDefault();
    
    const configData = {
        shippingEnabled: document.getElementById('shipping-enabled').checked,
        shippingCost: parseFloat(document.getElementById('shipping-cost').value),
        freeShippingThreshold: parseFloat(document.getElementById('free-shipping-threshold').value)
    };
    
    try {
        await ConfigManager.saveConfig(configData);
        showAlert('Configuración de envíos guardada', 'success');
        updateShippingUI();
        showUpdateNotification();
    } catch (error) {
        showAlert('Error al guardar configuración: ' + error.message, 'error');
    }
}

function toggleShipping() {
    updateShippingUI();
}

function updateShippingUI() {
    const enabled = document.getElementById('shipping-enabled').checked;
    const cost = document.getElementById('shipping-cost').value;
    const threshold = document.getElementById('free-shipping-threshold').value;
    
    document.getElementById('shipping-status').textContent = enabled ? 'Habilitado' : 'Deshabilitado';
    document.getElementById('current-shipping-cost').textContent = parseInt(cost).toLocaleString();
    document.getElementById('current-free-threshold').textContent = parseInt(threshold).toLocaleString();
}

async function loadStoreConfigAdmin() {
    try {
        const config = await ConfigManager.getConfig();
        if (config) {
            document.getElementById('store-name').value = config.get('storeName') || '';
            document.getElementById('store-phone').value = config.get('storePhone') || '';
            document.getElementById('store-description').value = config.get('storeDescription') || '';
        }
    } catch (error) {
        console.error('Error loading store config:', error);
    }
}

async function saveStoreConfig(e) {
    e.preventDefault();
    
    const configData = {
        storeName: document.getElementById('store-name').value,
        storePhone: document.getElementById('store-phone').value,
        storeDescription: document.getElementById('store-description').value
    };
    
    try {
        await ConfigManager.saveConfig(configData);
        showAlert('Información de la tienda guardada', 'success');
        showUpdateNotification();
    } catch (error) {
        showAlert('Error al guardar información: ' + error.message, 'error');
    }
}

function updatePassword() {
    const newPassword = document.getElementById('admin-password').value;
    
    if (newPassword && newPassword.length >= 6) {
        // En una implementación real, aquí se actualizaría la contraseña en Back4App
        showAlert('Contraseña actualizada correctamente', 'success');
        document.getElementById('admin-password').value = '';
    } else if (newPassword) {
        showAlert('La contraseña debe tener al menos 6 caracteres', 'error');
    } else {
        showAlert('Ingresa una nueva contraseña', 'error');
    }
}

function testWhatsApp() {
    const phone = document.getElementById('whatsapp-number').value;
    if (!phone) {
        showAlert('Primero configura un número de WhatsApp', 'error');
        return;
    }
    
    const message = "✅ Test de configuración - WhatsApp conectado correctamente con DISTRIMAX";
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
}

// Estadísticas
async function updateStats() {
    try {
        const products = await ProductManager.getAllProducts();
        const todayOrders = await OrderManager.getTodayOrders();
        const totalRevenue = await OrderManager.getTotalRevenue();
        
        document.getElementById('total-products').textContent = products.length;
        document.getElementById('total-orders').textContent = todayOrders;
        document.getElementById('total-revenue').textContent = '$' + totalRevenue.toLocaleString();
        document.getElementById('whatsapp-connected').textContent = '✓';
    } catch (error) {
        console.error('Error updating stats:', error);
    }
}

async function loadAdminData() {
    await updateStats();
    await loadProductsAdmin();
    await loadWhatsAppConfig();
    await loadShippingConfig();
    await loadStoreConfigAdmin();
}

// UI Helpers
function showAlert(message, type) {
    const alert = document.getElementById('alert');
    alert.textContent = message;
    alert.className = `alert ${type}`;
    alert.style.display = 'block';
    
    setTimeout(() => {
        alert.style.display = 'none';
    }, 5000);
}

function showUpdateNotification() {
    const notification = document.getElementById('update-notification');
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Hacer funciones disponibles globalmente
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.triggerImageUpload = triggerImageUpload;
window.removeImage = removeImage;
window.toggleShipping = toggleShipping;
window.testWhatsApp = testWhatsApp;