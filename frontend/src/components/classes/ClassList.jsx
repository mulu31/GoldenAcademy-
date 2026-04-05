import Table from "../common/Table";

const ClassList = ({
  classes = [],
  termLookup = {},
  teacherLookup = {},
  loading = false,
  error = "",
}) => {
  return (
    <Table
      rows={classes}
      loading={loading}
      error={error}
      columns={[
        { key: "class_id", title: "ID" },
        { key: "class_name", title: "Class" },
        { key: "grade", title: "Grade" },
        {
          key: "term_id",
          title: "Term",
          render: (row) => termLookup[row.term_id] || row.term_id || "-",
        },
        {
          key: "homeroom_teacher_id",
          title: "Homeroom Teacher",
          render: (row) =>
            teacherLookup[row.homeroom_teacher_id] ||
            row.homeroom_teacher_id ||
            "-",
        },
        {
          key: "results_published",
          title: "Published",
          render: (row) => (row.results_published ? "Yes" : "No"),
        },
      ]}
    />
  );
};

export default ClassList;
