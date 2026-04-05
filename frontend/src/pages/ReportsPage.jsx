import { useMemo, useState } from "react";
import reportApi from "../api/reportApi";
import { extractArray, extractErrorMessage } from "../api/responseAdapter";
import PageLayout from "../components/layout/PageLayout";
import Input from "../components/common/Input";
import Select from "../components/common/Select";
import Button from "../components/common/Button";
import TableSection from "../components/common/TableSection";
import StudentReport from "../components/reports/StudentReport";
import ClassReport from "../components/reports/ClassReport";
import StateView from "../components/common/StateView";
import { FileDown } from "lucide-react";
import { exportRowsToPdf } from "../utils/exportPdf";
import { notify } from "../utils/notifications";

const ReportsPage = () => {
  const [filters, setFilters] = useState({
    class_id: "",
    academic_year: "",
    semester: "",
  });
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const fetchReport = async () => {
    setLoading(true);
    setError("");
    try {
      const params = {
        ...(filters.class_id ? { class_id: Number(filters.class_id) } : {}),
        ...(filters.academic_year
          ? { academic_year: filters.academic_year }
          : {}),
        ...(filters.semester ? { semester: filters.semester } : {}),
      };

      const response = await reportApi.getAcademicReport(params);
      const reportRows = extractArray(response);
      setRows(reportRows);
      notify({ type: "success", message: "Report generated successfully." });
    } catch (err) {
      const message = extractErrorMessage(err, "Unable to generate report.");
      setError(message);
      notify({
        type: "error",
        message,
      });
    } finally {
      setLoading(false);
    }
  };

  const summaryRows = useMemo(() => rows, [rows]);

  const handleExportReport = async () => {
    if (!rows.length) {
      notify({
        type: "warning",
        message: "No report data is available for export.",
      });
      return;
    }

    await exportRowsToPdf({
      fileName: "golden-high-school-academic-report.pdf",
      title: "Golden High School - Academic Report",
      subtitle: `Total records: ${rows.length}`,
      columns: [
        { header: "Student ID", accessor: (row) => row.student_school_id },
        { header: "Student Name", accessor: (row) => row.full_name },
        { header: "Class", accessor: (row) => row.class_name },
        { header: "Academic Year", accessor: (row) => row.academic_year },
        { header: "Semester", accessor: (row) => row.semester },
        {
          header: "Average",
          accessor: (row) => row.average_score ?? row.percentage,
        },
        { header: "Rank", accessor: (row) => row.rank },
        { header: "Status", accessor: (row) => row.status },
      ],
      rows,
    });

    notify({
      type: "success",
      message: "Report data has been exported successfully.",
    });
  };

  return (
    <PageLayout title="Reports">
      <div className="card">
        <h3 className="mb-3 text-sm font-semibold">Filter Report</h3>
        <div className="grid gap-3 md:grid-cols-4">
          <Input
            label="Class ID"
            name="class_id"
            type="number"
            value={filters.class_id}
            onChange={handleChange}
          />
          <Input
            label="Academic Year"
            name="academic_year"
            value={filters.academic_year}
            onChange={handleChange}
          />
          <Select
            label="Semester"
            name="semester"
            value={filters.semester}
            onChange={handleChange}
            options={[
              { value: "I", label: "I" },
              { value: "II", label: "II" },
            ]}
          />
          <div className="flex items-end">
            <Button
              onClick={fetchReport}
              loading={loading}
              loadingText="Generating Report..."
            >
              Load Report
            </Button>
          </div>
        </div>
      </div>

      {loading ? <StateView type="loading" title="Generating Report" /> : null}
      {!loading && error ? (
        <StateView type="error" description={error} />
      ) : null}
      {!loading && !error && rows.length === 0 ? (
        <StateView
          type="empty"
          title="No Report Data Available"
          description="Adjust the filters and load the report again."
        />
      ) : null}

      {!loading && !error && rows.length > 0 ? (
        <ClassReport rows={summaryRows} />
      ) : null}

      <TableSection
        title="Student Report"
        actions={
          <Button variant="secondary" onClick={handleExportReport}>
            <span className="inline-flex items-center gap-2">
              <FileDown className="h-4 w-4" />
              Export PDF
            </span>
          </Button>
        }
      >
        <StudentReport rows={rows} loading={loading} error={error} />
      </TableSection>
    </PageLayout>
  );
};

export default ReportsPage;
