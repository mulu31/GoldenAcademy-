import { useForm } from "../../hooks/useForm";
import { validateForm } from "../../utils/validateForm";
import Select from "../common/Select";
import Button from "../common/Button";

const EnrollmentForm = ({ students = [], classes = [], onSubmit, loading }) => {
  const form = useForm({
    initialValues: { student_id: "", class_id: "" },
    validate: (values) => validateForm("enrollment", values),
    onSubmit,
  });

  return (
    <form
      onSubmit={form.handleSubmit}
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
    >
      <Select
        label="Student"
        name="student_id"
        value={form.values.student_id}
        onChange={form.handleChange}
        options={students.map((s) => ({
          value: s.student_id,
          label: s.full_name || s.student_school_id,
        }))}
        error={form.errors.student_id}
      />
      <Select
        label="Class"
        name="class_id"
        value={form.values.class_id}
        onChange={form.handleChange}
        options={classes.map((c) => ({
          value: c.class_id,
          label: `${c.class_name} (${c.grade})`,
        }))}
        error={form.errors.class_id}
      />
      <div className="flex items-end">
        <Button type="submit" loading={loading} className="w-full">
          Assign Student to Class
        </Button>
      </div>
    </form>
  );
};

export default EnrollmentForm;
