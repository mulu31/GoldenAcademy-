import { useState } from "react";
import termApi from "../api/termApi";
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

const TermsPage = () => {
  const [saving, setSaving] = useState(false);
  const termQuery = useFetch(() => termApi.getAll(), []);

  const form = useForm({
    initialValues: { academic_year: "", semester: "" },
    validate: (values) => validateForm("term", values),
    onSubmit: async (values) => {
      setSaving(true);
      try {
        await termApi.create(values);
        notify({ type: "success", message: "Term created" });
        form.reset();
        await termQuery.refetch();
      } catch (error) {
        notify({
          type: "error",
          message: error?.response?.data?.message || "Failed to create term",
        });
      } finally {
        setSaving(false);
      }
    },
  });

  return (
    <PageLayout title="Terms">
      <div className="card">
        <h3 className="mb-3 text-sm font-semibold">Create Term</h3>
        <form
          onSubmit={form.handleSubmit}
          className="grid gap-3 md:grid-cols-3"
        >
          <Input
            label="Academic Year"
            name="academic_year"
            value={form.values.academic_year}
            onChange={form.handleChange}
            error={form.errors.academic_year}
          />
          <Select
            label="Semester"
            name="semester"
            value={form.values.semester}
            onChange={form.handleChange}
            options={[
              { value: "I", label: "I" },
              { value: "II", label: "II" },
            ]}
            error={form.errors.semester}
          />
          <div className="flex items-end">
            <Button type="submit" loading={saving}>
              Save Term
            </Button>
          </div>
        </form>
      </div>

      <TableSection title="Term List">
        <Table
          rows={termQuery.data}
          loading={termQuery.loading}
          error={termQuery.error}
          columns={[
            { key: "term_id", title: "ID" },
            { key: "academic_year", title: "Academic Year" },
            { key: "semester", title: "Semester" },
          ]}
        />
      </TableSection>
    </PageLayout>
  );
};

export default TermsPage;
