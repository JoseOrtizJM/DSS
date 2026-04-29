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

// Elementos para KPIs
const kpisBtn = document.getElementById('kpis-btn');
const kpisSection = document.getElementById('kpis-section');
const kpisContainer = document.getElementById('kpis-container');
const kpisLoading = document.getElementById('kpis-loading');
const kpisError = document.getElementById('kpis-error');
const btnRefreshKpis = document.getElementById('btn-refresh-kpis');

// Event Listeners para menús principales
extraccionBtn.addEventListener('click', () => switchMenu('extraccion'));
kpisBtn.addEventListener('click', () => {
    switchMenu('kpis');
    loadKPIs();
});

// Event Listeners para submenús
document.querySelectorAll('#submenu-extraccion .submenu-btn').forEach(btn => {
    btn.addEventListener('click', handleDataTypeSelection);
});

// Cambiar menú principal
function switchMenu(menu) {
    appState.currentMenu = menu;
    
    // Actualizar botones activos
    document.querySelectorAll('.menu-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    if (menu === 'extraccion') {
        extraccionBtn.classList.add('active');
        breadcrumb.textContent = 'Extracción';
        uploadSection.style.display = 'block';
        submenuExtraccion.style.display = 'block';
        kpisSection.style.display = 'none';
        
        // Resetear selección
        document.querySelectorAll('.submenu-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        appState.currentDataType = null;
        resetUploadSection();
    } else if (menu === 'kpis') {
        kpisBtn.classList.add('active');
        breadcrumb.textContent = 'KPIs';
        uploadSection.style.display = 'none';
        submenuExtraccion.style.display = 'none';
        kpisSection.style.display = 'block';
    }
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

// ========== FUNCIONES DE KPIs ==========

// Cargar KPIs desde el servidor
function loadKPIs() {
    showKPIsLoading(true);
    kpisError.style.display = 'none';
    kpisContainer.innerHTML = '';
    
    fetch('http://localhost:5000/api/kpis')

        .then(response => {
            if (!response.ok) {
                throw new Error(`Error HTTP ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            allKPIsData = data;  // Guardar datos para gráficas
            showKPIsLoading(false);
            
            if (data.success && data.kpis) {
                renderKPIs(data.kpis);
                populateDetallesTable(data);  // Llenar tabla de detalles
            } else {
                showKPIsError('No se pudieron calcular los KPIs');
            }
        })
        .catch(error => {
            showKPIsLoading(false);
            showKPIsError(`Error al cargar KPIs: ${error.message}`);
            console.error('❌ Error cargando KPIs:', error);
        });
}

// Mostrar/Ocultar loading de KPIs
function showKPIsLoading(show) {
    kpisLoading.style.display = show ? 'block' : 'none';
}

// Mostrar error de KPIs
function showKPIsError(message) {
    document.getElementById('kpis-error-message').textContent = message;
    kpisError.style.display = 'block';
}

// Renderizar KPIs
function renderKPIs(kpis) {
    let html = '';
    
    // 1. Tasa de Empleabilidad Alta (TEA)
    html += createKPICard(
        'TEA',
        'Tasa de Empleabilidad Alta',
        `${kpis.TEA}%`,
        '15% - 40%',
        'Porcentaje de posiciones con empleabilidad alta',
        parseFloat(kpis.TEA)
    );
    
    // 2. Salario Promedio por Sector (SPS)
    html += '<div class="kpi-section-header">💰 Salario Promedio por Sector</div>';
    html += '<div class="kpi-sector-grid">';
    Object.entries(kpis.SPS || {}).forEach(([sector, salario]) => {
        html += `
            <div class="kpi-sector-card">
                <p class="sector-name">${sector}</p>
                <p class="sector-value">$${parseFloat(salario).toLocaleString('es-MX', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
            </div>
        `;
    });
    html += '</div>';
    
    // 3. Variabilidad Salarial por Sector (CV)
    html += '<div class="kpi-section-header">📊 Variabilidad Salarial (Coeficiente de Variación)</div>';
    html += '<div class="kpi-sector-grid">';
    Object.entries(kpis.CV || {}).forEach(([sector, cv]) => {
        const color = cv > 30 ? '#dc3545' : (cv > 20 ? '#ffc107' : '#28a745');
        html += `
            <div class="kpi-sector-card">
                <p class="sector-name">${sector}</p>
                <p class="sector-value" style="color: ${color};">${parseFloat(cv).toFixed(1)}%</p>
                <p class="sector-desc" style="font-size: 0.8em;">Mayor variabilidad = menos estable</p>
            </div>
        `;
    });
    html += '</div>';
    
    // 4. Concentración de Empleo (CDE)
    html += createKPICard(
        'CDE',
        'Concentración de Empleo',
        `${kpis.CDE}%`,
        '15% - 35%',
        'Porcentaje en el sector de mayor demanda'
    );
    
    // 5. Índice de Empleabilidad Regional (IER)
    html += createKPICard(
        'IER',
        'Índice de Empleabilidad Regional',
        `${kpis.IER}%`,
        '30% - 75%',
        'Promedio ponderado de empleabilidad por municipio'
    );
    
    // 6. Tasa de Crecimiento Salarial (TCS)
    const tcsValue = parseFloat(kpis.TCS);
    const tcsColor = tcsValue > 0 ? '#28a745' : (tcsValue < 0 ? '#dc3545' : '#6c757d');
    const tcsArrow = tcsValue > 0 ? '📈' : (tcsValue < 0 ? '📉' : '➡️');
    html += createKPICard(
        'TCS',
        'Tasa de Crecimiento Salarial',
        `${tcsArrow} ${tcsValue > 0 ? '+' : ''}${tcsValue}%`,
        '-5% a +8% mensual',
        'Diferencia promedio entre períodos',
        undefined,
        tcsColor
    );
    
    // 7. Saturación del Mercado Laboral (SML)
    html += createKPICard(
        'SML',
        'Saturación del Mercado Laboral',
        `${kpis.SML}%`,
        '10% - 40%',
        'Proporción de sectores con baja empleabilidad'
    );
    
    // 8. Salario Mínimo vs Máximo (Brecha Salarial)
    html += createKPICard(
        'BS',
        'Brecha Salarial',
        `${kpis.BS}%`,
        '100% - 300%',
        'Diferencia porcentual entre salarios extremos'
    );
    
    // 9. Densidad de Registros por Municipio (DRM)
    html += '<div class="kpi-section-header">📍 Densidad de Registros por Municipio</div>';
    html += '<div class="kpi-sector-grid">';
    Object.entries(kpis.DRM || {}).forEach(([municipio, densidad]) => {
        html += `
            <div class="kpi-sector-card">
                <p class="sector-name">${municipio}</p>
                <p class="sector-value">${parseFloat(densidad).toFixed(2)} reg/mes</p>
            </div>
        `;
    });
    html += '</div>';
    
    // 10. Demanda vs Oferta por Sector (D/O)
    html += '<div class="kpi-section-header">⚖️ Demanda vs Oferta por Sector</div>';
    html += '<div class="kpi-sector-grid">';
    Object.entries(kpis.DO || {}).forEach(([sector, ratio]) => {
        const isNumeric = !isNaN(ratio) && ratio !== 'N/A';
        const ratioValue = isNumeric ? parseFloat(ratio) : 0;
        const status = ratioValue > 1 ? '✅ Más demanda' : (ratioValue < 1 ? '⚠️ Más oferta' : '➡️ Equilibrio');
        const color = ratioValue > 1 ? '#28a745' : (ratioValue < 1 ? '#ffc107' : '#6c757d');
        
        html += `
            <div class="kpi-sector-card">
                <p class="sector-name">${sector}</p>
                <p class="sector-value" style="color: ${color};">${isNumeric ? ratioValue.toFixed(2) : ratio}</p>
                <p class="sector-desc" style="font-size: 0.8em;">${status}</p>
            </div>
        `;
    });
    html += '</div>';
    
    kpisContainer.innerHTML = html;
}

// Crear tarjeta de KPI (para KPIs simples)
function createKPICard(id, title, value, range, description, percentage, color = null) {
    const indicatorColor = color || (percentage !== undefined && percentage >= 50 ? '#28a745' : '#dc3545');
    
    return `
        <div class="kpi-card">
            <div class="kpi-card-header">
                <h3>${title}</h3>
                <span class="kpi-id">${id}</span>
            </div>
            <div class="kpi-card-body">
                <div class="kpi-value" style="color: ${indicatorColor};">${value}</div>
                <p class="kpi-description">${description}</p>
                <div class="kpi-range">
                    <span>Rango esperado:</span>
                    <strong>${range}</strong>
                </div>
                <button class="btn-interpret" data-kpi-id="${id}" data-kpi-value="${value}">💡 Interpretar</button>
            </div>
        </div>
    `;
}

// Generar interpretación de KPI
function generateKPIInterpretation(kpiId, kpiValue, allKpis = null) {
    const value = parseFloat(kpiValue);
    let interpretation = '';
    
    switch(kpiId) {
        case 'TEA':
            if (value < 20) {
                interpretation = `
                    <strong>⚠️ Empleabilidad Baja</strong><br>
                    Solo ${value}% de las posiciones tiene empleabilidad alta. 
                    Esto significa que el mercado laboral está muy saturado con baja demanda. 
                    Los candidatos pueden encontrar dificultades para conseguir empleo en sectores con alta demanda.
                    <hr class="divider">
                    <strong>Asistencia Recomendada:</strong> Impulsar capacitaciones en sectores con más demanda.
                `;
            } else if (value < 30) {
                interpretation = `
                    <strong>📊 Empleabilidad Moderada</strong><br>
                    ${value}% de las posiciones tiene empleabilidad alta. 
                    Hay un balance entre sectores con alto y bajo crecimiento. 
                    Es un mercado en transición con oportunidades limitadas en ciertos nichos.
                    <hr class="divider">
                    <strong>Recomendación:</strong> Enfocarse en sectores con crecimiento identificado.
                `;
            } else {
                interpretation = `
                    <strong>✅ Empleabilidad Alta</strong><br>
                    ${value}% de las posiciones tiene empleabilidad alta. 
                    El mercado laboral está en buenas condiciones con muchas oportunidades. 
                    Es un buen momento para candidatos en busca de empleo.
                    <hr class="divider">
                    <strong>Oportunidad:</strong> Excelente para buscadores de empleo calificados.
                `;
            }
            break;
            
        case 'CDE':
            if (value > 30) {
                interpretation = `
                    <strong>⚠️ Concentración Alta</strong><br>
                    ${value}% del empleo está concentrado en un solo sector. 
                    Esto indica dependencia excesiva de una industria. 
                    Hay poco diversidad en oportunidades laborales, lo que aumenta el riesgo si ese sector se desaceleran.
                    <hr class="divider">
                    <strong>Recomendación:</strong> Diversificar oportunidades en otros sectores.
                `;
            } else if (value > 20) {
                interpretation = `
                    <strong>📊 Concentración Moderada</strong><br>
                    ${value}% del empleo está en el sector principal. 
                    Hay buena diversificación pero un sector dominante. 
                    Es recomendable desarrollar sectores alternativos para reducir riesgo.
                    <hr class="divider">
                    <strong>Equilibrio:</strong> Situación balanceada con espacio para crecimiento en otros sectores.
                `;
            } else {
                interpretation = `
                    <strong>✅ Distribución Equilibrada</strong><br>
                    Solo ${value}% del empleo está en el sector principal. 
                    Hay buena diversificación del mercado laboral. 
                    Las oportunidades están distribuidas entre múltiples sectores, lo que reduce riesgo.
                    <hr class="divider">
                    <strong>Fortaleza:</strong> Mercado diversificado y resiliente.
                `;
            }
            break;
            
        case 'IER':
            if (value < 40) {
                interpretation = `
                    <strong>⚠️ Empleabilidad Regional Baja</strong><br>
                    El promedio de empleabilidad por municipio es solo ${value}%. 
                    Pocos municipios tienen buen acceso a empleos de alta calidad. 
                    Hay desigualdad significativa entre regiones.
                    <hr class="divider">
                    <strong>Acción:</strong> Necesita programas de empleo regional urgentes.
                `;
            } else if (value < 60) {
                interpretation = `
                    <strong>📊 Empleabilidad Regional Moderada</strong><br>
                    El promedio regional es ${value}%. 
                    Algunos municipios tienen buen empleabilidad pero otros requieren apoyo. 
                    Hay disparidad que requiere atención enfocada.
                    <hr class="divider">
                    <strong>Oportunidad:</strong> Mejorar los municipios con menor empleabilidad.
                `;
            } else {
                interpretation = `
                    <strong>✅ Empleabilidad Regional Alta</strong><br>
                    ${value}% es un promedio muy positivo. 
                    La mayoría de municipios tiene buena empleabilidad. 
                    Es un indicador de desarrollo laboral equitativo en la región.
                    <hr class="divider">
                    <strong>Éxito:</strong> Distribución exitosa de oportunidades laborales.
                `;
            }
            break;
            
        case 'TCS':
            if (value > 2) {
                interpretation = `
                    <strong>📈 Crecimiento Salarial Positivo</strong><br>
                    Los salarios crecen ${value}% mes a mes. 
                    Esto indica una recuperación económica o inflación positiva. 
                    Los trabajadores están viendo mejora en sus ingresos.
                    <hr class="divider">
                    <strong>Indicador:</strong> Mercado laboral en expansión.
                `;
            } else if (value < -1) {
                interpretation = `
                    <strong>📉 Contracción Salarial</strong><br>
                    Los salarios se reducen ${(value * -1).toFixed(2)}% mes a mes. 
                    Esto puede indicar recesión o presión inflacionaria. 
                    Los trabajadores enfrentan pérdida de poder adquisitivo.
                    <hr class="divider">
                    <strong>Alerta:</strong> Requiere intervención económica.
                `;
            } else {
                interpretation = `
                    <strong>➡️ Salarios Estables</strong><br>
                    Cambio salarial de ${value}% (casi nulo). 
                    Los salarios se mantienen sin variaciones significativas. 
                    Es un período de estabilización del mercado.
                    <hr class="divider">
                    <strong>Situación:</strong> Mercado laboral equilibrado.
                `;
            }
            break;
            
        case 'SML':
            if (value > 30) {
                interpretation = `
                    <strong>⚠️ Mercado Altamente Saturado</strong><br>
                    ${value}% de los registros tienen baja empleabilidad. 
                    El mercado está muy saturado con pocas oportunidades. 
                    Muchos candidatos compiten por pocos puestos.
                    <hr class="divider">
                    <strong>Consejo:</strong> Capacitarse en sectores con mayor demanda.
                `;
            } else if (value > 20) {
                interpretation = `
                    <strong>📊 Saturación Moderada</strong><br>
                    ${value}% presenta baja empleabilidad. 
                    Hay sectores con saturación pero otros con oportunidades. 
                    Seleccionar sector es crucial para el éxito laboral.
                    <hr class="divider">
                    <strong>Estrategia:</strong> Buscar en sectores con alta empleabilidad.
                `;
            } else {
                interpretation = `
                    <strong>✅ Mercado Saludable</strong><br>
                    Solo ${value}% tiene baja empleabilidad. 
                    La mayoría de sectores presentan buenas oportunidades. 
                    Es un mercado con relativamente pocas restricciones.
                    <hr class="divider">
                    <strong>Oportunidad:</strong> Buen momento para búsqueda de empleo.
                `;
            }
            break;
            
        case 'BS':
            if (value > 200) {
                interpretation = `
                    <strong>⚠️ Brecha Salarial Extrema</strong><br>
                    La brecha es ${value}%, indicando desigualdad extrema. 
                    Hay sectores que pagan mucho más que otros. 
                    Esto crea inequidad significativa en el mercado laboral.
                    <hr class="divider">
                    <strong>Preocupación:</strong> Desigualdad laboral muy alta.
                `;
            } else if (value > 150) {
                interpretation = `
                    <strong>📊 Brecha Salarial Alta</strong><br>
                    La brecha es ${value}%. 
                    Hay diferencias importantes entre sectores. 
                    La elección de sector afecta significativamente los ingresos.
                    <hr class="divider">
                    <strong>Factor:</strong> Sector laboral determina salario.
                `;
            } else {
                interpretation = `
                    <strong>✅ Brecha Salarial Razonable</strong><br>
                    La brecha es ${value}%, dentro de niveles normales. 
                    Hay diferencia pero sin extremos. 
                    El mercado es relativamente equitativo.
                    <hr class="divider">
                    <strong>Equilibrio:</strong> Salarios más homogéneos.
                `;
            }
            break;
            
        default:
            interpretation = `<strong>KPI:</strong> ${kpiId}<br><strong>Valor:</strong> ${value}`;
    }
    
    return interpretation;
}

// Mostrar modal de interpretación
function showInterpretationModal(kpiId, kpiValue) {
    const interpretation = generateKPIInterpretation(kpiId, kpiValue);
    
    const modal = `
        <div class="modal-overlay" id="modal-overlay">
            <div class="modal-content">
                <button class="modal-close" onclick="closeInterpretationModal()">✕</button>
                <h2>Interpretación - KPI ${kpiId}</h2>
                <div class="modal-body">
                    ${interpretation}
                </div>
            </div>
        </div>
    `;
    
    // Crear modal si no existe
    let overlay = document.getElementById('modal-overlay');
    if (!overlay) {
        document.body.insertAdjacentHTML('beforeend', modal);
        overlay = document.getElementById('modal-overlay');
    } else {
        overlay.innerHTML = modal;
    }
    
    // Event listener para cerrar al hacer click fuera
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeInterpretationModal();
        }
    });
}

// Cerrar modal de interpretación
function closeInterpretationModal() {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) {
        overlay.remove();
    }
}

// Event listener para botones de interpretación
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-interpret')) {
        const kpiId = e.target.dataset.kpiId;
        const kpiValue = e.target.dataset.kpiValue;
        showInterpretationModal(kpiId, kpiValue);
    }
});

// ==================== NUEVO: SISTEMA DE TABS Y GRÁFICAS ====================

// Variables globales para gráficas
let allKPIsData = null;
let chartsInstances = {
    demandaOferta: null,
    salarioSector: null,
    empleabilidadMunicipio: null,
    evolucionSalarios: null
};

// Event listeners para tabs
document.addEventListener('DOMContentLoaded', function() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            switchTab(this.getAttribute('data-tab'));
        });
    });
});

// Cambiar tabs
function switchTab(tabName) {
    // Ocultar todos los tabs
    const allTabs = document.querySelectorAll('.tab-content');
    allTabs.forEach(tab => tab.style.display = 'none');
    
    // Desactivar todos los botones
    const allBtns = document.querySelectorAll('.tab-btn');
    allBtns.forEach(btn => btn.classList.remove('active'));
    
    // Mostrar tab seleccionado
    const selectedTab = document.getElementById('tab-' + tabName);
    if (selectedTab) {
        selectedTab.style.display = 'block';
        
        // Activar botón correspondiente
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // Si es la pestaña de gráficas, renderizarlas
        if (tabName === 'graficas' && allKPIsData) {
            setTimeout(() => renderDashboardCharts(allKPIsData), 100);
        }
    }
}

// Renderizar gráficas del dashboard
function renderDashboardCharts(kpiData) {
    renderDemandaOfertaChart(kpiData);
    renderSalarioSectorChart(kpiData);
    renderEmpleabilidadMunicipioChart(kpiData);
    renderEvolucionSalariosChart(kpiData);
}

// Gráfica 1: Demanda vs Oferta por Sector
function renderDemandaOfertaChart(kpiData) {
    const ctx = document.getElementById('chart-demanda-oferta');
    if (!ctx) return;
    
    const sectors = kpiData.demandaOfertaPorSector.map(s => s.sector);
    const ratios = kpiData.demandaOfertaPorSector.map(s => s.ratio);
    
    // Destruir gráfica anterior si existe
    if (chartsInstances.demandaOferta) {
        chartsInstances.demandaOferta.destroy();
    }
    
    const colors = ratios.map(r => r > 1.1 ? '#10b981' : r < 0.9 ? '#ef4444' : '#f59e0b');
    
    chartsInstances.demandaOferta = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sectors,
            datasets: [{
                label: 'Ratio D/O',
                data: ratios,
                backgroundColor: colors,
                borderColor: colors,
                borderWidth: 2,
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: '#333',
                        font: { size: 12, weight: 'bold' }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: Math.max(...ratios) + 0.5,
                    ticks: {
                        color: '#666'
                    },
                    grid: {
                        color: 'rgba(0,0,0,0.05)'
                    }
                },
                x: {
                    ticks: {
                        color: '#666',
                        font: { size: 11 }
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Gráfica 2: Salario Promedio por Sector
function renderSalarioSectorChart(kpiData) {
    const ctx = document.getElementById('chart-salario-sector');
    if (!ctx) return;
    
    const rawData = kpiData.rawData || [];
    const sectorSalarios = {};
    
    rawData.forEach(record => {
        if (!sectorSalarios[record.sector_laboral]) {
            sectorSalarios[record.sector_laboral] = [];
        }
        sectorSalarios[record.sector_laboral].push(parseFloat(record.salario_promedio_mensual));
    });
    
    const sectors = Object.keys(sectorSalarios).sort();
    const promedios = sectors.map(sector => {
        const salarios = sectorSalarios[sector];
        return salarios.reduce((a, b) => a + b, 0) / salarios.length;
    });
    
    // Destruir gráfica anterior si existe
    if (chartsInstances.salarioSector) {
        chartsInstances.salarioSector.destroy();
    }
    
    chartsInstances.salarioSector = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: sectors,
            datasets: [{
                data: promedios,
                backgroundColor: [
                    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
                    '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#6366f1',
                    '#d946ef', '#14b8a6'
                ],
                borderColor: '#fff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: '#333',
                        font: { size: 11 },
                        padding: 15
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return '$' + Math.round(context.parsed).toLocaleString('es-MX');
                        }
                    }
                }
            }
        }
    });
}

// Gráfica 3: Empleabilidad por Municipio
function renderEmpleabilidadMunicipioChart(kpiData) {
    const ctx = document.getElementById('chart-empleabilidad-municipio');
    if (!ctx) return;
    
    const rawData = kpiData.rawData || [];
    const municipioEmpleabilidad = {};
    
    rawData.forEach(record => {
        if (!municipioEmpleabilidad[record.municipio]) {
            municipioEmpleabilidad[record.municipio] = { alto: 0, medio: 0, bajo: 0 };
        }
        municipioEmpleabilidad[record.municipio][record.empleabilidad]++;
    });
    
    const municipios = Object.keys(municipioEmpleabilidad).sort();
    const altos = municipios.map(m => municipioEmpleabilidad[m].alto || 0);
    const medios = municipios.map(m => municipioEmpleabilidad[m].medio || 0);
    const bajos = municipios.map(m => municipioEmpleabilidad[m].bajo || 0);
    
    // Destruir gráfica anterior si existe
    if (chartsInstances.empleabilidadMunicipio) {
        chartsInstances.empleabilidadMunicipio.destroy();
    }
    
    chartsInstances.empleabilidadMunicipio = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: municipios,
            datasets: [
                {
                    label: 'Alto',
                    data: altos,
                    backgroundColor: '#10b981',
                    borderRadius: 3
                },
                {
                    label: 'Medio',
                    data: medios,
                    backgroundColor: '#f59e0b',
                    borderRadius: 3
                },
                {
                    label: 'Bajo',
                    data: bajos,
                    backgroundColor: '#ef4444',
                    borderRadius: 3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            indexAxis: 'y',
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: '#333',
                        font: { size: 12 }
                    }
                }
            },
            scales: {
                x: {
                    stacked: true,
                    ticks: { color: '#666' },
                    grid: { color: 'rgba(0,0,0,0.05)' }
                },
                y: {
                    stacked: true,
                    ticks: { color: '#666', font: { size: 10 } },
                    grid: { display: false }
                }
            }
        }
    });
}

// Gráfica 4: Evolución de Salarios en el Tiempo
function renderEvolucionSalariosChart(kpiData) {
    const ctx = document.getElementById('chart-evolucion-salarios');
    if (!ctx) return;
    
    const rawData = kpiData.rawData || [];
    
    // Agrupar por mes
    const salariosporMes = {};
    rawData.forEach(record => {
        const fecha = record.fecha_registro.substring(0, 7); // YYYY-MM
        if (!salariosporMes[fecha]) {
            salariosporMes[fecha] = [];
        }
        salariosporMes[fecha].push(parseFloat(record.salario_promedio_mensual));
    });
    
    const meses = Object.keys(salariosporMes).sort();
    const promedios = meses.map(mes => {
        const salarios = salariosporMes[mes];
        return Math.round(salarios.reduce((a, b) => a + b, 0) / salarios.length);
    });
    
    // Destruir gráfica anterior si existe
    if (chartsInstances.evolucionSalarios) {
        chartsInstances.evolucionSalarios.destroy();
    }
    
    chartsInstances.evolucionSalarios = new Chart(ctx, {
        type: 'line',
        data: {
            labels: meses,
            datasets: [{
                label: 'Salario Promedio',
                data: promedios,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#3b82f6',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: '#333',
                        font: { size: 12, weight: 'bold' }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return '$' + context.parsed.y.toLocaleString('es-MX');
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        color: '#666',
                        callback: function(value) {
                            return '$' + value.toLocaleString('es-MX');
                        }
                    },
                    grid: { color: 'rgba(0,0,0,0.05)' }
                },
                x: {
                    ticks: {
                        color: '#666',
                        font: { size: 11 }
                    },
                    grid: { color: 'rgba(0,0,0,0.05)' }
                }
            }
        }
    });
}

// Llenar tabla de detalles D/O
function populateDetallesTable(kpiData) {
    const tbody = document.getElementById('detalles-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    kpiData.demandaOfertaPorSector.forEach(item => {
        const row = document.createElement('tr');
        const estado = item.ratio > 1.1 ? '✅ Más demanda' : item.ratio < 0.9 ? '⚠️ Más oferta' : '➡️ Equilibrio';
        
        row.innerHTML = `
            <td>${item.sector}</td>
            <td>${item.alto}</td>
            <td>${item.bajo}</td>
            <td><strong>${item.ratio.toFixed(2)}</strong></td>
            <td>${estado}</td>
        `;
        tbody.appendChild(row);
    });
}

// Event listener para tabs
document.addEventListener('DOMContentLoaded', function() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            switchTab(this.getAttribute('data-tab'));
        });
    });
});

// Botón refresh
if (btnRefreshKpis) {
    btnRefreshKpis.addEventListener('click', loadKPIs);
}
