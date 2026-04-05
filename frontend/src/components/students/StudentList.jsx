import Table from "../common/Table";
import Loader from "../common/Loader";

const StudentList = ({
  students = [],
  classLookup = {},
  loading = false,
  error = "",
}) => {
  if (loading) return <Loader text="Loading students..." />;

  return (
    <Table
      rows={students}
      error={error}
      columns={[
        { key: "student_id", title: "ID" },
        { key: "student_school_id", title: "School ID" },
        { key: "full_name", title: "Name" },
        { key: "gender", title: "Gender" },
        {
          key: "class_id",
          title: "Class",
          render: (row) =>
            row.class_name || classLookup[row.class_id] || row.class_id || "-",
        },
      ]}
    />
  );
};

export default StudentList;
