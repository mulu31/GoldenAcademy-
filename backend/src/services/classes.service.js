import pool from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { handleDatabaseError } from "../utils/dbErrorHandler.js";

export const classesService = {
  // Get all classes
  getAll: async () => {
    const result = await pool.query(`
      SELECT 
        c.class_id, c.class_name, c.grade, c.term_id, c.homeroom_teacher_id, 
        c.results_published, c.created_at, c.updated_at,
        json_build_object(
          'termId', t.term_id,
          'academicYear', t.academic_year,
          'semester', t.semester
        ) as term,
        CASE 
          WHEN c.homeroom_teacher_id IS NOT NULL THEN
            json_build_object(
              'teacherId', ht.teacher_id,
              'fullName', ht.full_name
            )
          ELSE NULL
        END as "homeroomTeacher"
      FROM classes c
      JOIN terms t ON c.term_id = t.term_id
      LEFT JOIN teachers ht ON c.homeroom_teacher_id = ht.teacher_id
      ORDER BY c.class_name ASC
    `);

    return result.rows.map((row) => ({
      classId: row.class_id,
      className: row.class_name,
      grade: row.grade,
      termId: row.term_id,
      homeroomTeacherId: row.homeroom_teacher_id,
      resultsPublished: row.results_published,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      term: row.term,
      homeroomTeacher: row.homeroomTeacher,
    }));
  },

  // Get class by ID
  getById: async (classId) => {
    const result = await pool.query(
      `
      SELECT 
        c.class_id, c.class_name, c.grade, c.term_id, c.homeroom_teacher_id, 
        c.results_published, c.created_at, c.updated_at,
        json_build_object(
          'termId', t.term_id,
          'academicYear', t.academic_year,
          'semester', t.semester
        ) as term,
        CASE 
          WHEN c.homeroom_teacher_id IS NOT NULL THEN
            json_build_object(
              'teacherId', ht.teacher_id,
              'fullName', ht.full_name
            )
          ELSE NULL
        END as "homeroomTeacher",
        COALESCE(
          json_agg(
            json_build_object(
              'classSubjectId', cs.class_subject_id,
              'subject', json_build_object(
                'subjectId', s.subject_id,
                'name', s.name,
                'code', s.code,
                'totalMark', s.total_mark
              )
            )
          ) FILTER (WHERE cs.class_subject_id IS NOT NULL),
          '[]'
        ) as "classSubjects"
      FROM classes c
      JOIN terms t ON c.term_id = t.term_id
      LEFT JOIN teachers ht ON c.homeroom_teacher_id = ht.teacher_id
      LEFT JOIN class_subjects cs ON c.class_id = cs.class_id
      LEFT JOIN subjects s ON cs.subject_id = s.subject_id
      WHERE c.class_id = $1
      GROUP BY c.class_id, c.class_name, c.grade, c.term_id, c.homeroom_teacher_id,
               c.results_published, c.created_at, c.updated_at,
               t.term_id, t.academic_year, t.semester,
               ht.teacher_id, ht.full_name
    `,
      [parseInt(classId)],
    );

    if (result.rows.length === 0) {
      throw new ApiError(404, "Class not found");
    }

    const row = result.rows[0];
    return {
      classId: row.class_id,
      className: row.class_name,
      grade: row.grade,
      termId: row.term_id,
      homeroomTeacherId: row.homeroom_teacher_id,
      resultsPublished: row.results_published,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      term: row.term,
      homeroomTeacher: row.homeroomTeacher,
      classSubjects: row.classSubjects,
    };
  },

  // Get subject mappings for a class
  getSubjects: async (classId) => {
    const parsedClassId = parseInt(classId, 10);

    const classResult = await pool.query(
      "SELECT class_id FROM classes WHERE class_id = $1",
      [parsedClassId],
    );

    if (classResult.rows.length === 0) {
      throw new ApiError(404, "Class not found");
    }

    const result = await pool.query(
      `
      SELECT
        cs.class_subject_id,
        cs.class_id,
        cs.subject_id,
        s.name AS subject_name,
        s.code AS subject_code,
        s.total_mark,
        s.department_id
      FROM class_subjects cs
      JOIN subjects s ON cs.subject_id = s.subject_id
      WHERE cs.class_id = $1
      ORDER BY s.name ASC
    `,
      [parsedClassId],
    );

    return result.rows.map((row) => ({
      classSubjectId: row.class_subject_id,
      classId: row.class_id,
      subjectId: row.subject_id,
      subject: {
        subjectId: row.subject_id,
        name: row.subject_name,
        code: row.subject_code,
        totalMark: row.total_mark,
        departmentId: row.department_id,
      },
    }));
  },

  // Map a subject to a class
  addSubject: async (classId, subjectId, requestingUser) => {
    const parsedClassId = parseInt(classId, 10);
    const parsedSubjectId = parseInt(subjectId, 10);

    const classResult = await pool.query(
      "SELECT class_id FROM classes WHERE class_id = $1",
      [parsedClassId],
    );
    if (classResult.rows.length === 0) {
      throw new ApiError(404, "Class not found");
    }

    const subjectResult = await pool.query(
      `
      SELECT subject_id, name, code, total_mark, department_id
      FROM subjects
      WHERE subject_id = $1
    `,
      [parsedSubjectId],
    );
    if (subjectResult.rows.length === 0) {
      throw new ApiError(404, "Subject not found");
    }

    const subject = subjectResult.rows[0];

    if (requestingUser?.roles?.includes("DEPARTMENT_ADMIN")) {
      if (!requestingUser.departmentId) {
        throw new ApiError(
          403,
          "Department admin must be associated with a department",
        );
      }

      if (
        parseInt(subject.department_id, 10) !==
        parseInt(requestingUser.departmentId, 10)
      ) {
        throw new ApiError(
          403,
          "Cannot assign subject from another department",
        );
      }
    }

    const insertResult = await pool.query(
      `
      INSERT INTO class_subjects (class_id, subject_id)
      VALUES ($1, $2)
      ON CONFLICT (class_id, subject_id)
      DO UPDATE SET class_id = EXCLUDED.class_id
      RETURNING class_subject_id
    `,
      [parsedClassId, parsedSubjectId],
    );

    return {
      classSubjectId: insertResult.rows[0].class_subject_id,
      classId: parsedClassId,
      subjectId: parsedSubjectId,
      subject: {
        subjectId: subject.subject_id,
        name: subject.name,
        code: subject.code,
        totalMark: subject.total_mark,
        departmentId: subject.department_id,
      },
    };
  },

  // Remove a subject mapping from a class
  removeSubject: async (classId, subjectId) => {
    const result = await pool.query(
      `
      DELETE FROM class_subjects
      WHERE class_id = $1 AND subject_id = $2
      RETURNING class_subject_id
    `,
      [parseInt(classId, 10), parseInt(subjectId, 10)],
    );

    if (result.rows.length === 0) {
      throw new ApiError(404, "Class-subject mapping not found");
    }

    return { success: true };
  },

  // Create new class
  create: async (data) => {
    const result = await pool.query(
      `
      INSERT INTO classes (class_name, grade, term_id, homeroom_teacher_id, results_published)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING class_id
    `,
      [
        data.class_name,
        data.grade,
        parseInt(data.term_id),
        data.homeroom_teacher_id ? parseInt(data.homeroom_teacher_id) : null,
        data.results_published || false,
      ],
    );

    return await classesService.getById(result.rows[0].class_id);
  },

  // Update class
  update: async (classId, data) => {
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (data.class_name !== undefined) {
      updates.push(`class_name = $${paramCount++}`);
      values.push(data.class_name);
    }
    if (data.grade !== undefined) {
      updates.push(`grade = $${paramCount++}`);
      values.push(data.grade);
    }
    if (data.term_id !== undefined) {
      updates.push(`term_id = $${paramCount++}`);
      values.push(parseInt(data.term_id));
    }
    if (data.homeroom_teacher_id !== undefined) {
      updates.push(`homeroom_teacher_id = $${paramCount++}`);
      values.push(
        data.homeroom_teacher_id ? parseInt(data.homeroom_teacher_id) : null,
      );
    }
    if (data.results_published !== undefined) {
      updates.push(`results_published = $${paramCount++}`);
      values.push(data.results_published);
    }

    if (updates.length === 0) {
      throw new ApiError(400, "No fields to update");
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(parseInt(classId));

    const result = await pool.query(
      `UPDATE classes SET ${updates.join(", ")} WHERE class_id = $${paramCount} RETURNING class_id`,
      values,
    );

    if (result.rows.length === 0) {
      throw new ApiError(404, "Class not found");
    }

    return await classesService.getById(classId);
  },

  // Delete class
  delete: async (classId) => {
    const result = await pool.query(
      "DELETE FROM classes WHERE class_id = $1 RETURNING class_id",
      [parseInt(classId)],
    );

    if (result.rows.length === 0) {
      throw new ApiError(404, "Class not found");
    }

    return { success: true };
  },

  // Publish results with mark completion check
  publishResults: async (classId) => {
    // Get class data with counts
    const classResult = await pool.query(
      `
      SELECT 
        c.class_id, c.results_published,
        COUNT(DISTINCT cs.subject_id) as total_subjects,
        COUNT(DISTINCT se.enrollment_id) as total_students
      FROM classes c
      LEFT JOIN class_subjects cs ON c.class_id = cs.class_id
      LEFT JOIN student_enrollments se ON c.class_id = se.class_id
      WHERE c.class_id = $1
      GROUP BY c.class_id, c.results_published
    `,
      [parseInt(classId)],
    );

    if (classResult.rows.length === 0) {
      throw new ApiError(404, "Class not found");
    }

    const classData = classResult.rows[0];

    // Check if results are already published
    if (classData.results_published) {
      throw new ApiError(400, "Results are already published for this class");
    }

    // Count actual marks submitted
    const marksResult = await pool.query(
      `
      SELECT COUNT(*) as actual_marks
      FROM marks m
      JOIN student_enrollments se ON m.enrollment_id = se.enrollment_id
      WHERE se.class_id = $1
    `,
      [parseInt(classId)],
    );

    const totalSubjects = parseInt(classData.total_subjects);
    const totalStudents = parseInt(classData.total_students);
    const expectedMarks = totalSubjects * totalStudents;
    const actualMarks = parseInt(marksResult.rows[0].actual_marks);

    if (actualMarks < expectedMarks) {
      throw new ApiError(
        400,
        "Cannot publish results: Not all marks have been submitted",
      );
    }

    // Publish results
    await pool.query(
      "UPDATE classes SET results_published = TRUE, updated_at = CURRENT_TIMESTAMP WHERE class_id = $1",
      [parseInt(classId)],
    );

    return await classesService.getById(classId);
  },

  // Check if all marks are complete for a class
  checkMarksComplete: async (classId) => {
    // Get class data with counts
    const classResult = await pool.query(
      `
      SELECT 
        c.class_id,
        COUNT(DISTINCT cs.subject_id) as total_subjects,
        COUNT(DISTINCT se.enrollment_id) as total_students
      FROM classes c
      LEFT JOIN class_subjects cs ON c.class_id = cs.class_id
      LEFT JOIN student_enrollments se ON c.class_id = se.class_id
      WHERE c.class_id = $1
      GROUP BY c.class_id
    `,
      [parseInt(classId)],
    );

    if (classResult.rows.length === 0) {
      throw new ApiError(404, "Class not found");
    }

    const classData = classResult.rows[0];

    // Count actual marks submitted
    const marksResult = await pool.query(
      `
      SELECT COUNT(*) as actual_marks
      FROM marks m
      JOIN student_enrollments se ON m.enrollment_id = se.enrollment_id
      WHERE se.class_id = $1
    `,
      [parseInt(classId)],
    );

    const totalSubjects = parseInt(classData.total_subjects);
    const totalStudents = parseInt(classData.total_students);
    const expectedMarks = totalSubjects * totalStudents;
    const actualMarks = parseInt(marksResult.rows[0].actual_marks);

    return {
      complete: actualMarks === expectedMarks,
      expectedMarks,
      actualMarks,
      totalSubjects,
      totalStudents,
    };
  },
};
