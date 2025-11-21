// =============================================
// CONFIGURACIÓN DE PARSE (BACK4APP)
// =============================================
Parse.initialize("vRn25suEgknHSSZSALpSXXWd0I2EPcIFGBPBFODW", "UxlCa92gr2i1hDu8pBuJMeuanXbhDpVjTMvMzTl9");
Parse.serverURL = 'https://parseapi.back4app.com/';

// =============================================
// CONFIGURACIÓN DE SEGURIDAD
// =============================================
const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'admin123'
};

// =============================================
// ESTADO GLOBAL DE LA APLICACIÓN
// =============================================
window.appState = {
    isLoggedIn: false,
    settings: {},
    products: []
};

// =============================================
// ELEMENTOS DEL DOM - ADMIN
// =============================================
const adminElements = {
    loginSection: document.getElementById('login-section'),
    adminPanel: document.getElementById('admin-panel'),
    loginForm: document.getElementById('login-form'),
    logoutBtn: document.getElementById('logout-btn'),
    alert: document.getElementById('alert'),
    loginAlert: document.getElementById('login-alert'),
    
    // Productos
    productForm: document.getElementById('product-form'),
    productFormData: document.getElementById('product-form-data'),
    productsGridAdmin: document.getElementById('products-grid-admin'),
    addProductBtn: document.getElementById('add-product-btn'),
    cancelForm: document.getElementById('cancel-form'),
    loadingProducts: document.getElementById('loading-products'),
    
    // Form inputs
    productId: document.getElementById('product-id'),
    productName: document.getElementById('product-name'),
    productPrice: document.getElementById('product-price'),
    productCategory: document.getElementById('product-category'),
    productStock: document.getElementById('product-stock'),
    productDescription: document.getElementById('product-description'),
    productImageUrl: document.getElementById('product-image-url'),
    
    // WhatsApp
    whatsappConfigForm: document.getElementById('whatsapp-config-form'),
    whatsappNumber: document.getElementById('whatsapp-number'),
    businessName: document.getElementById('business-name'),
    whatsappWelcome: document.getElementById('whatsapp-welcome'),
    whatsappOrder: document.getElementById('whatsapp-order'),
    testWhatsappBtn: document.getElementById('test-whatsapp-btn'),
    
    // Envíos
    shippingConfigForm: document.getElementById('shipping-config-form'),
    shippingEnabled: document.getElementById('shipping-enabled'),
    shippingCost: document.getElementById('shipping-cost'),
    freeShippingThreshold: document.getElementById('free-shipping-threshold'),
    shippingStatus: document.getElementById('shipping-status'),
    currentShippingCost: document.getElementById('current-shipping-cost'),
    currentFreeThreshold: document.getElementById('current-free-threshold'),
    
    // Store
    storeConfigForm: document.getElementById('store-config-form'),
    storeName: document.getElementById('store-name'),
    storePhone: document.getElementById('store-phone'),
    storeDescription: document.getElementById('store-description'),
    
    // Seguridad
    updatePasswordBtn: document.getElementById('update-password-btn'),
    adminPassword: document.getElementById('admin-password'),
    
    // Stats
    totalProducts: document.getElementById('total-products'),
    totalOrders: document.getElementById('total-orders'),
    totalRevenue: document.getElementById('total-revenue'),
    whatsappConnected: document.getElementById('whatsapp-connected'),
    productCount: document.getElementById('product-count')
};

// =============================================
// FUNCIONES DE CONFIGURACIÓN - MEJORADAS
// =============================================

// Guardar configuración de WhatsApp
async function saveWhatsAppConfig(e) {
    e.preventDefault();
    
    try {
        const whatsappNumber = adminElements.whatsappNumber.value.trim();
        
        if (!whatsappNumber) {
            showAlert('❌ Por favor ingresa un número de WhatsApp válido', 'error');
            return;
        }

        // Validar formato del número (solo números, sin +)
        const phoneRegex = /^[0-9]{10,15}$/;
        if (!phoneRegex.test(whatsappNumber)) {
            showAlert('❌ Formato de número inválido. Solo números, sin espacios ni símbolos. Ej: 5493624366733', 'error');
            return;
        }

        const settings = {
            whatsappNumber: whatsappNumber,
            businessName: adminElements.businessName.value,
            whatsappWelcome: adminElements.whatsappWelcome.value,
            whatsappOrder: adminElements.whatsappOrder.value,
            // Mantener otra configuración existente
            ...window.appState.settings
        };
        
        console.log('💾 Guardando configuración WhatsApp:', settings);
        
        // Guardar en Back4App
        await saveSettingsToBack4App(settings);
        
        // Actualizar el estado global
        window.appState.settings = settings;
        
        // Sincronizar con página principal
        syncWhatsAppConfigWithMainPage(settings);
        
        showAlert('✅ Configuración de WhatsApp guardada correctamente', 'success');
        
        // Actualizar estadísticas
        updateStats();
        
    } catch (error) {
        console.error('❌ Error guardando configuración WhatsApp:', error);
        showAlert('❌ Error al guardar la configuración: ' + error.message, 'error');
    }
}

