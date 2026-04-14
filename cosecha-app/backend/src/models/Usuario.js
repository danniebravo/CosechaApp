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

  /**
   * Calcula dinámicamente si el usuario completó el onboarding.
   * Requiere: al menos 1 finca activa con al menos 1 lote activo.
   */
  async checkOnboarding(usuarioId) {
    const result = await query(
      `SELECT EXISTS (
        SELECT 1
        FROM fincas f
        INNER JOIN lotes l ON l.finca_id = f.id AND l.activo = true
        WHERE f.usuario_id = $1 AND f.activa = true
      ) AS completed`,
      [usuarioId]
    );
    return result.rows[0].completed;
  }
}

module.exports = new Usuario();
