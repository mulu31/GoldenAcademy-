import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import teacherApi from "../../api/teacherApi";
import subjectApi from "../../api/subjectApi";
import reportApi from "../../api/reportApi";
import classApi from "../../api/classApi";
import departmentApi from "../../api/departmentApi";
import Table from "../common/Table";
import TableSection from "../common/TableSection";
import StateView from "../common/StateView";
import Modal from "../common/Modal";
import Button from "../common/Button";
import Input from "../common/Input";
import Select from "../common/Select";
import { useFetch } from "../../hooks/useFetch";
import { useForm } from "../../hooks/useForm";
import { useAuth } from "../../hooks/useAuth";
import { notify } from "../../utils/notifications";

const toNumber = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const DepartmentDashboard = () => {
  const { user } = useAuth();
  const departmentId = user?.department_id || user?.departmentId;

  // Modal state
  const [subjectModalOpen, setSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [teacherModalOpen, setTeacherModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [assignSubjectModalOpen, setAssignSubjectModalOpen] = useState(false);
  const [assignClassSubjectModalOpen, setAssignClassSubjectModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Data fetching - filtered by department
  const teachersQuery = useFetch(
    () => departmentId ? teacherApi.getByDepartment(departmentId) : teacherApi.getAll(),
    [departmentId],
  );
  const subjectsQuery = useFetch(
    () => departmentId ? subjectApi.getByDepartment(departmentId) : subjectApi.getAll(),
    [departmentId],
  );
  const reportsQuery = useFetch(
    () => departmentId ? reportApi.getDepartmentReport(departmentId) : reportApi.getAcademicReport(),
    [departmentId],
  );
  const classesQuery = useFetch(() => classApi.getAll(), []);
  const departmentQuery = useFetch(
    () => departmentId ? departmentApi.getById(departmentId) : Promise.resolve({ data: null }),
    [departmentId],
    true,
    { mode: "payload" },
  );

  const errors = [
    teachersQuery.error,
    subjectsQuery.error,
    reportsQuery.error,
  ].filter(Boolean);

  const reportRows = reportsQuery.data || [];
  const passRows = reportRows.filter((row) => row.status === "PASS");
  const failRows = reportRows.filter((row) => row.status !== "PASS");
  const passRate = reportRows.length
    ? ((passRows.length / reportRows.length) * 100).toFixed(1)
    : "0.0";

  const needsSupportRows = useMemo(
    () =>
      [...failRows]
        .sort((a, b) => toNumber(a.average_score) - toNumber(b.average_score))
        .slice(0, 12),
    [failRows],
  );

  const topPerformers = useMemo(
    () =>
      [...reportRows]
        .sort((a, b) => toNumber(a.rank) - toNumber(b.rank))
        .slice(0, 12),
    [reportRows],
  );

  // Subject form
  const subjectForm = useForm({
    initialValues: { name: "", code: "" },
    onSubmit: async (values) => {
      setSubmitting(true);
      try {
        const payload = { ...values, department_id: departmentId };
        if (editingSubject) {
          await subjectApi.update(editingSubject.subject_id, payload);
          notify({ type: "success", message: "Subject updated successfully" });
        } else {
          await subjectApi.create(payload);
          notify({ type: "success", message: "Subject created successfully" });
        }
        setSubjectModalOpen(false);
        setEditingSubject(null);
        subjectForm.reset();
        subjectsQuery.refetch();
      } catch (error) {
        notify({
          type: "error",
          message: error.response?.data?.error || "Failed to save subject",
        });
      } finally {
        setSubmitting(false);
      }
    },
    validate: (values) => {
      const errors = {};
      if (!values.name) errors.name = "Name is required";
      if (!values.code) errors.code = "Code is required";
      return errors;
    },
  });

  // Teacher form
  const teacherForm = useForm({
    initialValues: { full_name: "", user_id: "" },
    onSubmit: async (values) => {
      setSubmitting(true);
      try {
        const payload = { ...values, department_id: departmentId };
        if (editingTeacher) {
          await teacherApi.update(editingTeacher.teacher_id, payload);
          notify({ type: "success", message: "Teacher updated successfully" });
        } else {
          await teacherApi.create(payload);
          notify({ type: "success", message: "Teacher created successfully" });
        }
        setTeacherModalOpen(false);
        setEditingTeacher(null);
        teacherForm.reset();
        teachersQuery.refetch();
      } catch (error) {
        notify({
          type: "error",
          message: error.response?.data?.error || "Failed to save teacher",
        });
      } finally {
        setSubmitting(false);
      }
    },
    validate: (values) => {
      const errors = {};
      if (!values.full_name) errors.full_name = "Full name is required";
      return errors;
    },
  });

  // Assign teacher to subject form
  const assignSubjectForm = useForm({
    initialValues: { subject_id: "", class_subject_id: "" },
    onSubmit: async (values) => {
      setSubmitting(true);
      try {
        await teacherApi.assignToSubject({
          teacher_id: selectedTeacher.teacher_id,
          class_subject_id: parseInt(values.class_subject_id),
        });
        notify({ type: "success", message: "Teacher assigned to subject successfully" });
        setAssignSubjectModalOpen(false);
        setSelectedTeacher(null);
        assignSubjectForm.reset();
        teachersQuery.refetch();
      } catch (error) {
        notify({
          type: "error",
          message: error.response?.data?.error || "Failed to assign teacher to subject",
        });
      } finally {
        setSubmitting(false);
      }
    },
    validate: (values) => {
      const errors = {};
      if (!values.class_subject_id) errors.class_subject_id = "Class-subject assignment is required";
      return errors;
    },
  });

  // Assign teacher to class-subject form
  const assignClassSubjectForm = useForm({
    initialValues: { teacher_id: "", class_id: "", subject_id: "" },
    onSubmit: async (values) => {
      setSubmitting(true);
      try {
        // Find the class_subject_id for the selected class + subject
        const classSubjectsResponse = await classApi.getSubjects(values.class_id);
        const classSubjects = Array.isArray(classSubjectsResponse?.data)
          ? classSubjectsResponse.data
          : classSubjectsResponse?.data?.data || [];
        const match = classSubjects.find(
          (cs) => String(cs.subject_id) === String(values.subject_id),
        );
        if (!match) {
          notify({ type: "error", message: "Subject not found in selected class" });
          setSubmitting(false);
          return;
        }
        await teacherApi.assignToSubject({
          teacher_id: parseInt(values.teacher_id),
          class_subject_id: match.class_subject_id,
        });
        notify({ type: "success", message: "Teacher assigned to class-subject successfully" });
        setAssignClassSubjectModalOpen(false);
        assignClassSubjectForm.reset();
        teachersQuery.refetch();
      } catch (error) {
        notify({
          type: "error",
          message: error.response?.data?.error || "Failed to assign teacher to class-subject",
        });
      } finally {
        setSubmitting(false);
      }
    },
    validate: (values) => {
      const errors = {};
      if (!values.teacher_id) errors.teacher_id = "Teacher is required";
      if (!values.class_id) errors.class_id = "Class is required";
      if (!values.subject_id) errors.subject_id = "Subject is required";
      return errors;
    },
  });

  const teacherOptions = (teachersQuery.data || []).map((t) => ({
    value: t.teacher_id,
    label: t.full_name,
  }));

  const subjectOptions = (subjectsQuery.data || []).map((s) => ({
    value: s.subject_id,
    label: `${s.name} (${s.code})`,
  }));

  const classOptions = (classesQuery.data || []).map((c) => ({
    value: c.class_id,
    label: c.class_name,
  }));

  const refreshAll = async () => {
    await Promise.allSettled([
      teachersQuery.refetch(),
      subjectsQuery.refetch(),
      reportsQuery.refetch(),
    ]);
  };

  const handleEditSubject = (subject) => {
    setEditingSubject(subject);
    subjectForm.setValues({ name: subject.name, code: subject.code });
    setSubjectModalOpen(true);
  };

  const handleDeleteSubject = async (subjectId) => {
    if (!window.confirm("Are you sure you want to delete this subject?")) return;
    try {
      await subjectApi.remove(subjectId);
      notify({ type: "success", message: "Subject deleted successfully" });
      subjectsQuery.refetch();
    } catch (error) {
      notify({
        type: "error",
        message: error.response?.data?.error || "Failed to delete subject",
      });
    }
  };

  const handleEditTeacher = (teacher) => {
    setEditingTeacher(teacher);
    teacherForm.setValues({ full_name: teacher.full_name, user_id: teacher.user_id || "" });
    setTeacherModalOpen(true);
  };

  const handleDeleteTeacher = async (teacherId) => {
    if (!window.confirm("Are you sure you want to delete this teacher?")) return;
    try {
      await teacherApi.remove(teacherId);
      notify({ type: "success", message: "Teacher deleted successfully" });
      teachersQuery.refetch();
    } catch (error) {
      notify({
        type: "error",
        message: error.response?.data?.error || "Failed to delete teacher",
      });
    }
  };

  const handleOpenAssignSubject = (teacher) => {
    setSelectedTeacher(teacher);
    assignSubjectForm.reset();
    setAssignSubjectModalOpen(true);
  };

  return (
    <div className="space-y-4">
      {errors.length ? (
        <StateView
          type="error"
          title="Department data load issue"
          description={errors[0]}
          action={
            <button
              type="button"
              onClick={refreshAll}
              className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Retry Dashboard Load
            </button>
          }
        />
      ) : null}

      {/* Department info banner */}
      {departmentQuery.data && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
          <p className="text-sm font-semibold text-emerald-800">
            {departmentQuery.data.name}
            <span className="ml-2 rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
              {departmentQuery.data.code}
            </span>
          </p>
          <p className="text-xs text-emerald-600">Your department</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="metric-item">
          <p className="metric-label">Teachers</p>
          <p className="metric-value">{teachersQuery.data.length}</p>
          <p className="mt-1 text-xs text-slate-600">Faculty strength</p>
        </div>
        <div className="metric-item">
          <p className="metric-label">Subjects</p>
          <p className="metric-value">{subjectsQuery.data.length}</p>
          <p className="mt-1 text-xs text-slate-600">Curriculum load</p>
        </div>
        <div className="metric-item">
          <p className="metric-label">Pass Rate</p>
          <p className="metric-value">{passRate}%</p>
          <p className="mt-1 text-xs text-slate-600">From current reports</p>
        </div>
        <div className="metric-item">
          <p className="metric-label">Needs Support</p>
          <p className="metric-value">{failRows.length}</p>
          <p className="mt-1 text-xs text-slate-600">Fail-status learners</p>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <Link to="/teachers" className="card">
          <p className="text-sm font-semibold">Open Teachers</p>
          <p className="text-xs text-slate-500">Manage faculty allocation and records.</p>
        </Link>
        <Link to="/subjects" className="card">
          <p className="text-sm font-semibold">Open Subjects</p>
          <p className="text-xs text-slate-500">Update subject catalog and weighting.</p>
        </Link>
        <Link to="/reports" className="card">
          <p className="text-sm font-semibold">Open Reports</p>
          <p className="text-xs text-slate-500">Monitor class outcomes and rankings.</p>
        </Link>
      </div>

      {/* Subject Management */}
      <TableSection
        title="Subject Management"
        actions={
          <div className="flex gap-2">
            <Button
              variant="primary"
              onClick={() => {
                setEditingSubject(null);
                subjectForm.reset();
                setSubjectModalOpen(true);
              }}
            >
              Add Subject
            </Button>
          </div>
        }
      >
        <Table
          rows={subjectsQuery.data || []}
          loading={subjectsQuery.loading}
          error={subjectsQuery.error}
          columns={[
            { key: "subject_id", title: "ID" },
            { key: "name", title: "Name" },
            { key: "code", title: "Code" },
            { key: "total_mark", title: "Total Mark" },
            {
              key: "actions",
              title: "Actions",
              render: (row) => (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditSubject(row)}
                    className="text-xs text-emerald-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteSubject(row.subject_id)}
                    className="text-xs text-rose-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              ),
            },
          ]}
          searchPlaceholder="Search subjects..."
          pageSize={10}
          pageSizeOptions={[10, 20, 30]}
        />
      </TableSection>

      {/* Teacher Management */}
      <TableSection
        title="Teacher Management"
        actions={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                assignClassSubjectForm.reset();
                setAssignClassSubjectModalOpen(true);
              }}
            >
              Assign to Class-Subject
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setEditingTeacher(null);
                teacherForm.reset();
                setTeacherModalOpen(true);
              }}
            >
              Add Teacher
            </Button>
          </div>
        }
      >
        <Table
          rows={teachersQuery.data || []}
          loading={teachersQuery.loading}
          error={teachersQuery.error}
          columns={[
            { key: "teacher_id", title: "ID" },
            { key: "full_name", title: "Name" },
            {
              key: "department_name",
              title: "Department",
              render: (row) => row.department?.name || row.department_name || "-",
            },
            {
              key: "actions",
              title: "Actions",
              render: (row) => (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditTeacher(row)}
                    className="text-xs text-emerald-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleOpenAssignSubject(row)}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Assign Subject
                  </button>
                  <button
                    onClick={() => handleDeleteTeacher(row.teacher_id)}
                    className="text-xs text-rose-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              ),
            },
          ]}
          searchPlaceholder="Search teachers..."
          pageSize={10}
          pageSizeOptions={[10, 20, 30]}
        />
      </TableSection>

      {/* Department Report */}
      <TableSection title="Students Requiring Academic Support">
        <Table
          rows={needsSupportRows}
          loading={reportsQuery.loading && !needsSupportRows.length}
          error={reportsQuery.error}
          columns={[
            { key: "student_school_id", title: "Student ID" },
            { key: "full_name", title: "Student" },
            { key: "class_name", title: "Class" },
            { key: "average_score", title: "Average" },
            { key: "status", title: "Status" },
          ]}
          searchPlaceholder="Search support list..."
          pageSize={12}
          pageSizeOptions={[12, 24, 36]}
        />
      </TableSection>

      <TableSection title="Top Performing Students">
        <Table
          rows={topPerformers}
          loading={reportsQuery.loading && !topPerformers.length}
          error={reportsQuery.error}
          columns={[
            { key: "rank", title: "Rank" },
            { key: "student_school_id", title: "Student ID" },
            { key: "full_name", title: "Student" },
            { key: "class_name", title: "Class" },
            { key: "average_score", title: "Average" },
          ]}
          searchPlaceholder="Search top performers..."
          pageSize={12}
          pageSizeOptions={[12, 24, 36]}
        />
      </TableSection>

      {/* Subject Modal */}
      <Modal
        open={subjectModalOpen}
        title={editingSubject ? "Edit Subject" : "Add Subject"}
        onClose={() => {
          setSubjectModalOpen(false);
          setEditingSubject(null);
          subjectForm.reset();
        }}
      >
        <form onSubmit={subjectForm.handleSubmit} className="space-y-4">
          <Input
            label="Name"
            name="name"
            value={subjectForm.values.name}
            onChange={subjectForm.handleChange}
            error={subjectForm.errors.name}
            required
          />
          <Input
            label="Code"
            name="code"
            value={subjectForm.values.code}
            onChange={subjectForm.handleChange}
            error={subjectForm.errors.code}
            required
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setSubjectModalOpen(false);
                setEditingSubject(null);
                subjectForm.reset();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {editingSubject ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Teacher Modal */}
      <Modal
        open={teacherModalOpen}
        title={editingTeacher ? "Edit Teacher" : "Add Teacher"}
        onClose={() => {
          setTeacherModalOpen(false);
          setEditingTeacher(null);
          teacherForm.reset();
        }}
      >
        <form onSubmit={teacherForm.handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            name="full_name"
            value={teacherForm.values.full_name}
            onChange={teacherForm.handleChange}
            error={teacherForm.errors.full_name}
            required
          />
          <Input
            label="User ID (optional)"
            name="user_id"
            type="number"
            value={teacherForm.values.user_id}
            onChange={teacherForm.handleChange}
            error={teacherForm.errors.user_id}
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setTeacherModalOpen(false);
                setEditingTeacher(null);
                teacherForm.reset();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {editingTeacher ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Assign Teacher to Subject Modal */}
      <Modal
        open={assignSubjectModalOpen}
        title={`Assign ${selectedTeacher?.full_name || "Teacher"} to Subject`}
        onClose={() => {
          setAssignSubjectModalOpen(false);
          setSelectedTeacher(null);
          assignSubjectForm.reset();
        }}
      >
        <form onSubmit={assignSubjectForm.handleSubmit} className="space-y-4">
          <Select
            label="Class"
            name="class_id"
            value={assignSubjectForm.values.class_id}
            onChange={assignSubjectForm.handleChange}
            options={classOptions}
            required
          />
          <Select
            label="Subject (from your department)"
            name="class_subject_id"
            value={assignSubjectForm.values.class_subject_id}
            onChange={assignSubjectForm.handleChange}
            error={assignSubjectForm.errors.class_subject_id}
            options={subjectOptions.map((s) => ({ value: s.value, label: s.label }))}
            required
          />
          <p className="text-xs text-slate-500">
            Note: The subject must be assigned to the selected class. Contact a system admin if the
            class-subject link is missing.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setAssignSubjectModalOpen(false);
                setSelectedTeacher(null);
                assignSubjectForm.reset();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Assign
            </Button>
          </div>
        </form>
      </Modal>

      {/* Assign Teacher to Class-Subject Modal */}
      <Modal
        open={assignClassSubjectModalOpen}
        title="Assign Teacher to Class-Subject"
        onClose={() => {
          setAssignClassSubjectModalOpen(false);
          assignClassSubjectForm.reset();
        }}
      >
        <form onSubmit={assignClassSubjectForm.handleSubmit} className="space-y-4">
          <Select
            label="Teacher"
            name="teacher_id"
            value={assignClassSubjectForm.values.teacher_id}
            onChange={assignClassSubjectForm.handleChange}
            error={assignClassSubjectForm.errors.teacher_id}
            options={teacherOptions}
            required
          />
          <Select
            label="Class"
            name="class_id"
            value={assignClassSubjectForm.values.class_id}
            onChange={assignClassSubjectForm.handleChange}
            error={assignClassSubjectForm.errors.class_id}
            options={classOptions}
            required
          />
          <Select
            label="Subject"
            name="subject_id"
            value={assignClassSubjectForm.values.subject_id}
            onChange={assignClassSubjectForm.handleChange}
            error={assignClassSubjectForm.errors.subject_id}
            options={subjectOptions}
            required
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setAssignClassSubjectModalOpen(false);
                assignClassSubjectForm.reset();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Assign
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DepartmentDashboard;
