import csv
import random
from datetime import datetime, timedelta

# ===== GENERADOR PARA enoe_oaxaca.csv =====
profesiones = [
    "ingeniero de sistemas", "profesor", "tec. en electricidad", "contador", "mecanico",
    "asistente administrativo", "diseñador grafico", "enfermero", "dentista", "vendedor",
    "abogado", "arquitecto", "psicólogo", "técnico en electrónica", "plomero",
    "electricista", "chef", "cocinero", "camarero", "guardia de seguridad",
    "conductor", "transportista", "jardinero", "pintor", "carpintero",
    "soldador", "maestro de obra", "técnico en telecomunicaciones", "gerente",
    "supervisor", "coordinador", "analista", "programador", "economista", "contador",
    "ejecutivo de ventas", "representante comercial", "consultor", "auditor",
    "investigador", "académico", "docente", "capacitador", "técnico de mantenimiento"
]

niveles_educativos = [
    "primaria", "secundaria", "bachillerato", "tecnico", "lic.incompleta",
    "licenciatura completa", "prof.univ.", "especialidad", "maestria", "doctorado"
]

municipios = [
    "oaxaca capital", "Huajuapan", "juarez", "Lachixio", "Xoxocotlan",
    "Etla", "Tlacolula", "Ixtlan", "San Pablo Etla", "Macuiltianguis",
    "Ocotlan", "Tututepec", "Santiago", "Pochutla", "Puerto Escondido",
    "Huatulco", "Salina Cruz", "Crucecita", "Santa Catarina", "San Juan"
]

# Generar registros enoe
enoe_records = []
with open('c:\\Users\\monco\\DSS\\enoe_oaxaca.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    enoe_records = list(reader)

ultimo_id = int(enoe_records[-1]['id']) if enoe_records else 0

base_date = datetime(2024, 1, 1)
new_enoe = []

for i in range(3000):
    record_id = ultimo_id + i + 1
    fecha = base_date + timedelta(days=random.randint(0, 365))
    new_record = {
        'id': record_id,
        'profesion': random.choice(profesiones),
        'tasa_ocupacion': round(random.uniform(40, 95), 1),
        'nivel_educativo': random.choice(niveles_educativos),
        'fecha_registro': fecha.strftime('%Y-%m-%d'),
        'municipio': random.choice(municipios)
    }
    new_enoe.append(new_record)

# Agregar a enoe
with open('c:\\Users\\monco\\DSS\\enoe_oaxaca.csv', 'a', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=['id', 'profesion', 'tasa_ocupacion', 'nivel_educativo', 'fecha_registro', 'municipio'])
    writer.writerows(new_enoe)

print(f"✓ Agregados 3000 registros a enoe_oaxaca.csv")

# ===== GENERADOR PARA sep_oaxaca.csv =====
universidades = [
    "Uabjo", "Ujat", "Tecnologica Del Valle", "Ies Oaxaca", "Univers. Autonoma",
    "Instituto Tecnologico", "Colegio De Bachilleres", "Tebacsso", "Cecyte",
    "Conalep", "Centro De Estudios", "Escuela Normal", "Instituto Superior"
]

carreras = [
    "ingenieria en sistemas computacionales", "administracion de empresas", "lic. en psicologia",
    "tec. en electronica", "lic en enfermeria", "diseño grafico", "lic. en educacion",
    "contabilidad", "tec en mecanica", "lic. en derecho", "lic. en economia",
    "ingenieria civil", "ingenieria electronica", "lic. en comunicacion",
    "lic. en turismo", "tec. en informatica", "lic. en filosofia", "lic. en biologia"
]

areas = [
    "ingenieria", "administracion", "ciencias sociales", "salud", "artes",
    "educacion", "derecho", "economia", "tecnologia", "humanidades"
]

modalidades = ["presencial", "semi presencial", "virtual"]

ciudades = [
    "oaxaca capital", "Huajuapan", "Etla", "Xoxocotlan", "Tlacolula",
    "Ixtlan", "Lachixio", "juarez", "Pochutla", "Salina Cruz"
]

# Leer registros existentes sep
sep_records = []
with open('c:\\Users\\monco\\DSS\\sep_oaxaca.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    sep_records = list(reader)

ultimo_id_sep = int(sep_records[-1]['id']) if sep_records else 0

new_sep = []
for i in range(3000):
    record_id = ultimo_id_sep + i + 1
    fecha = base_date + timedelta(days=random.randint(0, 365))
    semestres = random.choice([6, 8, 10])
    new_record = {
        'id': record_id,
        'universidad': random.choice(universidades),
        'carrera': random.choice(carreras),
        'area_academica': random.choice(areas),
        'modalidad': random.choice(modalidades),
        'semestres': semestres,
        'fecha_oferta': fecha.strftime('%Y-%m-%d'),
        'ciudad': random.choice(ciudades)
    }
    new_sep.append(new_record)

# Agregar a sep
with open('c:\\Users\\monco\\DSS\\sep_oaxaca.csv', 'a', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=['id', 'universidad', 'carrera', 'area_academica', 'modalidad', 'semestres', 'fecha_oferta', 'ciudad'])
    writer.writerows(new_sep)

print(f"✓ Agregados 3000 registros a sep_oaxaca.csv")

# ===== GENERADOR PARA observatorio_laboral_oaxaca.csv =====
sectores = [
    "Tecnología", "salud", "educacion", "turismo", "construccion",
    "Agricultura", "servicios", "finanzas", "manufactura", "transporte",
    "comercio", "mineria", "energia", "telecomunicaciones", "textil"
]

empleabilidad = ["alto", "medio", "bajo"]

observaciones_texts = [
    "muy demandado", "profesionales requeridos", "sector regulado",
    "estacional", "cyclico", "dependencia climatica", "variable",
    "en desarrollo", "competencia internacional", "crecimiento esperado",
    "requiere experiencia", "sector estable", "volatil", "con potencial"
]

# Leer registros existentes observatorio
obs_records = []
with open('c:\\Users\\monco\\DSS\\observatorio_laboral_oaxaca.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    obs_records = list(reader)

ultimo_id_obs = int(obs_records[-1]['id']) if obs_records else 0

new_obs = []
for i in range(40):
    record_id = ultimo_id_obs + i + 1
    fecha = base_date + timedelta(days=random.randint(0, 365))
    new_record = {
        'id': record_id,
        'fecha_registro': fecha.strftime('%Y-%m-%d'),
        'sector_laboral': random.choice(sectores),
        'salario_promedio_mensual': round(random.uniform(8000, 25000), 2),
        'empleabilidad': random.choice(empleabilidad),
        'municipio': random.choice(municipios),
        'observaciones': random.choice(observaciones_texts)
    }
    new_obs.append(new_record)

# Agregar a observatorio
with open('c:\\Users\\monco\\DSS\\observatorio_laboral_oaxaca.csv', 'a', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=['id', 'fecha_registro', 'sector_laboral', 'salario_promedio_mensual', 'empleabilidad', 'municipio', 'observaciones'])
    writer.writerows(new_obs)

print(f"✓ Agregados 40 registros a observatorio_laboral_oaxaca.csv")
print("\n✓ ¡Todos los archivos han sido actualizados!")
