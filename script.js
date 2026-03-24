// Estado de la aplicación
let appState = {
    currentMenu: 'extraccion',
    currentDataType: null,
    selectedFile: null,
    transformedData: null
};

// Configuración de tipos de datos
const dataTypes = {
    internos: {
        name: 'Datos Internos',
        formats: ['txt', 'pdf'],
        icon: '📋',
        description: 'Carga encuestas no estructuradas en TXT o PDF',
        expectedFormat: 'Archivo PDF o TXT con encuestas. Máximo 100MB.'
    },
    externos: {
        name: 'Datos Externos',
        formats: ['csv', 'xml'],
        icon: '📊',
        description: 'Carga datos externos desde CSV o XML',
        expectedFormat: 'Archivo CSV o XML con datos estructurados. Máximo 100MB.'
    },
    correcciones: {
        name: 'Correcciones',
        formats: ['csv', 'xml'],
        icon: '✏️',
        description: 'Revisa y corrige datos (capitalización, estándares, abreviaciones)',
        expectedFormat: 'Archivo CSV o XML para revisar y corregir. Máximo 100MB.'
    }
};

// Elementos del DOM
const extraccionBtn = document.getElementById('extraccion-btn');
const submenuExtraccion = document.getElementById('submenu-extraccion');
const uploadArea = document.getElementById('upload-area');
const fileInput = document.getElementById('file-input');
const fileInfo = document.getElementById('file-info');
const uploadDescription = document.getElementById('upload-description');
const fileTypeS = document.getElementById('file-types');
const uploadSection = document.getElementById('upload-section');
const breadcrumb = document.getElementById('breadcrumb');
const expectedFormat = document.getElementById('expected-format');
const formatDescription = document.getElementById('format-description');
const previewSection = document.getElementById('preview-section');
const previewContainer = document.getElementById('preview-container');
const btnClosePreview = document.getElementById('btn-close-preview');
const btnTransform = document.getElementById('btn-transform');
const btnCancel = document.getElementById('btn-cancel');
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');

// Event Listeners para menús principales
extraccionBtn.addEventListener('click', () => switchMenu('extraccion'));

// Event Listeners para submenús
document.querySelectorAll('#submenu-extraccion .submenu-btn').forEach(btn => {
    btn.addEventListener('click', handleDataTypeSelection);
});

// Cambiar menú principal
function switchMenu(menu) {
    appState.currentMenu = menu;
    breadcrumb.textContent = 'Extracción';
    
    // Resetear selección
    document.querySelectorAll('.submenu-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    appState.currentDataType = null;
    resetUploadSection();
}

// Seleccionar tipo de dato
function handleDataTypeSelection(e) {
    const btn = e.currentTarget;
    const dataType = btn.getAttribute('data-type');
    
    // Actualizar botón activo
    document.querySelectorAll('.submenu-btn').forEach(b => {
        b.classList.remove('active');
    });
    btn.classList.add('active');
    
    // Actualizar estado
    appState.currentDataType = dataType;
    
    // Actualizar sección de carga
    updateUploadSection(dataType);
}

// Actualizar sección de carga
function updateUploadSection(dataType) {
    const config = dataTypes[dataType];
    const allowedFormats = config.formats.map(f => f.toUpperCase()).join(', ');
    
    uploadDescription.textContent = config.description;
    fileTypeS.textContent = `Tipos soportados: ${allowedFormats} (Máx 100MB)`;
    formatDescription.textContent = config.expectedFormat;
    expectedFormat.style.display = 'block';
    
    // Actualizar breadcrumb
    breadcrumb.textContent = `${appState.currentMenu.charAt(0).toUpperCase() + appState.currentMenu.slice(1)} → ${config.name}`;
    
    // Resetear archivo
    resetFileInfo();
}

// Resetear sección de carga
function resetUploadSection() {
    uploadDescription.textContent = 'Selecciona una opción para comenzar';
    fileTypeS.textContent = 'Tipos soportados: CSV, XML, PDF, TXT (Máx 100MB)';
    expectedFormat.style.display = 'none';
    resetFileInfo();
    breadcrumb.textContent = appState.currentMenu.charAt(0).toUpperCase() + appState.currentMenu.slice(1);
}

// Resetear información de archivo
function resetFileInfo() {
    fileInfo.style.display = 'none';
    appState.selectedFile = null;
    fileInput.value = '';
    previewSection.style.display = 'none';
}

// Manejadores de carga de archivo
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
    
    if (!appState.currentDataType) {
        alert('Por favor selecciona un tipo de datos primero');
        return;
    }
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFileSelection(files[0]);
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFileSelection(e.target.files[0]);
    }
});