// Guardar configuración de envíos
async function saveShippingConfig(e) {
    e.preventDefault();
    
    try {
        const shippingEnabled = adminElements.shippingEnabled.checked;
        const shippingCost = parseFloat(adminElements.shippingCost.value) || 0;
        const freeShippingThreshold = parseFloat(adminElements.freeShippingThreshold.value) || 0;
        
        const settings = {
            shippingEnabled: shippingEnabled,
            shippingCost: shippingCost,
            freeShippingThreshold: freeShippingThreshold,
            // Mantener la configuración existente
            ...window.appState.settings
        };
        
        console.log('🚚 Guardando configuración de envíos:', settings);
        
        // Guardar en Back4App
        await saveSettingsToBack4App(settings);
        
        // Actualizar el estado global
        window.appState.settings = settings;
        
        // Sincronizar con página principal
        syncShippingConfigWithMainPage(settings);
        
        // Actualizar UI de envíos
        updateShippingUI();
        
        showAlert('✅ Configuración de envíos guardada correctamente', 'success');
        
    } catch (error) {
        console.error('❌ Error guardando configuración de envíos:', error);
        showAlert('❌ Error al guardar la configuración: ' + error.message, 'error');
    }
}

// Sincronizar configuración de envíos con página principal
function syncShippingConfigWithMainPage(settings) {
    try {
        const shippingConfig = {
            enabled: settings.shippingEnabled || false,
            cost: settings.shippingCost || 5000,
            freeShippingThreshold: settings.freeShippingThreshold || 50000,
            syncedAt: new Date().toISOString()
        };
        
        localStorage.setItem('shippingConfig', JSON.stringify(shippingConfig));
        console.log('🚚 Configuración de envíos sincronizada:', shippingConfig);
        
    } catch (error) {
        console.error('Error sincronizando configuración de envíos:', error);
    }
}

// Actualizar UI de configuración de envíos
function updateShippingUI() {
    const settings = window.appState.settings;
    const enabled = settings.shippingEnabled || false;
    const cost = settings.shippingCost || 0;
    const threshold = settings.freeShippingThreshold || 0;
    
    // Actualizar elementos de información
    if (adminElements.shippingStatus) {
        adminElements.shippingStatus.textContent = enabled ? 'Habilitado' : 'Deshabilitado';
        adminElements.shippingStatus.style.color = enabled ? 'var(--primary-color)' : '#666';
    }
    
    if (adminElements.currentShippingCost) {
        adminElements.currentShippingCost.textContent = cost.toLocaleString();
    }
    
    if (adminElements.currentFreeThreshold) {
        adminElements.currentFreeThreshold.textContent = threshold.toLocaleString();
    }
    
    // Actualizar formulario
    if (adminElements.shippingEnabled) {
        adminElements.shippingEnabled.checked = enabled;
    }
    
    if (adminElements.shippingCost) {
        adminElements.shippingCost.value = cost;
    }
    
    if (adminElements.freeShippingThreshold) {
        adminElements.freeShippingThreshold.value = threshold;
    }
}

// Sincronizar configuración con la página principal
function syncWhatsAppConfigWithMainPage(settings) {
    try {
        // Guardar en localStorage para que la página principal lo use
        const mainPageConfig = {
            whatsappNumber: settings.whatsappNumber,
            businessName: settings.businessName,
            whatsappWelcome: settings.whatsappWelcome,
            whatsappOrder: settings.whatsappOrder,
            syncedAt: new Date().toISOString()
        };
        
        localStorage.setItem('storeSettings', JSON.stringify(mainPageConfig));
        localStorage.setItem('paymentWhatsAppNumber', settings.whatsappNumber);
        localStorage.setItem('whatsappConfig', JSON.stringify(mainPageConfig));
        
        console.log('🔄 Configuración sincronizada con página principal:', mainPageConfig);
        console.log('💰 Número de WhatsApp para pagos:', settings.whatsappNumber);
        
    } catch (error) {
        console.error('Error sincronizando configuración:', error);
    }
}

