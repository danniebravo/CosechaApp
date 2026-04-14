const BaseModel = require('./BaseModel');
const { query } = require('../config/database');

class Finca extends BaseModel {
  constructor() {
    super('fincas');
  }

  async findByUsuario(usuarioId) {
    const result = await query(
      'SELECT * FROM fincas WHERE usuario_id = $1 AND activa = true ORDER BY nombre',
      [usuarioId]
    );
    return result.rows;
  }

  async findByIdWithLotes(id) {
    const finca = await this.findById(id);
    if (!finca) return null;

    const lotes = await query(
      'SELECT * FROM lotes WHERE finca_id = $1 AND activo = true ORDER BY nombre',
      [id]
    );
    return { ...finca, lotes: lotes.rows };
  }
}

module.exports = new Finca();
