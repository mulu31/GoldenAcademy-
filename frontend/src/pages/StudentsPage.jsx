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
import { extractErrorMessage } from "../api/responseAdapter";
import { exportRowsToPdf } from "../utils/exportPdf";
import { notify } from "../utils/notifications";

const StudentsPage = () => {
  const [saving, setSaving] = useState(false);

  const studentsQuery = useFetch(() => studentApi.getAll(), []);
  const classesQuery = useFetch(() => classApi.getAll(), []);
  const enrollmentsQuery = useFetch(
    () => studentApi.getAllEnrollments({ page: 1, limit: 500 }),
    [],
    true,
    { mode: "payload", initialData: { enrollments: [] } },
  );

  const latestEnrollmentByStudent = useMemo(() => {
    const map = new Map();
    const enrollments = enrollmentsQuery.data?.enrollments || [];

    enrollments.forEach((enrollment) => {
      const studentId =
        enrollment.studentId ||
        enrollment.student_id ||
        enrollment.student?.studentId ||
        enrollment.student?.student_id;

      if (!studentId || map.has(String(studentId))) return;
      map.set(String(studentId), enrollment);
    });

    return map;
  }, [enrollmentsQuery.data]);

  const studentsWithAssignment = useMemo(
    () =>
      (studentsQuery.data || []).map((student) => {
        const studentId = student.studentId || student.student_id;
        const enrollment = latestEnrollmentByStudent.get(String(studentId));
        const classData = enrollment?.class || {};
        const termData = classData.term || {};

        const section =
          classData.className ||
          classData.class_name ||
          student.class_name ||
          "-";
        const classLevel = classData.grade || student.grade || "-";
        const academicYear =
          termData.academicYear || termData.academic_year || "-";
        const semester = termData.semester || "-";

        return {
          ...student,
          studentId,
          studentSchoolId:
            student.studentSchoolId || student.student_school_id || "-",
          fullName: student.fullName || student.full_name || "-",
          classDisplay:
            classLevel === "-" && section === "-"
              ? "-"
              : `${classLevel} - ${section}`,
          academicYear,
          semester,
          section,
        };
      }),
    [latestEnrollmentByStudent, studentsQuery.data],
  );

  const handleCreateStudent = async (values) => {
    setSaving(true);
    try {
      await studentApi.create({
        fullName: values.fullName,
        gender: values.gender,
      });
      notify({ type: "success", message: "Student created" });
      await studentsQuery.refetch();
    } catch (error) {
      notify({
        type: "error",
        message: extractErrorMessage(error, "Failed to create student"),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEnroll = async (values) => {
    setSaving(true);
    try {
      await studentApi.enroll({
        studentId: Number(values.studentId),
        classId: Number(values.classId),
      });
      notify({ type: "success", message: "Student enrolled" });
      await enrollmentsQuery.refetch();
    } catch (error) {
      notify({
        type: "error",
        message: extractErrorMessage(error, "Enrollment failed"),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleExportStudents = async () => {
    if (!studentsWithAssignment.length) {
      notify({
        type: "warning",
        message: "No student data is available for export.",
      });
      return;
    }

    await exportRowsToPdf({
      fileName: "golden-high-school-students.pdf",
      title: "Golden High School - Student Directory",
      subtitle: `Total records: ${studentsWithAssignment.length}`,
      columns: [
        { header: "Student ID", accessor: (row) => row.studentSchoolId },
        { header: "Full Name", accessor: (row) => row.fullName },
        { header: "Gender", accessor: (row) => row.gender },
        { header: "Class", accessor: (row) => row.classDisplay || "-" },
        {
          header: "Academic Year",
          accessor: (row) => row.academicYear || "-",
        },
        { header: "Section", accessor: (row) => row.section || "-" },
      ],
      rows: studentsWithAssignment,
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
          initialValues={{ fullName: "", gender: "" }}
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
          students={studentsWithAssignment}
          loading={studentsQuery.loading || enrollmentsQuery.loading}
          error={studentsQuery.error || enrollmentsQuery.error}
        />
      </TableSection>
    </PageLayout>
  );
};

export default StudentsPage;