// Guardar configuración de la tienda
async function saveStoreConfig(e) {
    e.preventDefault();
    
    try {
        const settings = {
            storeName: adminElements.storeName.value,
            storePhone: adminElements.storePhone.value,
            storeDescription: adminElements.storeDescription.value,
            // Mantener la configuración existente
            ...window.appState.settings
        };
        
        console.log('🏪 Guardando configuración tienda:', settings);
        
        // Guardar en Back4App
        await saveSettingsToBack4App(settings);
        
        // Actualizar el estado global
        window.appState.settings = settings;
        
        // Sincronizar con página principal
        syncStoreConfigWithMainPage(settings);
        
        showAlert('✅ Configuración de la tienda guardada correctamente', 'success');
        
    } catch (error) {
        console.error('❌ Error guardando configuración tienda:', error);
        showAlert('❌ Error al guardar la configuración: ' + error.message, 'error');
    }
}

// Sincronizar configuración de tienda con página principal
function syncStoreConfigWithMainPage(settings) {
    try {
        const storeConfig = {
            storeName: settings.storeName,
            storePhone: settings.storePhone,
            storeDescription: settings.storeDescription,
            syncedAt: new Date().toISOString()
        };
        
        localStorage.setItem('storeInfo', JSON.stringify(storeConfig));
        console.log('🏪 Configuración de tienda sincronizada:', storeConfig);
        
    } catch (error) {
        console.error('Error sincronizando configuración de tienda:', error);
    }
}

// =============================================
// FUNCIONES DE CONFIGURACIÓN CON BACK4APP
// =============================================

// Cargar configuración desde Back4App
async function loadSettings() {
    try {
        console.log('📥 Cargando configuración desde Back4App...');
        
        const Settings = Parse.Object.extend('Settings');
        const query = new Parse.Query(Settings);
        
        const settings = await query.first();
        
        if (settings) {
            const settingsData = {
                whatsappNumber: settings.get('whatsappNumber') || '5493624366733',
                businessName: settings.get('businessName') || '',
                whatsappWelcome: settings.get('whatsappWelcome') || '¡Hola! Bienvenido a nuestra tienda. ¿En qué puedo ayudarte?',
                whatsappOrder: settings.get('whatsappOrder') || 'Pedido recibido! Productos: {productos} Total: ${total}',
                storeName: settings.get('storeName') || 'Tienda WhatsApp',
                storePhone: settings.get('storePhone') || '',
                storeDescription: settings.get('storeDescription') || 'Tu tienda online integrada con WhatsApp',
                // Configuración de envíos
                shippingEnabled: settings.get('shippingEnabled') || false,
                shippingCost: settings.get('shippingCost') || 5000,
                freeShippingThreshold: settings.get('freeShippingThreshold') || 50000
            };
            
            console.log('✅ Configuración cargada desde Back4App:', settingsData);
            
            window.appState.settings = settingsData;
            fillSettingsForms(settingsData);
            
            // Sincronizar con página principal
            syncWhatsAppConfigWithMainPage(settingsData);
            syncStoreConfigWithMainPage(settingsData);
            syncShippingConfigWithMainPage(settingsData);
            
            // Actualizar UI específica
            updateShippingUI();
            
            return settingsData;
        } else {
            console.log('🆕 Creando configuración por defecto...');
            const defaultSettings = {
                whatsappNumber: '5493624366733',
                businessName: '',
                whatsappWelcome: '¡Hola! Bienvenido a nuestra tienda. ¿En qué puedo ayudarte?',
                whatsappOrder: 'Pedido recibido! Productos: {productos} Total: ${total}',
                storeName: 'Tienda WhatsApp',
                storePhone: '',
                storeDescription: 'Tu tienda online integrada con WhatsApp',
                shippingEnabled: false,
                shippingCost: 5000,
                freeShippingThreshold: 50000
            };
            
            await saveSettingsToBack4App(defaultSettings);
            return defaultSettings;
        }
        
    } catch (error) {
        console.error('❌ Error cargando configuración:', error);
        return loadSettingsFromCache();
    }
}

