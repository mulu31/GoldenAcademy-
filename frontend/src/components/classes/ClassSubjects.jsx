import { notify } from "../../utils/notifications";

const ClassSubjects = () => {
  const handleInfo = () => {
    notify({
      type: "warning",
      message:
        "Class-subject assignment endpoint is not yet exposed in current backend routes.",
    });
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">
            Class Subjects Mapping
          </h3>
          <p className="text-xs text-slate-500">
            Use this section when class_subjects routes are enabled.
          </p>
        </div>
        <button
          type="button"
          onClick={handleInfo}
          className="rounded-md bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700"
        >
          Show Integration Note
        </button>
      </div>
    </div>
  );
};

export default ClassSubjects;