// Manejar selección de archivo
function handleFileSelection(file) {
    if (!appState.currentDataType) {
        alert('Por favor selecciona un tipo de datos primero');
        return;
    }
    
    // Validar tipo
    const config = dataTypes[appState.currentDataType];
    const fileExt = file.name.split('.').pop().toLowerCase();
    
    if (!config.formats.includes(fileExt)) {
        alert(`❌ Tipo de archivo no válido. Se esperan: ${config.formats.join(', ')}`);
        return;
    }
    
    // Validar tamaño (100MB)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
        alert('❌ El archivo excede el tamaño máximo de 100MB');
        return;
    }
    
    // Guardar archivo
    appState.selectedFile = file;
    showFileInfo(file);
}

// Mostrar información del archivo
function showFileInfo(file) {
    const fileName = document.getElementById('file-name');
    const fileSize = document.getElementById('file-size');
    const fileType = document.getElementById('file-type');
    const fileExt = file.name.split('.').pop().toUpperCase();
    
    fileName.textContent = `📄 ${file.name}`;
    fileSize.textContent = `Tamaño: ${formatFileSize(file.size)}`;
    fileType.textContent = `Tipo: ${fileExt}`;
    
    fileInfo.style.display = 'flex';
    
    // Mostrar botón Transformar solo si es archivo CSV o XML (datos externos)
    if (appState.currentDataType === 'externos' && (fileExt === 'CSV' || fileExt === 'XML')) {
        btnTransform.style.display = 'block';
    } else {
        btnTransform.style.display = 'none';
    }
    
    // Generar previsualización
    generatePreview(file);
}

// Formatear tamaño de archivo
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Generar previsualización según tipo de archivo
function generatePreview(file) {
    const fileExt = file.name.split('.').pop().toLowerCase();
    
    // Si estamos en modo correcciones, usar función especial
    if (appState.currentDataType === 'correcciones') {
        handleCorrectionsPreview(file);
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
        const content = e.target.result;
        let previewHTML = '';
        
        if (fileExt === 'csv') {
            previewHTML = generateCSVPreview(content);
        } else if (fileExt === 'xml') {
            previewHTML = generateXMLPreview(content);
        } else if (fileExt === 'txt') {
            previewHTML = generateTXTPreview(content);
        } else if (fileExt === 'pdf') {
            previewHTML = '<div class="preview-info-message">📄 Los archivos PDF no pueden ser previsualizados en este navegador. Por favor, verifica que sea el archivo correcto antes de procesarlo.</div>';
        }
        
        previewContainer.innerHTML = previewHTML;
        previewSection.style.display = 'block';
    };
    
    reader.onerror = () => {
        previewContainer.innerHTML = '<div class="preview-info-message" style="background: #f8d7da; border-left-color: #f5c6cb; color: #721c24;">❌ Error al leer el archivo. Intenta con otro archivo.</div>';
        previewSection.style.display = 'block';
    };
    
    reader.readAsText(file);
}

