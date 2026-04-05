import { useMemo, useState } from "react";
import studentApi from "../api/studentApi";
import classApi from "../api/classApi";
import PageLayout from "../components/layout/PageLayout";
import StudentForm from "../components/students/StudentForm";
import EnrollmentForm from "../components/students/EnrollmentForm";
import StudentList from "../components/students/StudentList";
import Button from "../components/common/Button";
import TableSection from "../components/common/TableSection";
import { FileDown } from "lucide-react";
import { useFetch } from "../hooks/useFetch";
import { exportRowsToPdf } from "../utils/exportPdf";
import { notify } from "../utils/notifications";

const StudentsPage = () => {
  const [saving, setSaving] = useState(false);

  const studentsQuery = useFetch(() => studentApi.getAll(), []);
  const classesQuery = useFetch(() => classApi.getAll(), []);

  const classLookup = useMemo(
    () =>
      Object.fromEntries(
        (classesQuery.data || []).map((item) => [
          item.class_id,
          `${item.class_name} (${item.grade})`,
        ]),
      ),
    [classesQuery.data],
  );

  const handleCreateStudent = async (values) => {
    setSaving(true);
    try {
      await studentApi.create(values);
      notify({ type: "success", message: "Student created" });
      await studentsQuery.refetch();
    } catch (error) {
      notify({
        type: "error",
        message: error?.response?.data?.message || "Failed to create student",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEnroll = async (values) => {
    setSaving(true);
    try {
      await studentApi.enroll({
        student_id: Number(values.student_id),
        class_id: Number(values.class_id),
      });
      notify({ type: "success", message: "Student enrolled" });
    } catch (error) {
      notify({
        type: "error",
        message: error?.response?.data?.message || "Enrollment failed",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleExportStudents = async () => {
    if (!studentsQuery.data?.length) {
      notify({
        type: "warning",
        message: "No student data is available for export.",
      });
      return;
    }

    await exportRowsToPdf({
      fileName: "golden-high-school-students.pdf",
      title: "Golden High School - Student Directory",
      subtitle: `Total records: ${studentsQuery.data.length}`,
      columns: [
        { header: "Student ID", accessor: (row) => row.student_school_id },
        { header: "Full Name", accessor: (row) => row.full_name },
        { header: "Gender", accessor: (row) => row.gender },
        {
          header: "Class",
          accessor: (row) =>
            row.class_name || classLookup[row.class_id] || row.class_id,
        },
      ],
      rows: studentsQuery.data,
    });

    notify({
      type: "success",
      message: "Student data has been exported successfully.",
    });
  };

  return (
    <PageLayout title="Students">
      <div className="card">
        <h3 className="mb-3 text-sm font-semibold text-slate-800">
          Register Student
        </h3>
        <StudentForm
          initialValues={{ student_school_id: "", full_name: "", gender: "" }}
          onSubmit={handleCreateStudent}
          loading={saving}
        />
      </div>

      <div className="card">
        <h3 className="mb-3 text-sm font-semibold text-slate-800">
          Enroll Student to Class
        </h3>
        <EnrollmentForm
          students={studentsQuery.data}
          classes={classesQuery.data}
          onSubmit={handleEnroll}
          loading={saving}
        />
      </div>

      <TableSection
        title="Student List"
        actions={
          <Button variant="secondary" onClick={handleExportStudents}>
            <span className="inline-flex items-center gap-2">
              <FileDown className="h-4 w-4" />
              Export PDF
            </span>
          </Button>
        }
      >
        <StudentList
          students={studentsQuery.data}
          classLookup={classLookup}
          loading={studentsQuery.loading}
          error={studentsQuery.error}
        />
      </TableSection>
    </PageLayout>
  );
};

export default StudentsPage;