// Cargar configuración desde cache
function loadSettingsFromCache() {
    try {
        // Intentar cargar desde localStorage
        const saved = localStorage.getItem('adminSettings');
        if (saved) {
            const settings = JSON.parse(saved);
            console.log('📦 Configuración cargada desde cache:', settings);
            fillSettingsForms(settings);
            return settings;
        }
    } catch (cacheError) {
        console.error('Error cargando cache:', cacheError);
    }
    
    // CONFIGURACIÓN POR DEFECTO CON TU NÚMERO
    const defaultSettings = {
        whatsappNumber: '5493624366733',
        businessName: '',
        whatsappWelcome: '¡Hola! Bienvenido a nuestra tienda. ¿En qué puedo ayudarte?',
        whatsappOrder: 'Pedido recibido! Productos: {productos} Total: ${total}',
        storeName: 'Tienda WhatsApp',
        storePhone: '',
        storeDescription: 'Tu tienda online integrada con WhatsApp',
        shippingEnabled: false,
        shippingCost: 5000,
        freeShippingThreshold: 50000
    };
    
    fillSettingsForms(defaultSettings);
    return defaultSettings;
}

// Guardar configuración en Back4App
async function saveSettingsToBack4App(settingsData) {
    try {
        console.log('💾 Guardando configuración en Back4App:', settingsData);
        
        const Settings = Parse.Object.extend('Settings');
        const query = new Parse.Query(Settings);
        
        let settings = await query.first();
        if (!settings) {
            settings = new Settings();
        }
        
        // Guardar todos los campos
        settings.set('whatsappNumber', settingsData.whatsappNumber || '5493624366733');
        settings.set('businessName', settingsData.businessName || '');
        settings.set('whatsappWelcome', settingsData.whatsappWelcome || '');
        settings.set('whatsappOrder', settingsData.whatsappOrder || '');
        settings.set('storeName', settingsData.storeName || '');
        settings.set('storePhone', settingsData.storePhone || '');
        settings.set('storeDescription', settingsData.storeDescription || '');
        
        // NUEVO: Configuración de envíos
        settings.set('shippingEnabled', settingsData.shippingEnabled || false);
        settings.set('shippingCost', settingsData.shippingCost || 5000);
        settings.set('freeShippingThreshold', settingsData.freeShippingThreshold || 50000);
        
        const result = await settings.save();
        
        // Actualizar estado global y cache
        window.appState.settings = settingsData;
        localStorage.setItem('adminSettings', JSON.stringify(settingsData));
        
        console.log('✅ Configuración guardada en Back4App:', result.id);
        return result;
        
    } catch (error) {
        console.error('❌ Error guardando configuración:', error);
        
        // Fallback: guardar en localStorage
        try {
            localStorage.setItem('adminSettings', JSON.stringify(settingsData));
            console.log('📦 Configuración guardada en localStorage como respaldo');
        } catch (localError) {
            console.error('Error guardando en localStorage:', localError);
        }
        
        throw new Error(`No se pudo guardar la configuración: ${error.message}`);
    }
}

// Llenar formularios con la configuración
function fillSettingsForms(settings) {
    console.log('📝 Llenando formularios con configuración:', settings);
    
    // Configuración de WhatsApp
    if (adminElements.whatsappNumber) {
        adminElements.whatsappNumber.value = settings.whatsappNumber || '5493624366733';
        console.log('📞 Número WhatsApp cargado:', settings.whatsappNumber);
    }
    if (adminElements.businessName) adminElements.businessName.value = settings.businessName || '';
    if (adminElements.whatsappWelcome) adminElements.whatsappWelcome.value = settings.whatsappWelcome || '';
    if (adminElements.whatsappOrder) adminElements.whatsappOrder.value = settings.whatsappOrder || '';
    
    // Configuración de envíos
    if (adminElements.shippingEnabled) {
        adminElements.shippingEnabled.checked = settings.shippingEnabled || false;
    }
    if (adminElements.shippingCost) {
        adminElements.shippingCost.value = settings.shippingCost || 5000;
    }
    if (adminElements.freeShippingThreshold) {
        adminElements.freeShippingThreshold.value = settings.freeShippingThreshold || 50000;
    }
    
    // Configuración de la tienda
    if (adminElements.storeName) adminElements.storeName.value = settings.storeName || '';
    if (adminElements.storePhone) adminElements.storePhone.value = settings.storePhone || '';
    if (adminElements.storeDescription) adminElements.storeDescription.value = settings.storeDescription || '';
}

// =============================================
// FUNCIONES DE PRODUCTOS
// =============================================

