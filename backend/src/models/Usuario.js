const BaseModel = require('./BaseModel');
const { query } = require('../config/database');

class Usuario extends BaseModel {
  constructor() {
    super('usuarios');
  }

  async findByEmail(email) {
    const result = await query(
      'SELECT * FROM usuarios WHERE email = $1', [email]
    );
    return result.rows[0] || null;
  }

  async findByIdSafe(id) {
    const result = await query(
      'SELECT id, nombre, email, telefono, rol, activo, created_at FROM usuarios WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }
}

module.exports = new Usuario();
