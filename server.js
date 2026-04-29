const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
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

// Funciones por cálculo de KPIs

// Parsear CSV
function parseCSV(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index];
            });
            data.push(row);
        }
        return data;
    } catch (error) {
        console.error('Error leyendo CSV:', error);
        return [];
    }
}

// Calcular todos los KPIs
function calcularKPIs(data) {
    if (!data || data.length === 0) {
        return null;
    }

    const kpis = {};

    // 1. Tasa de Empleabilidad Alta (TEA)
    const empleabilidadAlta = data.filter(r => r.empleabilidad && r.empleabilidad.toLowerCase() === 'alto').length;
    kpis.TEA = ((empleabilidadAlta / data.length) * 100).toFixed(1);

    // 2. Salario Promedio por Sector (SPS)
    const sectorSalarios = {};
    data.forEach(r => {
        if (r.sector_laboral && r.salario_promedio_mensual) {
            if (!sectorSalarios[r.sector_laboral]) {
                sectorSalarios[r.sector_laboral] = { total: 0, count: 0 };
            }
            sectorSalarios[r.sector_laboral].total += parseFloat(r.salario_promedio_mensual);
            sectorSalarios[r.sector_laboral].count += 1;
        }
    });

    kpis.SPS = {};
    Object.keys(sectorSalarios).forEach(sector => {
        kpis.SPS[sector] = (sectorSalarios[sector].total / sectorSalarios[sector].count).toFixed(2);
    });

    // 3. Variabilidad Salarial por Sector (CV - Coeficiente de Variación)
    kpis.CV = {};
    Object.keys(sectorSalarios).forEach(sector => {
        const salarios = data
            .filter(r => r.sector_laboral === sector && r.salario_promedio_mensual)
            .map(r => parseFloat(r.salario_promedio_mensual));
        
        if (salarios.length > 0) {
            const promedio = salarios.reduce((a, b) => a + b, 0) / salarios.length;
            const varianza = salarios.reduce((sum, sal) => sum + Math.pow(sal - promedio, 2), 0) / salarios.length;
            const desviacion = Math.sqrt(varianza);
            const cv = ((desviacion / promedio) * 100).toFixed(1);
            kpis.CV[sector] = cv;
        }
    });

    // 4. Concentración de Empleo (CDE)
    const sectorCuentas = {};
    data.forEach(r => {
        if (r.sector_laboral) {
            sectorCuentas[r.sector_laboral] = (sectorCuentas[r.sector_laboral] || 0) + 1;
        }
    });
    const maxSector = Math.max(...Object.values(sectorCuentas));
    kpis.CDE = ((maxSector / data.length) * 100).toFixed(1);

    // 5. Índice de Empleabilidad Regional (IER)
    const municipioEmpleabilidad = {};
    data.forEach(r => {
        if (r.municipio && r.empleabilidad) {
            if (!municipioEmpleabilidad[r.municipio]) {
                municipioEmpleabilidad[r.municipio] = { alto: 0, total: 0 };
            }
            municipioEmpleabilidad[r.municipio].total += 1;
            if (r.empleabilidad.toLowerCase() === 'alto') {
                municipioEmpleabilidad[r.municipio].alto += 1;
            }
        }
    });

    const municipios = Object.keys(municipioEmpleabilidad);
    const promedioEmpleabilidad = municipios.reduce((sum, mun) => {
        return sum + (municipioEmpleabilidad[mun].alto / municipioEmpleabilidad[mun].total);
    }, 0) / municipios.length;
    kpis.IER = (promedioEmpleabilidad * 100).toFixed(1);

    // 6. Tasa de Crecimiento Salarial (TCS)
    // Comparar últimos 2 períodos
    const meses = new Map();
    data.forEach(r => {
        if (r.fecha_registro && r.salario_promedio_mensual) {
            const mes = r.fecha_registro.substring(0, 7); // YYYY-MM
            if (!meses.has(mes)) {
                meses.set(mes, []);
            }
            meses.get(mes).push(parseFloat(r.salario_promedio_mensual));
        }
    });

    const mesesOrdenados = Array.from(meses.keys()).sort();
    let tcs = 0;
    if (mesesOrdenados.length >= 2) {
        const mesMasReciente = mesesOrdenados[mesesOrdenados.length - 1];
        const mesAnterior = mesesOrdenados[mesesOrdenados.length - 2];
        
        const promedioReciente = meses.get(mesMasReciente).reduce((a, b) => a + b, 0) / meses.get(mesMasReciente).length;
        const promedioAnterior = meses.get(mesAnterior).reduce((a, b) => a + b, 0) / meses.get(mesAnterior).length;
        
        tcs = (((promedioReciente - promedioAnterior) / promedioAnterior) * 100).toFixed(2);
    }
    kpis.TCS = tcs;

    // 7. Saturación del Mercado Laboral (SML)
    const empleabilidadBaja = data.filter(r => r.empleabilidad && r.empleabilidad.toLowerCase() === 'bajo').length;
    kpis.SML = ((empleabilidadBaja / data.length) * 100).toFixed(1);

    // 8. Salario Mínimo vs Máximo (Brecha Salarial)
    const salarios = data
        .filter(r => r.salario_promedio_mensual)
        .map(r => parseFloat(r.salario_promedio_mensual));
    
    let brechaSalarial = 0;
    if (salarios.length > 0) {
        const minSalario = Math.min(...salarios);
        const maxSalario = Math.max(...salarios);
        brechaSalarial = (((maxSalario - minSalario) / minSalario) * 100).toFixed(1);
    }
    kpis.BS = brechaSalarial;

    // 9. Densidad de Registros por Municipio (DRM)
    const municipioRegistros = {};
    const fechas = new Set();
    data.forEach(r => {
        if (r.municipio) {
            municipioRegistros[r.municipio] = (municipioRegistros[r.municipio] || 0) + 1;
        }
        if (r.fecha_registro) {
            fechas.add(r.fecha_registro.substring(0, 7)); // Contar meses únicos
        }
    });

    kpis.DRM = {};
    Object.keys(municipioRegistros).forEach(mun => {
        kpis.DRM[mun] = (municipioRegistros[mun] / fechas.size).toFixed(2);
    });

    // 10. Demanda vs Oferta por Sector (D/O)
    const empleabilidadAltoSector = {};
    const empleabilidadBajoSector = {};
    
    data.forEach(r => {
        if (r.sector_laboral) {
            if (r.empleabilidad && r.empleabilidad.toLowerCase() === 'alto') {
                empleabilidadAltoSector[r.sector_laboral] = (empleabilidadAltoSector[r.sector_laboral] || 0) + 1;
            }
            if (r.empleabilidad && r.empleabilidad.toLowerCase() === 'bajo') {
                empleabilidadBajoSector[r.sector_laboral] = (empleabilidadBajoSector[r.sector_laboral] || 0) + 1;
            }
        }
    });

    kpis.DO = {};
    const todosLosSectores = new Set([...Object.keys(empleabilidadAltoSector), ...Object.keys(empleabilidadBajoSector)]);
    todosLosSectores.forEach(sector => {
        const alto = empleabilidadAltoSector[sector] || 0;
        const bajo = empleabilidadBajoSector[sector] || 0;
        kpis.DO[sector] = bajo > 0 ? (alto / bajo).toFixed(2) : (alto > 0 ? 'N/A' : '0');
    });

    return kpis;
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
 * GET /api/kpis - Obtener todos los KPIs
 */
app.get('/api/kpis', (req, res) => {
    try {
        const csvPath = path.join(__dirname, 'observatorio_laboral_oaxaca.csv');
        const data = parseCSV(csvPath);
        
        if (data.length === 0) {
            return res.status(400).json({
                error: 'No se encontraron datos'
            });
        }

        const kpis = calcularKPIs(data);
        
        // Crear array con demanda vs oferta para las gráficas
        const demandaOfertaPorSector = [];
        const sectorAlto = {};
        const sectorBajo = {};
        
        data.forEach(r => {
            if (r.sector_laboral) {
                if (!sectorAlto[r.sector_laboral]) sectorAlto[r.sector_laboral] = 0;
                if (!sectorBajo[r.sector_laboral]) sectorBajo[r.sector_laboral] = 0;
                
                if (r.empleabilidad && r.empleabilidad.toLowerCase() === 'alto') {
                    sectorAlto[r.sector_laboral]++;
                } else if (r.empleabilidad && r.empleabilidad.toLowerCase() === 'bajo') {
                    sectorBajo[r.sector_laboral]++;
                }
            }
        });
        
        Object.keys(sectorAlto).forEach(sector => {
            const alto = sectorAlto[sector];
            const bajo = sectorBajo[sector] || 0;
            demandaOfertaPorSector.push({
                sector: sector,
                alto: alto,
                bajo: bajo,
                ratio: parseFloat((bajo > 0 ? (alto / bajo).toFixed(2) : (alto > 0 ? '2.5' : '0')))
            });
        });
        
        res.json({
            success: true,
            message: 'KPIs calculados correctamente',
            totalRegistros: data.length,
            kpis: kpis,
            demandaOfertaPorSector: demandaOfertaPorSector,
            rawData: data  // Enviar datos crudos para gráficas
        });
    } catch (error) {
        console.error('❌ Error calculando KPIs:', error);
        res.status(500).json({
            error: 'Error calculando KPIs',
            details: error.message
        });
    }
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