// Cargar productos para el admin
async function loadAdminProducts() {
    try {
        showLoadingState();
        
        const Product = Parse.Object.extend('Product');
        const query = new Parse.Query(Product);
        query.equalTo('isActive', true);
        query.descending('createdAt');
        
        const products = await query.find();
        
        const productsData = products.map(product => ({
            id: product.id,
            name: product.get('name'),
            price: product.get('price'),
            category: product.get('category'),
            stock: product.get('stock'),
            description: product.get('description'),
            imageUrl: product.get('imageUrl'),
            isActive: product.get('isActive')
        }));
        
        window.appState.products = productsData;
        renderAdminProducts(productsData);
        updateStats();
        
        hideLoadingState();
        
        console.log(`✅ ${productsData.length} productos cargados para admin`);
        return productsData;
        
    } catch (error) {
        console.error('❌ Error cargando productos:', error);
        hideLoadingState();
        showAlert('Error cargando productos: ' + error.message, 'error');
        return [];
    }
}

// Renderizar productos en el admin
function renderAdminProducts(products) {
    if (!adminElements.productsGridAdmin) return;
    
    if (products.length === 0) {
        adminElements.productsGridAdmin.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: #666;">
                <i class="fas fa-box-open" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                <h3>No hay productos</h3>
                <p>Agrega tu primer producto haciendo clic en el botón "Agregar Producto"</p>
            </div>
        `;
        return;
    }
    
    adminElements.productsGridAdmin.innerHTML = products.map(product => `
        <div class="product-card-admin">
            <div class="product-image-admin">
                ${product.imageUrl ? 
                    `<img src="${product.imageUrl}" alt="${product.name}" onerror="this.style.display='none'; this.parentElement.innerHTML='<i class=\"fas fa-image\"></i>';" />` : 
                    `<i class="fas fa-image"></i>`
                }
            </div>
            <h4>${product.name}</h4>
            <p style="color: var(--primary-color); font-weight: bold; font-size: 1.2rem;">
                $${parseFloat(product.price).toFixed(2)}
            </p>
            <p style="color: #666; font-size: 0.9rem;">
                <strong>Categoría:</strong> ${product.category} | 
                <strong>Stock:</strong> ${product.stock}
            </p>
            <p style="color: #888; font-size: 0.8rem; margin-top: 0.5rem;">
                ${product.description || 'Sin descripción'}
            </p>
            <div class="product-actions-admin">
                <button class="btn-sm btn-edit" onclick="window.admin.editProduct('${product.id}')">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="btn-sm btn-delete" onclick="window.admin.deleteProduct('${product.id}')">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </div>
        </div>
    `).join('');
}

// Guardar producto
async function saveProduct(productData, isEditing = false) {
    try {
        const Product = Parse.Object.extend('Product');
        let product;
        
        if (isEditing && productData.id) {
            product = new Product();
            product.id = productData.id;
        } else {
            product = new Product();
        }
        
        product.set('name', productData.name);
        product.set('price', parseFloat(productData.price));
        product.set('category', productData.category);
        product.set('stock', parseInt(productData.stock) || 0);
        product.set('description', productData.description || '');
        product.set('imageUrl', productData.imageUrl || '');
        product.set('isActive', true);
        
        await product.save();
        
        // Recargar productos
        await loadAdminProducts();
        
        showAlert(`✅ Producto ${isEditing ? 'actualizado' : 'creado'} correctamente`, 'success');
        
        // Mostrar notificación de actualización
        showUpdateNotification();
        
        return product;
        
    } catch (error) {
        console.error('❌ Error guardando producto:', error);
        throw new Error(`No se pudo guardar el producto: ${error.message}`);
    }
}

// Editar producto
async function editProduct(productId) {
    try {
        const Product = Parse.Object.extend('Product');
        const query = new Parse.Query(Product);
        const product = await query.get(productId);
        
        if (!product) {
            showAlert('Producto no encontrado', 'error');
            return;
        }
        
        adminElements.productId.value = product.id;
        adminElements.productName.value = product.get('name');
        adminElements.productPrice.value = product.get('price');
        adminElements.productCategory.value = product.get('category');
        adminElements.productStock.value = product.get('stock');
        adminElements.productDescription.value = product.get('description') || '';
        
        const imageUrl = product.get('imageUrl');
        adminElements.productImageUrl.value = imageUrl || '';
        
        if (imageUrl) {
            showImagePreview(imageUrl);
        } else {
            hideImagePreview();
        }
        
        document.getElementById('form-title').textContent = 'Editar Producto';
        adminElements.productForm.style.display = 'block';
        
        // Scroll al formulario
        adminElements.productForm.scrollIntoView({ behavior: 'smooth' });
        
    } catch (error) {
        console.error('Error al cargar producto para editar:', error);
        showAlert('Error al cargar el producto: ' + error.message, 'error');
    }
}

// Eliminar producto
async function deleteProduct(productId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) {
        return;
    }
    
    try {
        const Product = Parse.Object.extend('Product');
        const query = new Parse.Query(Product);
        const product = await query.get(productId);
        
        if (product) {
            // Marcar como inactivo en lugar de eliminar
            product.set('isActive', false);
            await product.save();
            
            showAlert('✅ Producto eliminado correctamente', 'success');
            
            // Recargar productos
            await loadAdminProducts();
            
            // Mostrar notificación de actualización
            showUpdateNotification();
        }
        
    } catch (error) {
        console.error('❌ Error eliminando producto:', error);
        showAlert('❌ Error al eliminar el producto: ' + error.message, 'error');
    }
}

// =============================================
// FUNCIONES DE AUTENTICACIÓN
// =============================================

function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    
    if (!username) {
        showLoginAlert('Por favor ingresa el usuario');
        document.getElementById('username').focus();
        return;
    }
    
    if (!password) {
        showLoginAlert('Por favor ingresa la contraseña');
        document.getElementById('password').focus();
        return;
    }
    
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        window.appState.isLoggedIn = true;
        localStorage.setItem('adminLoggedIn', 'true');
        localStorage.setItem('adminSession', Date.now().toString());
        
        showAdminPanel();
        showAlert('Sesión iniciada correctamente', 'success');
        adminElements.loginForm.reset();
    } else {
        showLoginAlert('Usuario o contraseña incorrectos');
        const passwordInput = document.getElementById('password');
        passwordInput.style.borderColor = '#dc3545';
        passwordInput.style.animation = 'shake 0.5s';
        setTimeout(() => {
            passwordInput.style.animation = '';
            passwordInput.style.borderColor = '';
        }, 500);
        passwordInput.value = '';
        passwordInput.focus();
    }
}

function handleLogout() {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
        window.appState.isLoggedIn = false;
        localStorage.removeItem('adminLoggedIn');
        localStorage.removeItem('adminSession');
        showLoginPanel();
        showAlert('Sesión cerrada correctamente', 'success');
    }
}

function checkExistingSession() {
    const savedLogin = localStorage.getItem('adminLoggedIn');
    const sessionTime = localStorage.getItem('adminSession');
    
    if (savedLogin === 'true' && sessionTime) {
        const sessionAge = Date.now() - parseInt(sessionTime);
        const maxSessionAge = 24 * 60 * 60 * 1000; // 24 horas
        if (sessionAge < maxSessionAge) {
            window.appState.isLoggedIn = true;
            return true;
        } else {
            localStorage.removeItem('adminLoggedIn');
            localStorage.removeItem('adminSession');
            showLoginAlert('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
        }
    }
    return false;
}

// =============================================
// FUNCIONES DE INTERFAZ
// =============================================

function showAdminPanel() {
    adminElements.loginSection.style.display = 'none';
    adminElements.adminPanel.style.display = 'block';
    loadAdminData();
}

function showLoginPanel() {
    adminElements.loginSection.style.display = 'block';
    adminElements.adminPanel.style.display = 'none';
    adminElements.loginForm.reset();
    setTimeout(() => {
        document.getElementById('username').focus();
    }, 100);
}

function showProductForm() {
    adminElements.productForm.style.display = 'block';
    document.getElementById('form-title').textContent = 'Agregar Nuevo Producto';
    adminElements.productFormData.reset();
    adminElements.productId.value = '';
    hideImagePreview();
    
    // Scroll al formulario
    adminElements.productForm.scrollIntoView({ behavior: 'smooth' });
}

function hideProductForm() {
    adminElements.productForm.style.display = 'none';
}

function showLoadingState() {
    if (adminElements.loadingProducts) {
        adminElements.loadingProducts.style.display = 'block';
    }
    if (adminElements.productsGridAdmin) {
        adminElements.productsGridAdmin.style.display = 'none';
    }
}

function hideLoadingState() {
    if (adminElements.loadingProducts) {
        adminElements.loadingProducts.style.display = 'none';
    }
    if (adminElements.productsGridAdmin) {
        adminElements.productsGridAdmin.style.display = 'grid';
    }
}

function showAlert(message, type) {
    if (adminElements.alert) {
        adminElements.alert.textContent = message;
        adminElements.alert.className = `alert ${type}`;
        adminElements.alert.style.display = 'block';
        
        setTimeout(() => {
            adminElements.alert.style.display = 'none';
        }, 4000);
    }
}

function showLoginAlert(message) {
    if (adminElements.loginAlert) {
        adminElements.loginAlert.textContent = message;
        adminElements.loginAlert.className = 'alert error';
        adminElements.loginAlert.style.display = 'block';
        
        setTimeout(() => {
            adminElements.loginAlert.style.display = 'none';
        }, 3000);
    }
}

function showUpdateNotification() {
    const notification = document.getElementById('update-notification');
    if (notification) {
        notification.classList.add('show');
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
}

function updateStats() {
    if (adminElements.totalProducts) {
        adminElements.totalProducts.textContent = window.appState.products.length;
    }
    if (adminElements.productCount) {
        adminElements.productCount.textContent = window.appState.products.length;
    }
    if (adminElements.whatsappConnected) {
        const hasWhatsApp = window.appState.settings.whatsappNumber && window.appState.settings.whatsappNumber.length >= 10;
        adminElements.whatsappConnected.textContent = hasWhatsApp ? '✓' : '✗';
        adminElements.whatsappConnected.style.color = hasWhatsApp ? 'var(--primary-color)' : '#dc3545';
    }
}

// =============================================
// FUNCIONES DE TABS
// =============================================

function setupTabs() {
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(tc => tc.classList.remove('active'));
            
            tab.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// =============================================
// FUNCIONES DE WHATSAPP
// =============================================

function testWhatsAppConfig() {
    const phone = adminElements.whatsappNumber.value || window.appState.settings.whatsappNumber;
    if (!phone) {
        showAlert('Por favor ingresa un número de WhatsApp primero', 'error');
        return;
    }
    
    const message = encodeURIComponent('✅ Esta es una prueba de la configuración de WhatsApp. Tu tienda está correctamente configurada!');
    const whatsappUrl = `https://wa.me/${phone}?text=${message}`;
    
    window.open(whatsappUrl, '_blank');
    showAlert('Probando configuración de WhatsApp...', 'success');
}

// =============================================
// FUNCIONES DE UPLOAD DE IMÁGENES
// =============================================

function setupImageUpload() {
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('product-image-upload');
    const removeBtn = document.getElementById('remove-image');
    
    if (!uploadArea || !fileInput) return;
    
    uploadArea.addEventListener('click', () => fileInput.click());
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleImageSelect(files[0]);
        }
    });
    
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleImageSelect(e.target.files[0]);
        }
    });
    
    if (removeBtn) {
        removeBtn.addEventListener('click', hideImagePreview);
    }
}

