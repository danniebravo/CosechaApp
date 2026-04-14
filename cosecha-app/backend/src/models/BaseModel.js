const { query, getClient } = require('../config/database');

class BaseModel {
  constructor(tableName) {
    this.tableName = tableName;
  }

  async findAll(conditions = {}, options = {}) {
    let sql = `SELECT * FROM ${this.tableName}`;
    const params = [];
    const whereClauses = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(conditions)) {
      whereClauses.push(`${key} = $${paramIndex}`);
      params.push(value);
      paramIndex++;
    }

    if (whereClauses.length > 0) {
      sql += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    if (options.orderBy) {
      sql += ` ORDER BY ${options.orderBy} ${options.order || 'DESC'}`;
    } else {
      sql += ` ORDER BY created_at DESC`;
    }

    if (options.limit) {
      sql += ` LIMIT $${paramIndex}`;
      params.push(options.limit);
      paramIndex++;
    }

    if (options.offset) {
      sql += ` OFFSET $${paramIndex}`;
      params.push(options.offset);
    }

    const result = await query(sql, params);
    return result.rows;
  }

  async findById(id) {
    const result = await query(
      `SELECT * FROM ${this.tableName} WHERE id = $1`, [id]
    );
    return result.rows[0] || null;
  }

  async create(data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => `$${i + 1}`);

    const sql = `
      INSERT INTO ${this.tableName} (${keys.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING *
    `;
    const result = await query(sql, values);
    return result.rows[0];
  }

  async update(id, data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClauses = keys.map((key, i) => `${key} = $${i + 1}`);

    const sql = `
      UPDATE ${this.tableName}
      SET ${setClauses.join(', ')}
      WHERE id = $${keys.length + 1}
      RETURNING *
    `;
    values.push(id);
    const result = await query(sql, values);
    return result.rows[0] || null;
  }

  async delete(id) {
    const result = await query(
      `DELETE FROM ${this.tableName} WHERE id = $1 RETURNING *`, [id]
    );
    return result.rows[0] || null;
  }

  async count(conditions = {}) {
    let sql = `SELECT COUNT(*) FROM ${this.tableName}`;
    const params = [];
    const whereClauses = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(conditions)) {
      whereClauses.push(`${key} = $${paramIndex}`);
      params.push(value);
      paramIndex++;
    }

    if (whereClauses.length > 0) {
      sql += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    const result = await query(sql, params);
    return parseInt(result.rows[0].count);
  }
}

module.exports = BaseModel;