// Generar previsualización de CSV
function generateCSVPreview(content) {
    const lines = content.trim().split('\n');
    
    let html = '<table class="preview-table"><thead><tr>';
    
    // Encabezados
    const headers = lines[0].split(',');
    headers.forEach(header => {
        html += `<th>${escapeHTML(header.trim())}</th>`;
    });
    html += '</tr></thead><tbody>';
    
    // Mostrar TODAS las filas
    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === '') continue; // Omitir líneas vacías
        const cells = lines[i].split(',');
        html += '<tr>';
        cells.forEach(cell => {
            html += `<td>${escapeHTML(cell.trim())}</td>`;
        });
        html += '</tr>';
    }
    
    html += '</tbody></table>';
    
    // Mensaje informativo
    const totalRows = lines.length - 1;
    if (totalRows > 0) {
        html += `<div class="preview-rows-limit">📊 Total: ${totalRows} filas de datos</div>`;
    }
    
    return html;
}

// Generar previsualización de XML
function generateXMLPreview(content) {
    const lines = content.trim().split('\n');
    let html = '<div class="preview-text">';
    
    // Mostrar TODAS las líneas
    for (let i = 0; i < lines.length; i++) {
        html += escapeHTML(lines[i]) + '\n';
    }
    
    html += `\n📊 Total: ${lines.length} líneas del archivo SQL</div>`;
    return html;
}

// Generar previsualización de TXT
function generateTXTPreview(content) {
    const lines = content.trim().split('\n');
    let html = '<div class="preview-text">';
    
    // Mostrar TODO el contenido
    for (let i = 0; i < lines.length; i++) {
        html += escapeHTML(lines[i]) + '\n';
    }
    
    html += `\n📄 Total: ${lines.length} líneas del documento</div>`;
    return html;
}

// Escapar caracteres HTML para evitar inyecciones
function escapeHTML(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Ocultar previsualización
function hidePreview() {
    previewSection.style.display = 'none';
}

// ========== FUNCIONES DE CORRECCIÓN DE DATOS ==========

// Diccionario de normalizaciones específicas de municipios
const municipiosMap = {
    'oaxaca capital': 'Oaxaca de Juárez',
    'juarez': 'Oaxaca de Juárez',
    'oaxaca': 'Oaxaca de Juárez'
};

// Diccionario de niveles educativos
const educacionMap = {
    'prof.univ.': 'Profesional Universitario',
    'prof. univ.': 'Profesional Universitario',
    'lic.completa': 'Licenciatura Completa',
    'lic. completa': 'Licenciatura Completa',
    'licenciatura completo': 'Licenciatura Completa',
    'licenciatura completa': 'Licenciatura Completa',
    'licenciatura': 'Licenciatura Completa',
    'lic en': 'Licenciatura en',
    'lic.': 'Licenciatura',
    'tecnico': 'Técnico',
    'técnico': 'Técnico',
    'tec.': 'Técnico',
    'tec': 'Técnico',
    'primaria incompleta': 'Primaria Incompleta',
    'primaria': 'Primaria',
    'secundaria': 'Secundaria',
    'bachillerato': 'Bachillerato'
};

// Capitalizar universidades y todas sus palabras
function capitalizarUniversidad(universidad) {
    if (!universidad) return '';
    return universidad
        .toLowerCase()
        .split(' ')
        .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
        .join(' ');
}

// Capitalizar primer carácter de cada palabra
function capitalizarPalabras(texto) {
    if (!texto) return '';
    return texto
        .toLowerCase()
        .split(' ')
        .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
        .join(' ');
}

// Normalizar municipios
function normalizarMunicipio(municipio) {
    if (!municipio) return '';
    const municipioLower = municipio.toLowerCase().trim();
    return municipiosMap[municipioLower] || capitalizarPalabras(municipio);
}

// Normalizar educación
function normalizarEducacion(educacion) {
    if (!educacion) return '';
    const eduLower = educacion.toLowerCase().trim();
    
    // Buscar coincidencias exactas primero
    if (educacionMap[eduLower]) {
        return educacionMap[eduLower];
    }
    
    // Buscar coincidencias parciales
    for (const [key, value] of Object.entries(educacionMap)) {
        if (eduLower.includes(key)) {
            return value;
        }
    }
    
    // Si no hay coincidencia, capitalizar
    return capitalizarPalabras(educacion);
}

// Procesar CSV para correcciones
function processCSVCorrections(content) {
    const lines = content.trim().split('\n');
    if (lines.length === 0) return lines;
    
    // Procesar encabezados
    const headers = lines[0].split(',');
    const correctedLines = [lines[0]]; // Mantener encabezado igual
    
    // Procesar datos
    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === '') continue;
        
        let cells = lines[i].split(',');
        let correctedRow = [...cells];
        
        // Aplicar correcciones a cada celda
        for (let j = 0; j < cells.length; j++) {
            const header = headers[j].toLowerCase();
            let cellValue = cells[j].trim();
            
            // Normalizar municipios
            if (header.includes('municipio') || header.includes('ciudad')) {
                cellValue = normalizarMunicipio(cellValue);
            }
            // Capitalizar universidades
            else if (header.includes('universidad')) {
                cellValue = capitalizarUniversidad(cellValue);
            }
            // Normalizar educación/académica
            else if (header.includes('educativo') || header.includes('academica') || header.includes('carrera') || header.includes('nivel')) {
                cellValue = normalizarEducacion(cellValue);
            }
            // Capitalizar otros campos
            else if (!header.includes('id') && !header.includes('fecha') && !header.includes('salario') && !header.includes('tasa') && !header.includes('semestres') && !header.includes('modalidad')) {
                cellValue = capitalizarPalabras(cellValue);
            }
            
            correctedRow[j] = cellValue;
        }
        
        correctedLines.push(correctedRow.join(','));
    }
    
    return correctedLines.join('\n');
}

