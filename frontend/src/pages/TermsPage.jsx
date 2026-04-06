import { useMemo, useState } from "react";
import termApi from "../api/termApi";
import PageLayout from "../components/layout/PageLayout";
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

  const academicYearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const generatedYears = Array.from({ length: 6 }, (_, index) => {
      const startYear = currentYear - 2 + index;
      return `${startYear}-${startYear + 1}`;
    });

    const existingYears = (termQuery.data || [])
      .map((term) => term.academic_year || term.academicYear)
      .filter(Boolean);

    const uniqueYears = Array.from(
      new Set([...existingYears, ...generatedYears]),
    );

    const getSortKey = (academicYear) => {
      const match = String(academicYear).match(/^(\d{4})/);
      return match ? Number(match[1]) : 0;
    };

    return uniqueYears
      .sort((a, b) => getSortKey(b) - getSortKey(a))
      .map((academicYear) => ({ value: academicYear, label: academicYear }));
  }, [termQuery.data]);

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
          message:
            error?.response?.data?.message ||
            error?.response?.data?.error ||
            "Failed to create term",
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
          <Select
            label="Academic Year"
            name="academic_year"
            value={form.values.academic_year}
            onChange={form.handleChange}
            options={academicYearOptions}
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
