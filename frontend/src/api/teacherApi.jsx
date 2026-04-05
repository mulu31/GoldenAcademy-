import axiosInstance from "./axiosInstance";

const teacherApi = {
  getAll: () => axiosInstance.get("/teachers"),
  getById: (id) => axiosInstance.get(`/teachers/${id}`),
  getByDepartment: (departmentId) => axiosInstance.get(`/teachers/department/${departmentId}`),
  create: (payload) => axiosInstance.post("/teachers", payload),
  update: (id, payload) => axiosInstance.put(`/teachers/${id}`, payload),
  remove: (id) => axiosInstance.delete(`/teachers/${id}`),
  assignToSubject: (payload) => axiosInstance.post("/teachers/assign-subject", payload),
  removeFromSubject: (teacherId, classSubjectId) => 
    axiosInstance.delete(`/teachers/${teacherId}/subjects/${classSubjectId}`),
  getAssignments: (teacherId) => axiosInstance.get(`/teachers/${teacherId}/assignments`),
  getHomeroomClass: (teacherId) => axiosInstance.get(`/teachers/${teacherId}/homeroom-class`),
};

export default teacherApi;
