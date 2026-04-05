import { useState } from "react";
import departmentApi from "../api/departmentApi";
import PageLayout from "../components/layout/PageLayout";
import Input from "../components/common/Input";
import Button from "../components/common/Button";
import Table from "../components/common/Table";
import TableSection from "../components/common/TableSection";
import { useFetch } from "../hooks/useFetch";
import { useForm } from "../hooks/useForm";
import { validateForm } from "../utils/validateForm";
import { notify } from "../utils/notifications";

const DepartmentsPage = () => {
  const [saving, setSaving] = useState(false);
  const departmentQuery = useFetch(() => departmentApi.getAll(), []);

  const form = useForm({
    initialValues: { name: "", code: "" },
    validate: (values) => validateForm("department", values),
    onSubmit: async (values) => {
      setSaving(true);
      try {
        await departmentApi.create(values);
        notify({ type: "success", message: "Department created" });
        form.reset();
        await departmentQuery.refetch();
      } catch (error) {
        notify({
          type: "error",
          message:
            error?.response?.data?.message || "Failed to create department",
        });
      } finally {
        setSaving(false);
      }
    },
  });

  return (
    <PageLayout title="Departments">
      <div className="card">
        <h3 className="mb-3 text-sm font-semibold">Create Department</h3>
        <form
          onSubmit={form.handleSubmit}
          className="grid gap-3 md:grid-cols-3"
        >
          <Input
            label="Name"
            name="name"
            value={form.values.name}
            onChange={form.handleChange}
            error={form.errors.name}
          />
          <Input
            label="Code"
            name="code"
            value={form.values.code}
            onChange={form.handleChange}
            error={form.errors.code}
          />
          <div className="flex items-end">
            <Button type="submit" loading={saving}>
              Save Department
            </Button>
          </div>
        </form>
      </div>

      <TableSection title="Department List">
        <Table
          rows={departmentQuery.data}
          loading={departmentQuery.loading}
          error={departmentQuery.error}
          columns={[
            { key: "department_id", title: "ID" },
            { key: "name", title: "Name" },
            { key: "code", title: "Code" },
          ]}
        />
      </TableSection>
    </PageLayout>
  );
};

export default DepartmentsPage;
