import { useMemo, useState } from "react";
import teacherApi from "../api/teacherApi";
import userApi from "../api/userApi";
import departmentApi from "../api/departmentApi";
import PageLayout from "../components/layout/PageLayout";
import Input from "../components/common/Input";
import Select from "../components/common/Select";
import Button from "../components/common/Button";
import Table from "../components/common/Table";
import TableSection from "../components/common/TableSection";
import { useFetch } from "../hooks/useFetch";
import { useForm } from "../hooks/useForm";
import { validateForm } from "../utils/validateForm";
import { notify } from "../utils/notifications";

const TeachersPage = () => {
  const [saving, setSaving] = useState(false);
  const teacherQuery = useFetch(() => teacherApi.getAll(), []);
  const userQuery = useFetch(() => userApi.getAll(), []);
  const departmentQuery = useFetch(() => departmentApi.getAll(), []);

  const userLookup = useMemo(
    () =>
      Object.fromEntries(
        (userQuery.data || []).map((user) => [user.user_id, user.email]),
      ),
    [userQuery.data],
  );

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

  const form = useForm({
    initialValues: { full_name: "", user_id: "", department_id: "" },
    validate: (values) => validateForm("teacher", values),
    onSubmit: async (values) => {
      setSaving(true);
      try {
        await teacherApi.create({
          ...values,
          user_id: values.user_id ? Number(values.user_id) : null,
          department_id: values.department_id
            ? Number(values.department_id)
            : null,
        });
        notify({ type: "success", message: "Teacher created" });
        form.reset();
        await teacherQuery.refetch();
      } catch (error) {
        notify({
          type: "error",
          message: error?.response?.data?.message || "Failed to create teacher",
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
          className="grid gap-3 md:grid-cols-4"
        >
          <Input
            label="Full Name"
            name="full_name"
            value={form.values.full_name}
            onChange={form.handleChange}
            error={form.errors.full_name}
          />
          <Select
            label="User"
            name="user_id"
            value={form.values.user_id}
            onChange={form.handleChange}
            options={userQuery.data.map((u) => ({
              value: u.user_id,
              label: u.email,
            }))}
          />
          <Select
            label="Department"
            name="department_id"
            value={form.values.department_id}
            onChange={form.handleChange}
            options={departmentQuery.data.map((d) => ({
              value: d.department_id,
              label: d.name,
            }))}
          />
          <div className="flex items-end">
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
              render: (row) => userLookup[row.user_id] || row.user_id || "-",
            },
            {
              key: "department_id",
              title: "Department",
              render: (row) =>
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
