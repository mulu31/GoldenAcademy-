import { useForm } from "../../hooks/useForm";
import { validateForm } from "../../utils/validateForm";
import Input from "../common/Input";
import Select from "../common/Select";
import Button from "../common/Button";

const MarksForm = ({
  enrollments = [],
  subjects = [],
  teachers = [],
  onSubmit,
  loading,
}) => {
  const form = useForm({
    initialValues: {
      teacher_id: "",
      enrollment_id: "",
      subject_id: "",
      mark_obtained: "",
    },
    validate: (values) => validateForm("mark", values),
    onSubmit,
  });

  return (
    <form onSubmit={form.handleSubmit} className="grid gap-3 md:grid-cols-5">
      <Select
        label="Teacher"
        name="teacher_id"
        value={form.values.teacher_id}
        onChange={form.handleChange}
        options={teachers.map((t) => ({
          value: t.teacher_id,
          label: t.full_name,
        }))}
        error={form.errors.teacher_id}
      />
      <Select
        label="Enrollment"
        name="enrollment_id"
        value={form.values.enrollment_id}
        onChange={form.handleChange}
        options={enrollments.map((e) => ({
          value: e.enrollment_id,
          label: `Enrollment #${e.enrollment_id}`,
        }))}
        error={form.errors.enrollment_id}
      />
      <Select
        label="Subject"
        name="subject_id"
        value={form.values.subject_id}
        onChange={form.handleChange}
        options={subjects.map((s) => ({ value: s.subject_id, label: s.name }))}
        error={form.errors.subject_id}
      />
      <Input
        label="Mark"
        name="mark_obtained"
        type="number"
        value={form.values.mark_obtained}
        onChange={form.handleChange}
        error={form.errors.mark_obtained}
      />
      <div className="flex items-end">
        <Button type="submit" loading={loading}>
          Submit Mark
        </Button>
      </div>
    </form>
  );
};

export default MarksForm;