async function handleImageSelect(file) {
    if (!file.type.startsWith('image/')) {
        showAlert('Por favor selecciona una imagen válida (JPG, PNG, GIF)', 'error');
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
        showAlert('La imagen debe ser menor a 5MB', 'error');
        return;
    }
    
    try {
        showAlert('Subiendo imagen...', 'success');
        
        // Mostrar preview inmediatamente
        const reader = new FileReader();
        reader.onload = (e) => {
            showImagePreview(e.target.result);
        };
        reader.readAsDataURL(file);
        
        // Subir a Back4App
        const imageUrl = await uploadImageToBack4App(file);
        
        // Guardar URL en el formulario
        adminElements.productImageUrl.value = imageUrl;
        
        showAlert('✅ Imagen subida correctamente', 'success');
        
    } catch (error) {
        console.error('Error procesando imagen:', error);
        showAlert('Error al subir la imagen: ' + error.message, 'error');
        hideImagePreview();
    }
}

async function uploadImageToBack4App(file) {
    try {
        console.log('📤 Subiendo imagen a Back4App...', file.name);
        
        showUploadProgress(30);
        
        const parseFile = new Parse.File(file.name, file);
        
        showUploadProgress(60);
        
        await parseFile.save();
        
        const imageUrl = parseFile.url();
        
        showUploadProgress(100);
        console.log('✅ Imagen subida correctamente:', imageUrl);
        return imageUrl;
        
    } catch (error) {
        console.error('❌ Error subiendo imagen:', error);
        hideUploadProgress();
        throw new Error('No se pudo subir la imagen: ' + error.message);
    }
}

