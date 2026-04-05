import { useMemo, useState } from "react";
import subjectApi from "../api/subjectApi";
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

const SubjectsPage = () => {
  const [saving, setSaving] = useState(false);
  const subjectQuery = useFetch(() => subjectApi.getAll(), []);
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

  const form = useForm({
    initialValues: { name: "", code: "", department_id: "", total_mark: "100" },
    validate: (values) => validateForm("subject", values),
    onSubmit: async (values) => {
      setSaving(true);
      try {
        await subjectApi.create({
          ...values,
          department_id: values.department_id
            ? Number(values.department_id)
            : null,
          total_mark: Number(values.total_mark),
        });
        notify({ type: "success", message: "Subject created" });
        form.reset();
        await subjectQuery.refetch();
      } catch (error) {
        notify({
          type: "error",
          message: error?.response?.data?.message || "Failed to create subject",
        });
      } finally {
        setSaving(false);
      }
    },
  });

  return (
    <PageLayout title="Subjects">
      <div className="card">
        <h3 className="mb-3 text-sm font-semibold">Create Subject</h3>
        <form
          onSubmit={form.handleSubmit}
          className="grid gap-3 md:grid-cols-4"
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
          <Select
            label="Department"
            name="department_id"
            value={form.values.department_id}
            onChange={form.handleChange}
            options={departmentQuery.data.map((d) => ({
              value: d.department_id,
              label: d.name,
            }))}
            error={form.errors.department_id}
          />
          <Input
            label="Total Mark"
            name="total_mark"
            type="number"
            value={form.values.total_mark}
            onChange={form.handleChange}
            error={form.errors.total_mark}
          />
          <div className="md:col-span-4">
            <Button type="submit" loading={saving}>
              Save Subject
            </Button>
          </div>
        </form>
      </div>

      <TableSection title="Subject List">
        <Table
          rows={subjectQuery.data}
          loading={subjectQuery.loading}
          error={subjectQuery.error}
          columns={[
            { key: "subject_id", title: "ID" },
            { key: "name", title: "Name" },
            { key: "code", title: "Code" },
            {
              key: "department_id",
              title: "Department",
              render: (row) =>
                row.department_name ||
                departmentLookup[row.department_id] ||
                row.department_id ||
                "-",
            },
            { key: "total_mark", title: "Total Mark" },
          ]}
        />
      </TableSection>
    </PageLayout>
  );
};

export default SubjectsPage;
