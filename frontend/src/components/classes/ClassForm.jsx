import { useForm } from "../../hooks/useForm";
import { validateForm } from "../../utils/validateForm";
import Input from "../common/Input";
import Select from "../common/Select";
import Button from "../common/Button";

const ClassForm = ({ terms = [], teachers = [], onSubmit, loading }) => {
  const form = useForm({
    initialValues: {
      class_name: "",
      grade: "",
      term_id: "",
      homeroom_teacher_id: "",
    },
    validate: (values) => validateForm("class", values),
    onSubmit,
  });

  return (
    <form onSubmit={form.handleSubmit} className="grid gap-3 md:grid-cols-5">
      <Input
        label="Class Name"
        name="class_name"
        value={form.values.class_name}
        onChange={form.handleChange}
        error={form.errors.class_name}
      />
      <Input
        label="Grade"
        name="grade"
        value={form.values.grade}
        onChange={form.handleChange}
        error={form.errors.grade}
      />
      <Select
        label="Term"
        name="term_id"
        value={form.values.term_id}
        onChange={form.handleChange}
        options={terms.map((t) => ({
          value: t.term_id,
          label: `${t.academic_year} ${t.semester}`,
        }))}
        error={form.errors.term_id}
      />
      <Select
        label="Homeroom Teacher"
        name="homeroom_teacher_id"
        value={form.values.homeroom_teacher_id}
        onChange={form.handleChange}
        options={teachers.map((t) => ({
          value: t.teacher_id,
          label: t.full_name,
        }))}
        error={form.errors.homeroom_teacher_id}
      />
      <div className="flex items-end">
        <Button type="submit" loading={loading}>
          Save Class
        </Button>
      </div>
    </form>
  );
};

export default ClassForm;