function showImagePreview(imageUrl) {
    const preview = document.getElementById('image-preview');
    const previewImg = document.getElementById('preview-img');
    
    if (preview && previewImg) {
        previewImg.src = imageUrl;
        preview.style.display = 'block';
    }
}

function hideImagePreview() {
    const preview = document.getElementById('image-preview');
    if (preview) {
        preview.style.display = 'none';
        adminElements.productImageUrl.value = '';
    }
    hideUploadProgress();
}

function showUploadProgress(percent) {
    const progress = document.getElementById('upload-progress');
    const progressBar = document.getElementById('upload-progress-bar');
    const uploadArea = document.getElementById('upload-area');
    
    if (progress && progressBar) {
        progress.style.display = 'block';
        progressBar.style.width = percent + '%';
    }
    
    if (uploadArea) {
        if (percent < 100) {
            uploadArea.classList.add('uploading');
        } else {
            uploadArea.classList.remove('uploading');
            setTimeout(() => {
                if (progress) progress.style.display = 'none';
            }, 1000);
        }
    }
}

function hideUploadProgress() {
    const progress = document.getElementById('upload-progress');
    const uploadArea = document.getElementById('upload-area');
    
    if (progress) progress.style.display = 'none';
    if (uploadArea) uploadArea.classList.remove('uploading');
}

