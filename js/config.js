// config.js - Configuración de Back4App
const PARSE_CONFIG = {
    applicationId: "lis7ZowK41rXBupd44AVV9HvKTeKETBLyAw04nKH",
    javascriptKey: "Cs0tZ8O0r54sttJRRtgOoPH3uzN3v1hp3wzX5IVe",
    serverURL: "https://parseapi.back4app.com/"
};

// Configuración de WhatsApp
const WHATSAPP_CONFIG = {
    phoneNumber: "5493624366733",
    businessName: "DISTRIMAX",
    welcomeMessage: "¡Hola! Bienvenido a DISTRIMAX. ¿En qué puedo ayudarte?",
    orderTemplate: "Pedido recibido! Productos: {productos} Total: ${total}"
};

// Configuración de la tienda
const STORE_CONFIG = {
    name: "DISTRIMAX - Descartables y más",
    description: "Tu tienda online de confianza en productos descartables y más.",
    shippingCost: 5000,
    freeShippingThreshold: 50000,
    shippingEnabled: true
};

// Credenciales de administrador (¡CAMBIAR EN PRODUCCIÓN!)
const ADMIN_CREDENTIALS = {
    username: "admin",
    password: "admin123" // Cambiar por una contraseña segura
};