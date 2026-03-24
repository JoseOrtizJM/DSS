const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const DB_NAME = 'data_lakehouse';
const COLLECTION_NAME = 'transformaciones';

let mongoClient;
let db;

// Middleware
app.use(cors());
app.use(express.json());

// Conectar a MongoDB
async function connectToMongo() {
    try {
        mongoClient = new MongoClient(MONGO_URI);
        await mongoClient.connect();
        db = mongoClient.db(DB_NAME);
        console.log('✅ Conectado a MongoDB correctamente');
    } catch (error) {
        console.error('❌ Error conectando a MongoDB:', error);
        process.exit(1);
    }
}

// Rutas

/**
 * GET / - Health check
 */
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Data Lakehouse Backend - Server running',
        database: db ? 'Conectado' : 'Desconectado'
    });
});

/**
 * POST /api/save-data - Guardar datos transformados en MongoDB
 */
app.post('/api/save-data', async (req, res) => {
    try {
        const { fileName, data, timestamp } = req.body;

        // Validar datos
        if (!fileName || !data || !Array.isArray(data)) {
            return res.status(400).json({
                error: 'Datos inválidos. Se requieren fileName y data (array)'
            });
        }

        if (data.length === 0) {
            return res.status(400).json({
                error: 'El archivo no contiene datos'
            });
        }

        const collection = db.collection(COLLECTION_NAME);

        // Crear documento para guardar
        const document = {
            fileName,
            totalRecords: data.length,
            data,
            createdAt: timestamp || new Date().toISOString(),
            processedAt: new Date()
        };

        // Insertar en MongoDB
        const result = await collection.insertOne(document);

        console.log(`✅ Datos guardados: ${fileName} (${data.length} registros) - ID: ${result.insertedId}`);

        res.json({
            success: true,
            message: 'Datos guardados en MongoDB correctamente',
            insertedId: result.insertedId,
            recordCount: data.length,
            fileName
        });
    } catch (error) {
        console.error('❌ Error guardando datos:', error);
        res.status(500).json({
            error: 'Error guardando datos en MongoDB',
            details: error.message
        });
    }
});

/**
 * GET /api/data - Obtener todas las transformaciones guardadas
 */
app.get('/api/data', async (req, res) => {
    try {
        const collection = db.collection(COLLECTION_NAME);
        
        // Obtener solo los metadatos (sin los datos completos)
        const documents = await collection
            .find({})
            .project({
                fileName: 1,
                totalRecords: 1,
                createdAt: 1,
                processedAt: 1,
                _id: 1
            })
            .sort({ processedAt: -1 })
            .limit(50)
            .toArray();

        res.json({
            success: true,
            count: documents.length,
            data: documents
        });
    } catch (error) {
        console.error('❌ Error obteniendo datos:', error);
        res.status(500).json({
            error: 'Error obteniendo datos',
            details: error.message
        });
    }
});

/**
 * GET /api/data/:id - Obtener una transformación específica
 */
app.get('/api/data/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Validar que sea un ObjectID válido
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                error: 'ID inválido'
            });
        }

        const collection = db.collection(COLLECTION_NAME);
        const document = await collection.findOne({
            _id: new ObjectId(id)
        });

        if (!document) {
            return res.status(404).json({
                error: 'Transformación no encontrada'
            });
        }

        res.json({
            success: true,
            data: document
        });
    } catch (error) {
        console.error('❌ Error obteniendo dato:', error);
        res.status(500).json({
            error: 'Error obteniendo dato',
            details: error.message
        });
    }
});

/**
 * DELETE /api/data/:id - Eliminar una transformación
 */
app.delete('/api/data/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                error: 'ID inválido'
            });
        }

        const collection = db.collection(COLLECTION_NAME);
        const result = await collection.deleteOne({
            _id: new ObjectId(id)
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({
                error: 'Transformación no encontrada'
            });
        }

        res.json({
            success: true,
            message: 'Transformación eliminada correctamente'
        });
    } catch (error) {
        console.error('❌ Error eliminando dato:', error);
        res.status(500).json({
            error: 'Error eliminando dato',
            details: error.message
        });
    }
});

// Manejador de errores global
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Error interno del servidor',
        details: err.message
    });
});

// Ruta 404
app.use((req, res) => {
    res.status(404).json({
        error: 'Ruta no encontrada',
        path: req.path
    });
});

// Iniciar servidor
async function startServer() {
    try {
        // Conectar a MongoDB
        await connectToMongo();

        // Escuchar en el puerto
        app.listen(PORT, () => {
            console.log('\n═══════════════════════════════════════');
            console.log('🚀 Data Lakehouse Backend iniciado');
            console.log(`📍 Servidor ejecutándose en: http://localhost:${PORT}`);
            console.log(`🗄️  Base de datos: ${DB_NAME}`);
            console.log(`📚 Colección: ${COLLECTION_NAME}`);
            console.log('═══════════════════════════════════════\n');
        });
    } catch (error) {
        console.error('❌ Error iniciando servidor:', error);
        process.exit(1);
    }
}

// Manejo de cierre graceful
process.on('SIGINT', async () => {
    console.log('\n\n⏹️  Cerrando servidor...');
    if (mongoClient) {
        await mongoClient.close();
        console.log('✅ Conexión a MongoDB cerrada');
    }
    process.exit(0);
});

// Iniciar la aplicación
startServer();