// Generar previsualización de correcciones para CSV
function generateCorrectionsPreview(content) {
    const correctedContent = processCSVCorrections(content);
    const correctedLines = correctedContent.split('\n');
    const originalLines = content.trim().split('\n');
    
    // Inicializar HTML con título
    let html = '<div style="margin-bottom: 20px;"><strong>📌 Vista previa de correcciones:</strong></div>';
    
    // Tabla de datos corregidos
    html += '<table class="preview-table"><thead><tr>';
    const headers = correctedLines[0].split(',');
    headers.forEach(header => {
        html += `<th>${escapeHTML(header.trim())}</th>`;
    });
    html += '</tr></thead><tbody>';
    
    // Mostrar todas las filas corregidas
    for (let i = 1; i < correctedLines.length; i++) {
        if (correctedLines[i].trim() === '') continue;
        const cells = correctedLines[i].split(',');
        html += '<tr>';
        cells.forEach(cell => {
            html += `<td style="background-color: #d4edda;">${escapeHTML(cell.trim())}</td>`;
        });
        html += '</tr>';
    }
    
    html += '</tbody></table>';
    
    // Mostrar cambios realizados
    html += '<div style="margin-top: 20px; padding: 15px; background: #e7f3ff; border-left: 4px solid #667eea; border-radius: 6px;">';
    html += '<strong>✅ Correcciones Aplicadas:</strong><ul style="margin: 10px 0; padding-left: 20px;">';
    html += '<li>✓ Normalización de municipios (ej: juarez → Oaxaca de Juárez)</li>';
    html += '<li>✓ Unificación de niveles educativos (ej: lic.completa → Licenciatura Completa)</li>';
    html += '<li>✓ Capitalización de primera letra en campos de texto</li>';
    html += '<li>✓ Eliminación de espacios extra e inconsistencias</li>';
    html += '</ul></div>';
    
    return html;
}

