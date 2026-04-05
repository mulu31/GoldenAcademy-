import { useForm } from "../../hooks/useForm";
import Select from "../common/Select";
import Button from "../common/Button";

const PromotionForm = ({ 
  classes = [], 
  terms = [], 
  onSubmit, 
  loading 
}) => {
  const form = useForm({
    initialValues: { 
      currentClassId: "", 
      nextClassId: "", 
      nextTermId: "" 
    },
    validate: (values) => {
      const errors = {};
      if (!values.currentClassId) {
        errors.currentClassId = "Current class is required";
      }
      if (!values.nextClassId) {
        errors.nextClassId = "Next class is required";
      }
      if (!values.nextTermId) {
        errors.nextTermId = "Next term is required";
      }
      if (values.currentClassId === values.nextClassId) {
        errors.nextClassId = "Next class must be different from current class";
      }
      return errors;
    },
    onSubmit,
  });

  return (
    <form onSubmit={form.handleSubmit} className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <Select
          label="Current Class"
          name="currentClassId"
          value={form.values.currentClassId}
          onChange={form.handleChange}
          options={classes.map((c) => ({
            value: c.class_id,
            label: `${c.class_name} (${c.grade})`,
          }))}
          error={form.errors.currentClassId}
          required
        />
        <Select
          label="Next Class"
          name="nextClassId"
          value={form.values.nextClassId}
          onChange={form.handleChange}
          options={classes.map((c) => ({
            value: c.class_id,
            label: `${c.class_name} (${c.grade})`,
          }))}
          error={form.errors.nextClassId}
          required
        />
        <Select
          label="Next Term"
          name="nextTermId"
          value={form.values.nextTermId}
          onChange={form.handleChange}
          options={terms.map((t) => ({
            value: t.term_id,
            label: `${t.academic_year} - Semester ${t.semester}`,
          }))}
          error={form.errors.nextTermId}
          required
        />
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> This will promote all students from the current class 
          to the next class in the selected term. Academic history will be preserved.
        </p>
      </div>

      <Button type="submit" loading={loading}>
        Promote Students
      </Button>
    </form>
  );
};

export default PromotionForm;
