import { useMemo, useState } from "react";
import marksApi from "../api/marksApi";
import subjectApi from "../api/subjectApi";
import teacherApi from "../api/teacherApi";
import studentApi from "../api/studentApi";
import PageLayout from "../components/layout/PageLayout";
import MarksForm from "../components/students/MarksForm";
import Table from "../components/common/Table";
import TableSection from "../components/common/TableSection";
import { useFetch } from "../hooks/useFetch";
import { notify } from "../utils/notifications";

const MarksPage = () => {
  const [saving, setSaving] = useState(false);

  const marksQuery = useFetch(() => marksApi.getAll(), []);
  const subjectsQuery = useFetch(() => subjectApi.getAll(), []);
  const teachersQuery = useFetch(() => teacherApi.getAll(), []);
  const enrollmentsQuery = useFetch(() => studentApi.getEnrollments(), []);

  const subjectLookup = useMemo(
    () =>
      Object.fromEntries(
        (subjectsQuery.data || []).map((subject) => [
          subject.subject_id,
          subject.name,
        ]),
      ),
    [subjectsQuery.data],
  );

  const teacherLookup = useMemo(
    () =>
      Object.fromEntries(
        (teachersQuery.data || []).map((teacher) => [
          teacher.teacher_id,
          teacher.full_name,
        ]),
      ),
    [teachersQuery.data],
  );

  const submitMark = async (values) => {
    setSaving(true);
    try {
      await marksApi.submitMark({
        teacher_id: Number(values.teacher_id),
        enrollment_id: Number(values.enrollment_id),
        subject_id: Number(values.subject_id),
        mark_obtained: Number(values.mark_obtained),
      });
      notify({ type: "success", message: "Mark submitted" });
      await marksQuery.refetch();
    } catch (error) {
      notify({
        type: "error",
        message: error?.response?.data?.message || "Failed to submit mark",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageLayout title="Marks">
      <div className="card">
        <h3 className="mb-3 text-sm font-semibold">Submit or Validate Marks</h3>
        <MarksForm
          enrollments={enrollmentsQuery.data}
          subjects={subjectsQuery.data}
          teachers={teachersQuery.data}
          onSubmit={submitMark}
          loading={saving}
        />
      </div>

      <TableSection title="Submitted Marks">
        <Table
          rows={marksQuery.data}
          loading={marksQuery.loading}
          error={marksQuery.error}
          columns={[
            { key: "mark_id", title: "ID" },
            { key: "enrollment_id", title: "Enrollment" },
            {
              key: "subject_id",
              title: "Subject",
              render: (row) =>
                row.subject_name ||
                subjectLookup[row.subject_id] ||
                row.subject_id ||
                "-",
            },
            {
              key: "teacher_id",
              title: "Teacher",
              render: (row) =>
                row.teacher_name ||
                teacherLookup[row.teacher_id] ||
                row.teacher_id ||
                "-",
            },
            { key: "mark_obtained", title: "Mark" },
          ]}
        />
      </TableSection>
    </PageLayout>
  );
};

export default MarksPage;
