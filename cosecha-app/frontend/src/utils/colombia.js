// Dataset de departamentos y municipios productores de papa en Colombia
// Enfocado en regiones paperas principales (Boyaca, Cundinamarca, Narino, Santander, Antioquia, etc.)
const DEPARTAMENTOS_MUNICIPIOS = {
  'Boyaca': [
    'Tunja','Ventaquemada','Samaca','Siachoque','Toca','Soraca','Combita',
    'Chiquiza','Motavita','Oicata','Cucaita','Sotaquira','Paipa','Duitama',
    'Sogamoso','Tibasosa','Firavitoba','Iza','Cuitiva','Tota','Aquitania',
    'Mongua','Mongui','Topaga','Gameza','Corrales','Busbanza','Floresta',
    'Belen','Cerinza','Santa Rosa de Viterbo','Nobsa','Pesca','Umbita',
    'Nuevo Colon','Turmeque','Boyaca','Ramiriqui','Jenesano','Tibana',
    'Viracacha','Cienega','Chivata','Sachica','Villa de Leyva','Rondon',
    'Zetaquira','San Eduardo','Berbeo','Miraflores','Arcabuco',
  ],
  'Cundinamarca': [
    'Bogota D.C.','Zipaquira','Ubate','Choconta','Villapinzon','Lenguazaque',
    'Cucunuba','Sutatausa','Tausa','Carmen de Carupa','Simijaca','Susa',
    'Fuquene','Guacheta','Raquira','Subachoque','Tenjo','Tabio','Cajica',
    'Chia','Cota','Sopo','Tocancipa','Gachancipa','Sesquile','Guatavita',
    'Nemocon','Cogua','Nilo','Fusagasuga','Arbelaez','Pasca','Silvania',
    'Granada','San Bernardo','Cabrera','Venecia','Chipaque','Une','Choachi',
    'Ubaque','Fosca','Gutierrez','Caqueza','Quetame','La Calera',
    'Guasca','Junin','Gacheta','Gama','Manta','Macheta','Tibiribi',
    'Facatativa','Madrid','Mosquera','Funza','El Rosal','Bojaca',
  ],
  'Narino': [
    'Pasto','Tuquerres','Ipiales','Cumbal','Guachucal','Aldana','Pupiales',
    'Contadero','Gualmatán','Iles','Ospina','Sapuyes','Imues','Yacuanquer',
    'Tangua','Buesaco','La Florida','Sandona','Consaca','Ancuya',
    'La Union','San Pablo','Colon','Belen','San Jose de Alban',
    'Cartago','Genova','El Tablon de Gomez','La Cruz','San Bernardo',
    'Potosi','Cordoba','Puerres','Funes',
  ],
  'Santander': [
    'Bucaramanga','Pamplona','Cerrito','Concepcion','Malaga','Molagavita',
    'San Andres','Guaca','Enciso','Carcasi','San Jose de Miranda',
    'Mogotes','San Joaquin','Onzaga','Coromoro','Charala','Ocamonte',
    'Paramo','Encino','Gambita','Suaita','Guadalupe','Oiba',
    'Tona','Charta','California','Vetas','Surata','Matanza',
  ],
  'Antioquia': [
    'Medellin','La Union','Carmen de Viboral','Marinilla','Rionegro',
    'El Retiro','La Ceja','El Santuario','San Vicente Ferrer','Guarne',
    'Concepcion','Alejandria','San Rafael','Sonson','Abejorral','Argelia',
    'Narino','La Pintada','Santa Barbara','Entrerrios','San Pedro de los Milagros',
    'Belmira','Don Matias','Santa Rosa de Osos','San Jose de la Montana',
  ],
  'Caldas': [
    'Manizales','Villamaria','Chinchina','Neira','Filadelfia','Aranzazu',
    'Salamina','Aguadas','Pacora','Pensilvania','Manzanares','Marquetalia',
    'Marulanda','Victoria','La Dorada',
  ],
  'Cauca': [
    'Popayan','Silvia','Piendamo','Totoro','Purace','Coconuco','Inza',
    'Paez','Jambalo','Caldono','Toribio','Morales','El Tambo','Timbio',
    'Sotara','La Vega','Almaguer','San Sebastian','Bolivar',
  ],
  'Tolima': [
    'Ibague','Murillo','Santa Isabel','Anzoategui','Casabianca','Herveo',
    'Villahermosa','Libano','Fresno','Falan','Palocabildo','Cajamarca',
    'Rovira','Roncesvalles','Planadas','Rioblanco',
  ],
  'Norte de Santander': [
    'Pamplona','Cucuta','Chitaga','Cacota','Silos','Mutiscua','La Bateca',
    'Labateca','Toledo','Herran','Ragonvalia','Chinacota','Bochalema',
  ],
  'Valle del Cauca': [
    'Cali','Palmira','Tulua','Buga','Pradera','Florida','El Cerrito',
    'Ginebra','Guacari','Trujillo','Riofrio','Sevilla',
  ],
  'Risaralda': [
    'Pereira','Santa Rosa de Cabal','Dosquebradas','Marsella','La Virginia',
    'Belen de Umbria','Apia','Santuario','La Celia','Quinchia',
  ],
  'Quindio': [
    'Armenia','Salento','Circasia','Filandia','Genova','Pijao',
    'Cordoba','Buenavista','Calarca','Montenegro',
  ],
  'Huila': [
    'Neiva','La Plata','Garzon','Pitalito','San Agustin','Isnos',
    'La Argentina','Tarqui','Gigante','Algeciras',
  ],
};

