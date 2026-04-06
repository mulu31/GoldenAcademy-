import Table from "../common/Table";
import Loader from "../common/Loader";

const StudentList = ({ students = [], loading = false, error = "" }) => {
  if (loading) return <Loader text="Loading students..." />;

  return (
    <Table
      rows={students}
      error={error}
      columns={[
        {
          key: "studentId",
          title: "ID",
          render: (row) => row.studentId || row.student_id || "-",
        },
        {
          key: "studentSchoolId",
          title: "School ID",
          render: (row) => row.studentSchoolId || row.student_school_id || "-",
        },
        {
          key: "fullName",
          title: "Name",
          render: (row) => row.fullName || row.full_name || "-",
        },
        { key: "gender", title: "Gender" },
        {
          key: "classDisplay",
          title: "Class",
          render: (row) => row.classDisplay || row.class_display || "-",
        },
        {
          key: "academicYear",
          title: "Academic Year",
          render: (row) => row.academicYear || row.academic_year || "-",
        },
        {
          key: "section",
          title: "Section",
          render: (row) => row.section || "-",
        },
      ]}
    />
  );
};

export default StudentList;
