// admin.js - Panel Admin Tienda WhatsApp - Versión Corregida
const admin = (function() {
    // Configuración por defecto
    const DEFAULT_CONFIG = {
        whatsappNumber: '5493624366733',
        businessName: 'Tienda WhatsApp',
        whatsappWelcome: '¡Hola! Bienvenido a nuestra tienda. ¿En qué puedo ayudarte?',
        whatsappOrder: 'Pedido recibido! Productos: {productos} Total: ${total}',
        shippingCost: 5000,
        freeShippingThreshold: 50000,
        shippingEnabled: true,
        storeName: 'Tienda WhatsApp',
        storePhone: '+5493624366733',
        storeDescription: 'Tu tienda online integrada con WhatsApp'
    };

    let currentUser = null;

    return {
        init: function() {
            this.checkAuth();
            this.setupEventListeners();
            this.loadConfigurations();
            this.loadProducts();
        },

        checkAuth: function() {
            const user = localStorage.getItem('adminUser');
            if (user) {
                currentUser = JSON.parse(user);
                this.showAdminPanel();
            } else {
                this.showLoginForm();
            }
        },

        setupEventListeners: function() {
            // Login
            document.getElementById('login-form').addEventListener('submit', (e) => this.handleLogin(e));
            document.getElementById('logout-btn').addEventListener('click', () => this.handleLogout());

            // Tabs
            document.querySelectorAll('.tab').forEach(tab => {
                tab.addEventListener('click', (e) => this.switchTab(e.target.getAttribute('data-tab')));
            });

            // Productos
            document.getElementById('add-product-btn').addEventListener('click', () => this.showProductForm());
            document.getElementById('cancel-form').addEventListener('click', () => this.hideProductForm());
            document.getElementById('product-form-data').addEventListener('submit', (e) => this.handleProductSubmit(e));

            // Configuraciones
            document.getElementById('whatsapp-config-form').addEventListener('submit', (e) => this.saveWhatsAppConfig(e));
            document.getElementById('shipping-config-form').addEventListener('submit', (e) => this.saveShippingConfig(e));
            document.getElementById('store-config-form').addEventListener('submit', (e) => this.saveStoreConfig(e));
            document.getElementById('update-password-btn').addEventListener('click', () => this.updatePassword());

            // Upload de imágenes
            this.setupImageUpload();

            // Test WhatsApp
            document.getElementById('test-whatsapp-btn').addEventListener('click', () => this.testWhatsAppConfig());
        },

        handleLogin: function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            // Credenciales por defecto
            if (username === 'admin' && password === 'admin123') {
                currentUser = { username: 'admin', loginTime: new Date().toISOString() };
                localStorage.setItem('adminUser', JSON.stringify(currentUser));
                this.showAdminPanel();
                this.showAlert('Sesión iniciada correctamente', 'success');
            } else {
                this.showAlert('Usuario o contraseña incorrectos', 'error');
            }
        },

        handleLogout: function() {
            localStorage.removeItem('adminUser');
            currentUser = null;
            this.showLoginForm();
            this.showAlert('Sesión cerrada correctamente', 'success');
        },

        showLoginForm: function() {
            document.getElementById('login-section').style.display = 'block';
            document.getElementById('admin-panel').style.display = 'none';
        },

        showAdminPanel: function() {
            document.getElementById('login-section').style.display = 'none';
            document.getElementById('admin-panel').style.display = 'block';
        },

        switchTab: function(tabName) {
            // Actualizar tabs activos
            document.querySelectorAll('.tab').forEach(tab => {
                tab.classList.remove('active');
                if (tab.getAttribute('data-tab') === tabName) {
                    tab.classList.add('active');
                }
            });

            // Mostrar contenido del tab
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
                if (content.id === tabName) {
                    content.classList.add('active');
                }
            });
        },

        // CONFIGURACIÓN WHATSAPP - CORREGIDA
        saveWhatsAppConfig: function(e) {
            e.preventDefault();
            
            const config = {
                whatsappNumber: document.getElementById('whatsapp-number').value.trim(),
                businessName: document.getElementById('business-name').value.trim(),
                whatsappWelcome: document.getElementById('whatsapp-welcome').value.trim(),
                whatsappOrder: document.getElementById('whatsapp-order').value.trim()
            };

            // Validar número de WhatsApp
            if (!config.whatsappNumber) {
                this.showAlert('El número de WhatsApp es obligatorio', 'error');
                return;
            }

            // Guardar en localStorage para sincronización con index.html
            localStorage.setItem('paymentWhatsAppNumber', config.whatsappNumber);
            localStorage.setItem('whatsappConfig', JSON.stringify(config));

            this.showAlert('Configuración de WhatsApp guardada correctamente', 'success');
            this.showNotification('✅ WhatsApp configurado: ' + config.whatsappNumber);
            
            console.log('💾 Configuración WhatsApp guardada:', config);
        },

        // CONFIGURACIÓN ENVÍOS - CORREGIDA
        saveShippingConfig: function(e) {
            e.preventDefault();
            
            const config = {
                shippingCost: parseInt(document.getElementById('shipping-cost').value) || 0,
                freeShippingThreshold: parseInt(document.getElementById('free-shipping-threshold').value) || 0,
                shippingEnabled: document.getElementById('shipping-enabled').checked
            };

            // Guardar en storeSettings para sincronización
            const storeSettings = JSON.parse(localStorage.getItem('storeSettings') || '{}');
            Object.assign(storeSettings, config);
            localStorage.setItem('storeSettings', JSON.stringify(storeSettings));

            this.updateShippingDisplay(config);
            this.showAlert('Configuración de envíos guardada correctamente', 'success');
            this.showNotification('🚚 Configuración de envíos actualizada');
            
            console.log('💾 Configuración envíos guardada:', config);
        },

        updateShippingDisplay: function(config) {
            document.getElementById('shipping-status').textContent = 
                config.shippingEnabled ? 'Habilitado' : 'Deshabilitado';
            document.getElementById('current-shipping-cost').textContent = 
                config.shippingCost.toLocaleString();
            document.getElementById('current-free-threshold').textContent = 
                config.freeShippingThreshold.toLocaleString();
        },

        // CONFIGURACIÓN TIENDA
        saveStoreConfig: function(e) {
            e.preventDefault();
            
            const config = {
                storeName: document.getElementById('store-name').value.trim(),
                storePhone: document.getElementById('store-phone').value.trim(),
                storeDescription: document.getElementById('store-description').value.trim()
            };

            localStorage.setItem('storeSettings', JSON.stringify(config));
            this.showAlert('Configuración de la tienda guardada correctamente', 'success');
            this.showNotification('🏪 Información de tienda actualizada');
        },

        // CARGAR CONFIGURACIONES
        loadConfigurations: function() {
            // Cargar configuración WhatsApp
            const whatsappConfig = JSON.parse(localStorage.getItem('whatsappConfig') || '{}');
            const paymentNumber = localStorage.getItem('paymentWhatsAppNumber');
            
            document.getElementById('whatsapp-number').value = 
                paymentNumber || whatsappConfig.whatsappNumber || DEFAULT_CONFIG.whatsappNumber;
            document.getElementById('business-name').value = 
                whatsappConfig.businessName || DEFAULT_CONFIG.businessName;
            document.getElementById('whatsapp-welcome').value = 
                whatsappConfig.whatsappWelcome || DEFAULT_CONFIG.whatsappWelcome;
            document.getElementById('whatsapp-order').value = 
                whatsappConfig.whatsappOrder || DEFAULT_CONFIG.whatsappOrder;

            // Cargar configuración envíos
            const storeSettings = JSON.parse(localStorage.getItem('storeSettings') || '{}');
            document.getElementById('shipping-cost').value = 
                storeSettings.shippingCost || DEFAULT_CONFIG.shippingCost;
            document.getElementById('free-shipping-threshold').value = 
                storeSettings.freeShippingThreshold || DEFAULT_CONFIG.freeShippingThreshold;
            document.getElementById('shipping-enabled').checked = 
                storeSettings.shippingEnabled !== undefined ? storeSettings.shippingEnabled : DEFAULT_CONFIG.shippingEnabled;

            this.updateShippingDisplay({
                shippingCost: parseInt(document.getElementById('shipping-cost').value),
                freeShippingThreshold: parseInt(document.getElementById('free-shipping-threshold').value),
                shippingEnabled: document.getElementById('shipping-enabled').checked
            });

            // Cargar configuración tienda
            document.getElementById('store-name').value = 
                storeSettings.storeName || DEFAULT_CONFIG.storeName;
            document.getElementById('store-phone').value = 
                storeSettings.storePhone || DEFAULT_CONFIG.storePhone;
            document.getElementById('store-description').value = 
                storeSettings.storeDescription || DEFAULT_CONFIG.storeDescription;
        },

        // TEST WHATSAPP
        testWhatsAppConfig: function() {
            const phoneNumber = document.getElementById('whatsapp-number').value.trim();
            
            if (!phoneNumber) {
                this.showAlert('Primero configura un número de WhatsApp', 'error');
                return;
            }

            const message = encodeURIComponent('✅ ¡Prueba exitosa! La configuración de WhatsApp está funcionando correctamente.');
            const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
            
            window.open(whatsappUrl, '_blank');
            this.showAlert('Prueba de WhatsApp iniciada - Verifica tu teléfono', 'success');
        },

        // FUNCIONES DE PRODUCTOS
        showProductForm: function() {
            document.getElementById('product-form').style.display = 'block';
            document.getElementById('form-title').innerHTML = '<i class="fas fa-plus"></i> Agregar Nuevo Producto';
            document.getElementById('product-form-data').reset();
            document.getElementById('product-id').value = '';
            document.getElementById('image-preview').style.display = 'none';
            document.getElementById('product-image-url').value = '';
        },

        hideProductForm: function() {
            document.getElementById('product-form').style.display = 'none';
        },

        handleProductSubmit: function(e) {
            e.preventDefault();
            // Implementar lógica de guardado de productos...
            this.showAlert('Producto guardado correctamente', 'success');
            this.hideProductForm();
            this.loadProducts();
        },

        setupImageUpload: function() {
            const uploadArea = document.getElementById('upload-area');
            const fileInput = document.getElementById('product-image-upload');
            
            uploadArea.addEventListener('click', () => fileInput.click());
            
            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    this.handleImageUpload(e.target.files[0]);
                }
            });
        },

        handleImageUpload: function(file) {
            // Simular upload (en producción, subir a Back4App)
            const uploadArea = document.getElementById('upload-area');
            const progressBar = document.getElementById('upload-progress-bar');
            const progressContainer = document.getElementById('upload-progress');
            
            uploadArea.classList.add('uploading');
            progressContainer.style.display = 'block';
            
            let progress = 0;
            const interval = setInterval(() => {
                progress += 10;
                progressBar.style.width = progress + '%';
                
                if (progress >= 100) {
                    clearInterval(interval);
                    uploadArea.classList.remove('uploading');
                    progressContainer.style.display = 'none';
                    
                    // Mostrar preview
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        document.getElementById('preview-img').src = e.target.result;
                        document.getElementById('image-preview').style.display = 'block';
                        document.getElementById('product-image-url').value = e.target.result;
                    };
                    reader.readAsDataURL(file);
                    
                    this.showAlert('Imagen cargada correctamente', 'success');
                }
            }, 100);
        },

        loadProducts: function() {
            // Implementar carga de productos desde Back4App
            document.getElementById('product-count').textContent = '0';
            document.getElementById('total-products').textContent = '0';
        },

        updatePassword: function() {
            const newPassword = document.getElementById('admin-password').value;
            if (newPassword) {
                this.showAlert('Contraseña actualizada correctamente', 'success');
                document.getElementById('admin-password').value = '';
            } else {
                this.showAlert('Ingresa una nueva contraseña', 'error');
            }
        },

        showAlert: function(message, type) {
            const alert = document.getElementById('alert');
            alert.textContent = message;
            alert.className = `alert ${type}`;
            alert.style.display = 'block';
            
            setTimeout(() => {
                alert.style.display = 'none';
            }, 5000);
        },

        showNotification: function(message) {
            const notification = document.getElementById('update-notification');
            notification.querySelector('span').textContent = message;
            notification.classList.add('show');
            
            setTimeout(() => {
                notification.classList.remove('show');
            }, 3000);
        }
    };
})();

// Hacer disponible globalmente
window.admin = admin;