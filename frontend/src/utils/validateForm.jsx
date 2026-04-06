const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateForm = (formType, values) => {
  const errors = {};

  const required = (field, label = field) => {
    if (!values[field] || String(values[field]).trim() === "") {
      errors[field] = `${label} is required`;
    }
  };

  if (["login", "register", "user"].includes(formType)) {
    required("email", "Email");
    if (values.email && !emailRegex.test(values.email)) {
      errors.email = "Enter a valid email";
    }
  }

  if (["login", "register"].includes(formType)) {
    required("password", "Password");
    if (values.password && values.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }
  }

  if (formType === "register") {
    required("roleName", "Role");
  }

  if (formType === "department") {
    required("name", "Department name");
    required("code", "Department code");
  }

  if (formType === "teacher") {
    required("full_name", "Teacher name");
    required("email", "Email");
    if (values.email && !emailRegex.test(values.email)) {
      errors.email = "Enter a valid email";
    }
    required("password", "Password");
    if (values.password && values.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }
    required("role_name", "Role");
  }

  if (formType === "subject") {
    required("name", "Subject name");
    required("code", "Subject code");
  }

  if (formType === "term") {
    required("academic_year", "Academic year");
    required("semester", "Semester");
  }

  if (formType === "class") {
    required("class_name", "Class name");
    required("grade", "Grade");
    required("term_id", "Term");
    required("homeroom_teacher_id", "Homeroom teacher");
  }

  if (formType === "student") {
    const studentIdKey = Object.prototype.hasOwnProperty.call(
      values,
      "studentSchoolId",
    )
      ? "studentSchoolId"
      : "student_school_id";
    const studentNameKey = Object.prototype.hasOwnProperty.call(
      values,
      "fullName",
    )
      ? "fullName"
      : "full_name";

    required(studentIdKey, "Student ID");
    required(studentNameKey, "Student name");
    required("gender", "Gender");
  }

  if (formType === "enrollment") {
    const studentKey = Object.prototype.hasOwnProperty.call(values, "studentId")
      ? "studentId"
      : "student_id";
    const classKey = Object.prototype.hasOwnProperty.call(values, "classId")
      ? "classId"
      : "class_id";

    required(studentKey, "Student");
    required(classKey, "Class");
  }

  if (formType === "promotion") {
    required("input_current_class", "Current class");
    required("input_next_class", "Next class");
    required("input_next_term", "Next term");
  }

  if (formType === "mark") {
    required("student_id", "Student");
    required("teacher_id", "Teacher");
    required("enrollment_id", "Enrollment");
    required("subject_id", "Subject");
    required("mark_obtained", "Mark");

    const mark = Number(values.mark_obtained);
    if (Number.isNaN(mark) || mark < 0 || mark > 100) {
      errors.mark_obtained = "Mark must be between 0 and 100";
    }
  }

  return errors;
};