// =============================================
// FUNCIONES PRINCIPALES
// =============================================

async function loadAdminData() {
    await loadAdminProducts();
    await loadSettings();
    setupTabs();
    updateStats();
}

function setupAdminEventListeners() {
    // Login
    if (adminElements.loginForm) {
        adminElements.loginForm.addEventListener('submit', handleLogin);
    }
    
    if (adminElements.logoutBtn) {
        adminElements.logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Productos
    if (adminElements.addProductBtn) {
        adminElements.addProductBtn.addEventListener('click', showProductForm);
    }
    
    if (adminElements.cancelForm) {
        adminElements.cancelForm.addEventListener('click', hideProductForm);
    }
    
    if (adminElements.productFormData) {
        adminElements.productFormData.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            try {
                const productData = {
                    id: adminElements.productId.value,
                    name: adminElements.productName.value,
                    price: adminElements.productPrice.value,
                    category: adminElements.productCategory.value,
                    stock: adminElements.productStock.value,
                    description: adminElements.productDescription.value,
                    imageUrl: adminElements.productImageUrl.value || ''
                };
                
                const isEditing = adminElements.productId.value !== '';
                
                await saveProduct(productData, isEditing);
                
                hideProductForm();
                
            } catch (error) {
                console.error('Error al guardar producto:', error);
                showAlert('❌ Error al guardar el producto: ' + error.message, 'error');
            }
        });
    }
    
    // Configuración
    if (adminElements.whatsappConfigForm) {
        adminElements.whatsappConfigForm.addEventListener('submit', saveWhatsAppConfig);
    }
    
    if (adminElements.shippingConfigForm) {
        adminElements.shippingConfigForm.addEventListener('submit', saveShippingConfig);
    }
    
    if (adminElements.storeConfigForm) {
        adminElements.storeConfigForm.addEventListener('submit', saveStoreConfig);
    }
    
    if (adminElements.testWhatsappBtn) {
        adminElements.testWhatsappBtn.addEventListener('click', testWhatsAppConfig);
    }
    
    // Upload de imágenes
    setupImageUpload();
}

async function initAdmin() {
    console.log('🔐 Inicializando panel admin...');
    
    try {
        // Verificar sesión existente
        if (checkExistingSession()) {
            showAdminPanel();
            console.log('✅ Sesión existente encontrada');
        } else {
            showLoginPanel();
            console.log('🔒 Mostrando pantalla de login');
        }
        
        // Configurar event listeners
        setupAdminEventListeners();
        
        console.log('✅ Panel Admin inicializado correctamente');
        
    } catch (error) {
        console.error('❌ Error inicializando admin:', error);
        showAlert('Error inicializando el panel: ' + error.message, 'error');
    }
}

// =============================================
// EXPORTAR FUNCIONES GLOBALES
// =============================================

window.admin = {
    init: initAdmin,
    saveProduct: saveProduct,
    deleteProduct: deleteProduct,
    editProduct: editProduct,
    loadProducts: loadAdminProducts,
    uploadImageToBack4App: uploadImageToBack4App
};