export const getDepartamentos = () => Object.keys(DEPARTAMENTOS_MUNICIPIOS).sort();

export const getMunicipios = (departamento) => {
  if (!departamento) return [];
  return (DEPARTAMENTOS_MUNICIPIOS[departamento] || []).sort();
};

// Ciclos de cultivo por variedad de papa (dias desde siembra hasta cosecha)
export const VARIEDADES_PAPA = {
  'Pastusa Suprema': { dias: 150, descripcion: 'Variedad de alta demanda, ciclo largo' },
  'Diacol Capiro (R-12)': { dias: 135, descripcion: 'Para industria, ciclo medio-largo' },
  'Parda Pastusa': { dias: 150, descripcion: 'Tradicional, ciclo largo' },
  'ICA Unica': { dias: 120, descripcion: 'Precoz, buen rendimiento' },
  'Criolla Colombia': { dias: 90, descripcion: 'Papa criolla, ciclo corto' },
  'Criolla Latina': { dias: 90, descripcion: 'Criolla mejorada, ciclo corto' },
  'Criolla Galeras': { dias: 95, descripcion: 'Criolla, buen calibre' },
  'Betina': { dias: 130, descripcion: 'Resistente a gota, ciclo medio' },
  'Esmeralda': { dias: 130, descripcion: 'Para mesa, ciclo medio' },
  'Rubí': { dias: 140, descripcion: 'Piel roja, ciclo medio-largo' },
  'ICA Nevada': { dias: 140, descripcion: 'Para climas frios, ciclo largo' },
  'ICA Purace': { dias: 150, descripcion: 'Resistente, ciclo largo' },
  'Superior': { dias: 120, descripcion: 'Industrial, ciclo medio' },
  'Tuquerreña': { dias: 160, descripcion: 'Regional Narino, ciclo muy largo' },
};

export const getVariedades = () => Object.keys(VARIEDADES_PAPA);

export const getCicloVariedad = (variedad) => {
  // Busca coincidencia exacta o parcial
  const exact = VARIEDADES_PAPA[variedad];
  if (exact) return exact;

  // Busqueda parcial
  const lower = (variedad || '').toLowerCase();
  for (const [key, val] of Object.entries(VARIEDADES_PAPA)) {
    if (key.toLowerCase().includes(lower) || lower.includes(key.toLowerCase())) {
      return val;
    }
  }

  // Default para papa genérica
  if (lower.includes('criolla')) return { dias: 90, descripcion: 'Papa criolla, ciclo corto' };
  return { dias: 135, descripcion: 'Ciclo estimado promedio' };
};

// Rendimiento esperado por hectarea (kg/ha) basado en promedios colombianos
export const RENDIMIENTO_ESPERADO = {
  'Pastusa Suprema': 25000,
  'Diacol Capiro (R-12)': 30000,
  'Parda Pastusa': 20000,
  'ICA Unica': 28000,
  'Criolla Colombia': 12000,
  'Criolla Latina': 14000,
  'Criolla Galeras': 13000,
  'Betina': 25000,
  'Esmeralda': 22000,
  default: 20000,
};

export const getRendimientoEsperado = (variedad) => {
  const exact = RENDIMIENTO_ESPERADO[variedad];
  if (exact) return exact;
  const lower = (variedad || '').toLowerCase();
  if (lower.includes('criolla')) return 13000;
  return RENDIMIENTO_ESPERADO.default;
};