// Detectar si es CSV y generar previsualización de correcciones
function handleCorrectionsPreview(file) {
    const fileExt = file.name.split('.').pop().toLowerCase();
    const reader = new FileReader();
    
    reader.onload = (e) => {
        const content = e.target.result;
        let previewHTML = '';
        
        if (fileExt === 'csv') {
            previewHTML = generateCorrectionsPreview(content);
        } else if (fileExt === 'xml') {
            previewHTML = '<div class="preview-info-message">📄 Las correcciones para archivos XML serán mostradas en su estructura actualizada. Los datos serán normalizados según los mismos criterios que CSV.</div>';
        }
        
        previewContainer.innerHTML = previewHTML;
        previewSection.style.display = 'block';
    };
    
    reader.onerror = () => {
        previewContainer.innerHTML = '<div class="preview-info-message" style="background: #f8d7da; border-left-color: #f5c6cb; color: #721c24;">❌ Error al leer el archivo.</div>';
        previewSection.style.display = 'block';
    };
    
    reader.readAsText(file);
}

// Ocultar secciones no necesarias si es correcciones
function handleCorreccionesMode() {
    // Mostrar previsualización de correcciones en lugar de la preview estándar
    const currentFile = appState.selectedFile;
    if (currentFile) {
        handleCorrectionsPreview(currentFile);
    }
}

// Función para realizar transformación
function performTransformation() {
    if (!appState.selectedFile) {
        alert('Por favor selecciona un archivo primero');
        return;
    }
    
    const fileExt = appState.selectedFile.name.split('.').pop().toLowerCase();
    
    if (fileExt === 'csv') {
        handleCSVTransformation();
    } else if (fileExt === 'xml') {
        handleXMLTransformation();
    } else {
        alert('❌ Tipo de archivo no soportado para transformación');
    }
}

// Manejar transformación de CSV
function handleCSVTransformation() {
    const reader = new FileReader();
    
    reader.onload = (e) => {
        const content = e.target.result;
        const correctedContent = processCSVCorrections(content);
        
        // Guardar datos transformados en el estado
        appState.transformedData = correctedContent;
        
        // Mostrar preview de correcciones
        const correctionPreview = generateCorrectionsPreview(content);
        
        // Agregar botón para guardar en MongoDB
        const saveButton = `
            <div style="margin-top: 20px; padding: 15px; background: #e8f5e9; border-left: 4px solid #4caf50; border-radius: 4px;">
                <p style="margin: 0 0 10px 0; color: #2e7d32; font-weight: 600;">✅ Transformación completada</p>
                <button id="btn-save-mongodb" class="btn-action" style="background: linear-gradient(135deg, #4caf50 0%, #45a049 100%); margin-top: 10px;">💾 Guardar en MongoDB</button>
            </div>
        `;
        
        previewContainer.innerHTML = correctionPreview + saveButton;
        previewSection.style.display = 'block';
        
        // Agregar evento al botón de guardar
        document.getElementById('btn-save-mongodb').addEventListener('click', saveToMongoDB);
    };
    
    reader.readAsText(appState.selectedFile);
}

// Manejar transformación de XML
function handleXMLTransformation() {
    const reader = new FileReader();
    
    reader.onload = (e) => {
        const content = e.target.result;
        // Para XML, simplemente mostrar mensaje
        previewContainer.innerHTML = '<div class="preview-info-message">✅ Las transformaciones para archivos XML se mostrarán aquí. Por ahora, revisa los datos en la previsualización anterior.</div>';
        previewSection.style.display = 'block';
    };
    
    reader.readAsText(appState.selectedFile);
}

// Función para convertir CSV a array de objetos
function csvToArray(csvContent) {
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === '') continue;
        
        const cells = lines[i].split(',').map(c => c.trim());
        const obj = {};
        
        headers.forEach((header, index) => {
            obj[header] = cells[index] || '';
        });
        
        data.push(obj);
    }
    
    return data;
}

