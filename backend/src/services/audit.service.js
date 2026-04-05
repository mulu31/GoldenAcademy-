import pool from '../config/db.js';

/**
 * Get audit logs with filtering and pagination
 * @param {Object} filters - Filter options
 * @param {number} filters.userId - Filter by user ID
 * @param {string} filters.action - Filter by action type
 * @param {string} filters.resourceType - Filter by resource type
 * @param {string} filters.startDate - Filter by start date (ISO string)
 * @param {string} filters.endDate - Filter by end date (ISO string)
 * @param {number} filters.page - Page number (default: 1)
 * @param {number} filters.limit - Items per page (default: 50)
 * @returns {Promise<Object>} - Paginated audit logs with metadata
 */
export const getAuditLogs = async (filters = {}) => {
  const { 
    userId, 
    action, 
    resourceType, 
    startDate, 
    endDate, 
    page = 1, 
    limit = 50 
  } = filters;
  
  // Build dynamic WHERE clause
  const conditions = [];
  const params = [];
  let paramCount = 1;
  
  if (userId) {
    conditions.push(`al.user_id = $${paramCount++}`);
    params.push(parseInt(userId));
  }
  
  if (action) {
    conditions.push(`al.action = $${paramCount++}`);
    params.push(action);
  }
  
  if (resourceType) {
    conditions.push(`al.resource_type = $${paramCount++}`);
    params.push(resourceType);
  }
  
  if (startDate) {
    conditions.push(`al.created_at >= $${paramCount++}`);
    params.push(new Date(startDate));
  }
  
  if (endDate) {
    conditions.push(`al.created_at <= $${paramCount++}`);
    params.push(new Date(endDate));
  }
  
  const whereClause = conditions.length > 0 
    ? `WHERE ${conditions.join(' AND ')}` 
    : '';
  
  // Calculate pagination
  const skip = (page - 1) * limit;
  const take = parseInt(limit);
  
  // Execute queries in parallel
  const [logsResult, countResult] = await Promise.all([
    pool.query(`
      SELECT 
        al.audit_log_id,
        al.user_id,
        al.action,
        al.resource_type,
        al.resource_id,
        al.ip_address,
        al.metadata,
        al.created_at,
        json_build_object(
          'userId', u.user_id,
          'email', u.email
        ) as user
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.user_id
      ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT $${paramCount++} OFFSET $${paramCount}
    `, [...params, take, skip]),
    pool.query(`
      SELECT COUNT(*) as count
      FROM audit_logs al
      ${whereClause}
    `, params)
  ]);
  
  // Transform results to camelCase
  const logs = logsResult.rows.map(row => ({
    auditLogId: row.audit_log_id,
    userId: row.user_id,
    action: row.action,
    resourceType: row.resource_type,
    resourceId: row.resource_id,
    ipAddress: row.ip_address,
    metadata: row.metadata,
    createdAt: row.created_at,
    user: row.user
  }));
  
  const total = parseInt(countResult.rows[0].count);
  
  return {
    logs,
    total,
    page: parseInt(page),
    limit: take,
    totalPages: Math.ceil(total / take)
  };
};

/**
 * Get audit log by ID
 * @param {number} auditLogId - Audit log ID
 * @returns {Promise<Object|null>} - Audit log or null
 */
export const getAuditLogById = async (auditLogId) => {
  const result = await pool.query(`
    SELECT 
      al.audit_log_id,
      al.user_id,
      al.action,
      al.resource_type,
      al.resource_id,
      al.ip_address,
      al.metadata,
      al.created_at,
      json_build_object(
        'userId', u.user_id,
        'email', u.email
      ) as user
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.user_id
    WHERE al.audit_log_id = $1
  `, [parseInt(auditLogId)]);
  
  if (result.rows.length === 0) {
    return null;
  }
  
  const row = result.rows[0];
  return {
    auditLogId: row.audit_log_id,
    userId: row.user_id,
    action: row.action,
    resourceType: row.resource_type,
    resourceId: row.resource_id,
    ipAddress: row.ip_address,
    metadata: row.metadata,
    createdAt: row.created_at,
    user: row.user
  };
};

/**
 * Get audit logs for a specific user
 * @param {number} userId - User ID
 * @param {Object} options - Pagination options
 * @returns {Promise<Object>} - Paginated audit logs
 */
export const getUserAuditLogs = async (userId, options = {}) => {
  return await getAuditLogs({
    ...options,
    userId
  });
};

/**
 * Get audit logs for a specific resource
 * @param {string} resourceType - Resource type
 * @param {number} resourceId - Resource ID
 * @param {Object} options - Pagination options
 * @returns {Promise<Object>} - Paginated audit logs
 */
export const getResourceAuditLogs = async (resourceType, resourceId, options = {}) => {
  const { page = 1, limit = 50 } = options;
  
  const skip = (page - 1) * limit;
  const take = parseInt(limit);
  
  const [logsResult, countResult] = await Promise.all([
    pool.query(`
      SELECT 
        al.audit_log_id,
        al.user_id,
        al.action,
        al.resource_type,
        al.resource_id,
        al.ip_address,
        al.metadata,
        al.created_at,
        json_build_object(
          'userId', u.user_id,
          'email', u.email
        ) as user
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.user_id
      WHERE al.resource_type = $1 AND al.resource_id = $2
      ORDER BY al.created_at DESC
      LIMIT $3 OFFSET $4
    `, [resourceType, parseInt(resourceId), take, skip]),
    pool.query(`
      SELECT COUNT(*) as count
      FROM audit_logs al
      WHERE al.resource_type = $1 AND al.resource_id = $2
    `, [resourceType, parseInt(resourceId)])
  ]);
  
  // Transform results to camelCase
  const logs = logsResult.rows.map(row => ({
    auditLogId: row.audit_log_id,
    userId: row.user_id,
    action: row.action,
    resourceType: row.resource_type,
    resourceId: row.resource_id,
    ipAddress: row.ip_address,
    metadata: row.metadata,
    createdAt: row.created_at,
    user: row.user
  }));
  
  const total = parseInt(countResult.rows[0].count);
  
  return {
    logs,
    total,
    page: parseInt(page),
    limit: take,
    totalPages: Math.ceil(total / take)
  };
};
