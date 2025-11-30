// back4app-sync.js - Conexión y sincronización con Back4App

// Inicializar Parse SDK
Parse.initialize(PARSE_CONFIG.applicationId, PARSE_CONFIG.javascriptKey);
Parse.serverURL = PARSE_CONFIG.serverURL;

// Definir clases de Parse
const Product = Parse.Object.extend("Product");
const Order = Parse.Object.extend("Order");
const Config = Parse.Object.extend("Config");

// Funciones para productos
const ProductManager = {
    // Obtener todos los productos
    async getAllProducts() {
        try {
            const query = new Parse.Query(Product);
            query.equalTo("active", true);
            query.include("category");
            const results = await query.find();
            
            return results.map(product => ({
                id: product.id,
                name: product.get("name"),
                price: product.get("price"),
                description: product.get("description"),
                category: product.get("category"),
                image: product.get("image"),
                stock: product.get("stock") || 0,
                active: product.get("active"),
                createdAt: product.createdAt
            }));
        } catch (error) {
            console.error("Error loading products:", error);
            throw error;
        }
    },

    // Crear nuevo producto
    async createProduct(productData) {
        try {
            const product = new Product();
            product.set("name", productData.name);
            product.set("price", parseFloat(productData.price));
            product.set("description", productData.description);
            product.set("category", productData.category);
            product.set("stock", parseInt(productData.stock));
            product.set("active", true);
            
            if (productData.image) {
                product.set("image", productData.image);
            }
            
            await product.save();
            return product;
        } catch (error) {
            console.error("Error creating product:", error);
            throw error;
        }
    },

    // Actualizar producto
    async updateProduct(productId, productData) {
        try {
            const query = new Parse.Query(Product);
            const product = await query.get(productId);
            
            product.set("name", productData.name);
            product.set("price", parseFloat(productData.price));
            product.set("description", productData.description);
            product.set("category", productData.category);
            product.set("stock", parseInt(productData.stock));
            
            if (productData.image) {
                product.set("image", productData.image);
            }
            
            await product.save();
            return product;
        } catch (error) {
            console.error("Error updating product:", error);
            throw error;
        }
    },

    // Eliminar producto (desactivar)
    async deleteProduct(productId) {
        try {
            const query = new Parse.Query(Product);
            const product = await query.get(productId);
            product.set("active", false);
            await product.save();
            return true;
        } catch (error) {
            console.error("Error deleting product:", error);
            throw error;
        }
    }
};

// Funciones para órdenes/pedidos
const OrderManager = {
    async createOrder(orderData) {
        try {
            const order = new Order();
            order.set("customerName", orderData.customerName);
            order.set("customerPhone", orderData.customerPhone);
            order.set("products", orderData.products);
            order.set("total", orderData.total);
            order.set("shippingCost", orderData.shippingCost);
            order.set("status", "pending");
            order.set("notes", orderData.notes);
            
            await order.save();
            return order;
        } catch (error) {
            console.error("Error creating order:", error);
            throw error;
        }
    },

    async getTodayOrders() {
        try {
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);
            
            const endOfDay = new Date();
            endOfDay.setHours(23, 59, 59, 999);
            
            const query = new Parse.Query(Order);
            query.greaterThanOrEqualTo("createdAt", startOfDay);
            query.lessThan("createdAt", endOfDay);
            
            return await query.count();
        } catch (error) {
            console.error("Error getting today orders:", error);
            return 0;
        }
    },

    async getTotalRevenue() {
        try {
            const query = new Parse.Query(Order);
            query.equalTo("status", "completed");
            const results = await query.find();
            
            return results.reduce((total, order) => total + (order.get("total") || 0), 0);
        } catch (error) {
            console.error("Error calculating revenue:", error);
            return 0;
        }
    }
};

// Funciones para configuración
const ConfigManager = {
    async getConfig() {
        try {
            const query = new Parse.Query(Config);
            const config = await query.first();
            return config;
        } catch (error) {
            console.error("Error getting config:", error);
            return null;
        }
    },

    async saveConfig(configData) {
        try {
            let config = await this.getConfig();
            if (!config) {
                config = new Config();
            }
            
            config.set("whatsappNumber", configData.whatsappNumber);
            config.set("businessName", configData.businessName);
            config.set("welcomeMessage", configData.welcomeMessage);
            config.set("orderTemplate", configData.orderTemplate);
            config.set("storeName", configData.storeName);
            config.set("storeDescription", configData.storeDescription);
            config.set("shippingCost", configData.shippingCost);
            config.set("freeShippingThreshold", configData.freeShippingThreshold);
            config.set("shippingEnabled", configData.shippingEnabled);
            
            await config.save();
            return config;
        } catch (error) {
            console.error("Error saving config:", error);
            throw error;
        }
    }
};

// Exportar para uso global
window.ProductManager = ProductManager;
window.OrderManager = OrderManager;
window.ConfigManager = ConfigManager;