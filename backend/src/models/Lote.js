const BaseModel = require('./BaseModel');
const { query } = require('../config/database');

class Lote extends BaseModel {
  constructor() {
    super('lotes');
  }

  async findByFinca(fincaId) {
    const result = await query(
      'SELECT * FROM lotes WHERE finca_id = $1 AND activo = true ORDER BY nombre',
      [fincaId]
    );
    return result.rows;
  }

  async findByIdWithCosechas(id) {
    const lote = await this.findById(id);
    if (!lote) return null;

    const cosechas = await query(
      'SELECT * FROM cosechas WHERE lote_id = $1 ORDER BY fecha_siembra DESC',
      [id]
    );
    return { ...lote, cosechas: cosechas.rows };
  }
}

module.exports = new Lote();
