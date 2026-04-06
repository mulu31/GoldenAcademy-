import { useMemo, useState } from "react";
import teacherApi from "../api/teacherApi";
import departmentApi from "../api/departmentApi";
import PageLayout from "../components/layout/PageLayout";
import Input from "../components/common/Input";
import Select from "../components/common/Select";
import Button from "../components/common/Button";
import Table from "../components/common/Table";
import TableSection from "../components/common/TableSection";
import { useFetch } from "../hooks/useFetch";
import { useAuth } from "../hooks/useAuth";
import { useForm } from "../hooks/useForm";
import { validateForm } from "../utils/validateForm";
import { extractErrorMessage } from "../api/responseAdapter";
import { notify } from "../utils/notifications";

const createTeacherRoleOptions = [
  { value: "TEACHER", label: "Teacher" },
  { value: "DEPARTMENT_ADMIN", label: "Department Admin" },
  { value: "REGISTRAR", label: "Registrar" },
];

const TeachersPage = () => {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const teacherQuery = useFetch(() => teacherApi.getAll(), []);
  const departmentQuery = useFetch(() => departmentApi.getAll(), []);

  const departmentLookup = useMemo(
    () =>
      Object.fromEntries(
        (departmentQuery.data || []).map((department) => [
          department.department_id,
          department.name,
        ]),
      ),
    [departmentQuery.data],
  );

  const roleOptions = useMemo(() => {
    const roles = user?.roles || [];
    const isDeptAdminOnly =
      roles.includes("DEPARTMENT_ADMIN") &&
      !roles.includes("SYSTEM_ADMIN") &&
      !roles.includes("REGISTRAR");

    if (isDeptAdminOnly) {
      return createTeacherRoleOptions.filter(
        (role) => role.value === "TEACHER",
      );
    }

    return createTeacherRoleOptions;
  }, [user?.roles]);

  const form = useForm({
    initialValues: {
      full_name: "",
      email: "",
      password: "",
      role_name: "TEACHER",
      department_id: "",
    },
    validate: (values) => validateForm("teacher", values),
    onSubmit: async (values) => {
      setSaving(true);
      try {
        await teacherApi.create({
          fullName: values.full_name,
          email: values.email,
          password: values.password,
          roleName: values.role_name,
          departmentId: values.department_id
            ? Number(values.department_id)
            : null,
        });
        notify({ type: "success", message: "Teacher account created" });
        form.reset();
        await teacherQuery.refetch();
      } catch (error) {
        notify({
          type: "error",
          message: extractErrorMessage(error, "Failed to create teacher"),
        });
      } finally {
        setSaving(false);
      }
    },
  });

  return (
    <PageLayout title="Teachers">
      <div className="card">
        <h3 className="mb-3 text-sm font-semibold">Create Teacher</h3>
        <form
          onSubmit={form.handleSubmit}
          className="grid gap-3 md:grid-cols-6"
        >
          <Input
            label="Full Name"
            name="full_name"
            value={form.values.full_name}
            onChange={form.handleChange}
            error={form.errors.full_name}
          />
          <Input
            label="Email"
            name="email"
            type="email"
            value={form.values.email}
            onChange={form.handleChange}
            error={form.errors.email}
          />
          <Input
            label="Password"
            name="password"
            type="password"
            value={form.values.password}
            onChange={form.handleChange}
            error={form.errors.password}
          />
          <Select
            label="Role"
            name="role_name"
            value={form.values.role_name}
            onChange={form.handleChange}
            options={roleOptions}
            error={form.errors.role_name}
          />
          <Select
            label="Department"
            name="department_id"
            value={form.values.department_id}
            onChange={form.handleChange}
            options={(departmentQuery.data || []).map((d) => ({
              value: d.department_id,
              label: d.name,
            }))}
            error={form.errors.department_id}
          />
          <div className="flex items-end md:col-span-1">
            <Button type="submit" loading={saving}>
              Save Teacher
            </Button>
          </div>
        </form>
      </div>

      <TableSection title="Teacher List">
        <Table
          rows={teacherQuery.data}
          loading={teacherQuery.loading}
          error={teacherQuery.error}
          columns={[
            { key: "teacher_id", title: "ID" },
            { key: "full_name", title: "Name" },
            {
              key: "user_id",
              title: "User",
              render: (row) =>
                row.user?.email || row.user_email || row.user_id || "-",
            },
            {
              key: "department_id",
              title: "Department",
              render: (row) =>
                row.department?.name ||
                row.department_name ||
                departmentLookup[row.department_id] ||
                row.department_id ||
                "-",
            },
          ]}
        />
      </TableSection>
    </PageLayout>
  );
};

export default TeachersPage;
