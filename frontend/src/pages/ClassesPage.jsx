import { useMemo, useState } from "react";
import classApi from "../api/classApi";
import termApi from "../api/termApi";
import teacherApi from "../api/teacherApi";
import PageLayout from "../components/layout/PageLayout";
import ClassForm from "../components/classes/ClassForm";
import ClassList from "../components/classes/ClassList";
import ClassSubjects from "../components/classes/ClassSubjects";
import Input from "../components/common/Input";
import Button from "../components/common/Button";
import TableSection from "../components/common/TableSection";
import { useFetch } from "../hooks/useFetch";
import { notify } from "../utils/notifications";

const ClassesPage = () => {
  const [saving, setSaving] = useState(false);
  const [publishClassId, setPublishClassId] = useState("");

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

  const handleCreateClass = async (values) => {
    setSaving(true);
    try {
      await classApi.create({
        ...values,
        term_id: Number(values.term_id),
        homeroom_teacher_id: Number(values.homeroom_teacher_id),
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
    if (!publishClassId) return;
    setSaving(true);
    try {
      await classApi.publishResults(publishClassId);
      notify({ type: "success", message: "Class results published" });
      await classQuery.refetch();
      setPublishClassId("");
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
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-60">
            <Input
              label="Class ID"
              name="publishClassId"
              type="number"
              value={publishClassId}
              onChange={(e) => setPublishClassId(e.target.value)}
            />
          </div>
          <Button onClick={handlePublish} loading={saving}>
            Publish
          </Button>
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
