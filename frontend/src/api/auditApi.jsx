import axiosInstance from "./axiosInstance";

const auditApi = {
  getAll: (params = {}) => axiosInstance.get("/audit-logs", { params }),
  getById: (id) => axiosInstance.get(`/audit-logs/${id}`),
  getByUser: (userId, params = {}) => 
    axiosInstance.get(`/audit-logs/user/${userId}`, { params }),
  getByAction: (action, params = {}) => 
    axiosInstance.get(`/audit-logs/action/${action}`, { params }),
  getByResourceType: (resourceType, params = {}) => 
    axiosInstance.get(`/audit-logs/resource/${resourceType}`, { params }),
  getByDateRange: (startDate, endDate, params = {}) => 
    axiosInstance.get("/audit-logs/date-range", { 
      params: { startDate, endDate, ...params } 
    }),
  exportLogs: (params = {}) => 
    axiosInstance.get("/audit-logs/export", { 
      params,
      responseType: 'blob'
    }),
};

export default auditApi;
