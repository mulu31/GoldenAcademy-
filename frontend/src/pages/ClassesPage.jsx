import { useMemo, useState } from "react";
import classApi from "../api/classApi";
import termApi from "../api/termApi";
import teacherApi from "../api/teacherApi";
import PageLayout from "../components/layout/PageLayout";
import ClassForm from "../components/classes/ClassForm";
import ClassList from "../components/classes/ClassList";
import ClassSubjects from "../components/classes/ClassSubjects";
import Select from "../components/common/Select";
import Button from "../components/common/Button";
import TableSection from "../components/common/TableSection";
import { useFetch } from "../hooks/useFetch";
import { notify } from "../utils/notifications";

const ClassesPage = () => {
  const [saving, setSaving] = useState(false);
  const [publishFilters, setPublishFilters] = useState({
    academicYear: "",
    semester: "",
    classId: "",
  });

  const classQuery = useFetch(() => classApi.getAll(), []);
  const termQuery = useFetch(() => termApi.getAll(), []);
  const teacherQuery = useFetch(() => teacherApi.getAll(), []);

  const termLookup = useMemo(
    () =>
      Object.fromEntries(
        (termQuery.data || []).map((term) => [
          term.term_id,
          `${term.academic_year} / ${term.semester}`,
        ]),
      ),
    [termQuery.data],
  );

  const teacherLookup = useMemo(
    () =>
      Object.fromEntries(
        (teacherQuery.data || []).map((teacher) => [
          teacher.teacher_id,
          teacher.full_name,
        ]),
      ),
    [teacherQuery.data],
  );

  const publishAcademicYearOptions = useMemo(() => {
    const years = Array.from(
      new Set(
        (classQuery.data || [])
          .map(
            (row) => row.term?.academic_year || row.term?.academicYear || null,
          )
          .filter(Boolean),
      ),
    ).sort((a, b) => String(b).localeCompare(String(a)));

    return years.map((year) => ({ value: year, label: year }));
  }, [classQuery.data]);

  const publishSemesterOptions = useMemo(() => {
    const semesters = Array.from(
      new Set(
        (classQuery.data || [])
          .filter((row) => {
            const year = row.term?.academic_year || row.term?.academicYear;
            return String(year) === String(publishFilters.academicYear);
          })
          .map((row) => row.term?.semester)
          .filter(Boolean),
      ),
    ).sort();

    return semesters.map((semester) => ({
      value: semester,
      label: `Term ${semester}`,
    }));
  }, [classQuery.data, publishFilters.academicYear]);

  const publishClassOptions = useMemo(
    () =>
      (classQuery.data || [])
        .filter((row) => {
          const year = row.term?.academic_year || row.term?.academicYear;
          const semester = row.term?.semester;
          return (
            String(year) === String(publishFilters.academicYear) &&
            String(semester) === String(publishFilters.semester)
          );
        })
        .map((row) => ({
          value: row.class_id,
          label: `${row.grade || "Grade"} - ${row.class_name || "Class"}`,
        })),
    [classQuery.data, publishFilters.academicYear, publishFilters.semester],
  );

  const handleCreateClass = async (values) => {
    setSaving(true);
    try {
      await classApi.create({
        ...values,
        term_id: Number(values.term_id),
        homeroom_teacher_id: values.homeroom_teacher_id
          ? Number(values.homeroom_teacher_id)
          : null,
      });
      notify({ type: "success", message: "Class created" });
      await classQuery.refetch();
    } catch (error) {
      notify({
        type: "error",
        message: error?.response?.data?.message || "Failed to create class",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!publishFilters.classId) {
      notify({ type: "warning", message: "Please select class to publish." });
      return;
    }

    setSaving(true);
    try {
      await classApi.publishResults(publishFilters.classId);
      notify({ type: "success", message: "Class results published" });
      await classQuery.refetch();
      setPublishFilters({ academicYear: "", semester: "", classId: "" });
    } catch (error) {
      notify({
        type: "error",
        message: error?.response?.data?.message || "Publish failed",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageLayout title="Classes">
      <div className="card">
        <h3 className="mb-3 text-sm font-semibold">Create Class</h3>
        <ClassForm
          terms={termQuery.data}
          teachers={teacherQuery.data}
          onSubmit={handleCreateClass}
          loading={saving}
        />
      </div>

      <div className="card">
        <h3 className="mb-3 text-sm font-semibold">Publish Class Results</h3>
        <div className="grid gap-3 md:grid-cols-4">
          <Select
            label="Academic Year"
            name="publishAcademicYear"
            value={publishFilters.academicYear}
            onChange={(event) =>
              setPublishFilters({
                academicYear: event.target.value,
                semester: "",
                classId: "",
              })
            }
            options={publishAcademicYearOptions}
          />
          <Select
            label="Term"
            name="publishSemester"
            value={publishFilters.semester}
            onChange={(event) =>
              setPublishFilters((prev) => ({
                ...prev,
                semester: event.target.value,
                classId: "",
              }))
            }
            options={publishSemesterOptions}
            disabled={!publishFilters.academicYear}
          />
          <Select
            label="Class"
            name="publishClass"
            value={publishFilters.classId}
            onChange={(event) =>
              setPublishFilters((prev) => ({
                ...prev,
                classId: event.target.value,
              }))
            }
            options={publishClassOptions}
            disabled={!publishFilters.academicYear || !publishFilters.semester}
          />
          <div className="flex items-end">
            <Button
              onClick={handlePublish}
              loading={saving}
              disabled={!publishFilters.classId}
              className="w-full"
            >
              Publish
            </Button>
          </div>
        </div>
      </div>

      <ClassSubjects />

      <TableSection title="Class List">
        <ClassList
          classes={classQuery.data}
          termLookup={termLookup}
          teacherLookup={teacherLookup}
          loading={classQuery.loading}
          error={classQuery.error}
        />
      </TableSection>
    </PageLayout>
  );
};

export default ClassesPage;
