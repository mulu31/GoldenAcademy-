import axiosInstance from "./axiosInstance";

const userApi = {
  getAll: () => axiosInstance.get("/users"),
  getWithRoles: () => axiosInstance.get("/users/with-roles"),
  getById: (id) => axiosInstance.get(`/users/${id}`),
  create: (payload) => axiosInstance.post("/users", payload),
  update: (id, payload) => axiosInstance.put(`/users/${id}`, payload),
  remove: (id) => axiosInstance.delete(`/users/${id}`),
  assignRole: (id, payload) => axiosInstance.post(`/users/${id}/roles`, payload),
  removeRole: (id, payload) => axiosInstance.delete(`/users/${id}/roles`, { data: payload }),
};

export default userApi;