// Función para guardar datos transformados en MongoDB
function saveToMongoDB() {
    if (!appState.transformedData) {
        alert('❌ No hay datos transformados para guardar');
        return;
    }
    
    // Convertir CSV a array de objetos
    const dataArray = csvToArray(appState.transformedData);
    
    if (dataArray.length === 0) {
        alert('❌ No hay datos para guardar en MongoDB');
        return;
    }
    
    // Mostrar estado de carga
    const btnSave = document.getElementById('btn-save-mongodb');
    const originalText = btnSave.textContent;
    btnSave.textContent = '⏳ Guardando...';
    btnSave.disabled = true;
    
    console.log(`📤 Enviando ${dataArray.length} registros a MongoDB...`);
    
    // Enviar datos al servidor
    fetch('http://localhost:5000/api/save-data', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            fileName: appState.selectedFile.name,
            data: dataArray,
            timestamp: new Date().toISOString()
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
    })
    .then(result => {
        btnSave.textContent = originalText;
        btnSave.disabled = false;
        
        if (result.success) {
            // ✅ ÉXITO - Mostrar alerta y mensaje en página
            const mensaje = `✅ ¡ÉXITO!\n\nDatos guardados en MongoDB correctamente\n\n📊 Detalles:\n- Archivo: ${result.fileName}\n- Registros guardados: ${result.recordCount}\n- ID MongoDB: ${result.insertedId}`;
            alert(mensaje);
            
            console.log('✅ Datos guardados exitosamente:', result);
            
            // Mostrar mensaje en página también
            const successMessage = `
                <div style="margin-top: 15px; padding: 15px; background: #c8e6c9; border-left: 4px solid #2e7d32; border-radius: 4px;">
                    <p style="margin: 0; color: #1b5e20; font-weight: 600;">✅ Datos guardados en MongoDB correctamente</p>
                    <p style="margin: 5px 0; color: #2e7d32; font-size: 0.9em;">Archivo: ${result.fileName}</p>
                    <p style="margin: 5px 0; color: #2e7d32; font-size: 0.9em;">Registros: ${result.recordCount}</p>
                    <p style="margin: 5px 0 0 0; color: #2e7d32; font-size: 0.85em;">ID: ${result.insertedId}</p>
                </div>
            `;
            
            previewContainer.innerHTML += successMessage;
        } else {
            // ❌ ERROR - Mostrar alerta
            alert(`❌ Error al guardar en MongoDB\n\n${result.error || 'Error desconocido'}`);
            console.error('❌ Error en respuesta:', result);
        }
    })
    .catch(error => {
        btnSave.textContent = originalText;
        btnSave.disabled = false;
        
        console.error('❌ Error de red:', error);
        
        // ❌ ERROR - Mostrar alerta clara
        const errorMsg = `❌ ERROR al guardar en MongoDB\n\n${error.message}\n\nAsegúrate que:\n1. El servidor esté ejecutándose (npm start)\n2. MongoDB esté disponible\n3. Tengas conexión de red`;
        alert(errorMsg);
        
        // Mostrar mensaje en página
        const errorMessage = `
            <div style="margin-top: 15px; padding: 15px; background: #ffebee; border-left: 4px solid #c62828; border-radius: 4px;">
                <p style="margin: 0; color: #b71c1c; font-weight: 600;">❌ Error al guardar en MongoDB</p>
                <p style="margin: 5px 0 0 0; color: #c62828; font-size: 0.9em;">${error.message}</p>
            </div>
        `;
        
        previewContainer.innerHTML += errorMessage;
    });
}

// Botones de archivo
document.getElementById('btn-cancel').addEventListener('click', resetFileInfo);
btnTransform.addEventListener('click', performTransformation);
btnClosePreview.addEventListener('click', hidePreview);

// Función para verificar el estado del backend
function checkBackendStatus() {
    fetch('http://localhost:5000/')
        .then(response => {
            if (response.ok) {
                statusDot.classList.remove('disconnected');
                statusDot.classList.add('connected');
                statusText.textContent = 'MongoDB conectado';
            } else {
                throw new Error('Servidor no disponible');
            }
        })
        .catch(error => {
            statusDot.classList.remove('connected');
            statusDot.classList.add('disconnected');
            statusText.textContent = 'MongoDB desconectado';
        });
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ Aplicación Data Lakehouse cargada correctamente');
    
    // Verificar estado del backend
    checkBackendStatus();
    
    // Verificar cada 5 segundos
    setInterval(checkBackendStatus, 5000);
});
