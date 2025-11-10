// backend/services/syncService.js
import { WebSocketServer } from 'ws';

class SyncService {
    constructor() {
        this.connectedDevices = new Map();
        this.wss = null;
    }

    start(server) {
        this.wss = new WebSocketServer({ server });
        
        this.wss.on('connection', (ws, req) => {
            const deviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            console.log(`📱 Dispositivo conectado: ${deviceId}`);
            
            this.connectedDevices.set(deviceId, ws);
            
            // Enviar mensaje de bienvenida
            ws.send(JSON.stringify({
                type: 'CONNECTED',
                deviceId: deviceId,
                message: 'Conectado a la tienda WhatsApp'
            }));
            
            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data);
                    this.handleMessage(message, deviceId);
                } catch (error) {
                    console.error('Error procesando mensaje:', error);
                }
            });
            
            ws.on('close', () => {
                console.log(`📱 Dispositivo desconectado: ${deviceId}`);
                this.connectedDevices.delete(deviceId);
                this.notifyDeviceCount();
            });
            
            this.notifyDeviceCount();
        });
        
        console.log('🚀 Servicio de sincronización listo para múltiples dispositivos');
    }

    handleMessage(message, deviceId) {
        switch (message.type) {
            case 'PRODUCT_UPDATED':
                this.broadcast({
                    type: 'PRODUCT_UPDATED',
                    product: message.product,
                    updatedBy: deviceId,
                    timestamp: new Date().toISOString()
                });
                break;
                
            case 'ORDER_CREATED':
                this.broadcast({
                    type: 'ORDER_CREATED', 
                    order: message.order,
                    createdBy: deviceId,
                    timestamp: new Date().toISOString()
                });
                break;
                
            case 'STOCK_UPDATED':
                this.broadcast({
                    type: 'STOCK_UPDATED',
                    productId: message.productId,
                    newStock: message.newStock,
                    updatedBy: deviceId,
                    timestamp: new Date().toISOString()
                });
                break;
        }
    }

    // Notificar a TODOS los dispositivos
    broadcast(message) {
        const messageStr = JSON.stringify(message);
        
        this.connectedDevices.forEach((ws, deviceId) => {
            if (ws.readyState === ws.OPEN) {
                ws.send(messageStr);
            }
        });
        
        console.log(`📢 Mensaje broadcast a ${this.connectedDevices.size} dispositivos:`, message.type);
    }

    // Notificar conteo de dispositivos
    notifyDeviceCount() {
        this.broadcast({
            type: 'DEVICE_COUNT',
            count: this.connectedDevices.size,
            timestamp: new Date().toISOString()
        });
    }

    // Métodos helpers para notificar cambios específicos
    notifyProductUpdated(product) {
        this.broadcast({
            type: 'PRODUCT_UPDATED',
            product: product,
            timestamp: new Date().toISOString()
        });
    }

    notifyOrderCreated(order) {
        this.broadcast({
            type: 'ORDER_CREATED',
            order: order,
            timestamp: new Date().toISOString()
        });
    }

    notifyStockUpdated(productId, newStock) {
        this.broadcast({
            type: 'STOCK_UPDATED',
            productId: productId,
            newStock: newStock,
            timestamp: new Date().toISOString()
        });
    }
}

export const syncService = new SyncService();