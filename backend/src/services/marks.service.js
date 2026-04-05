import pool from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { handleDatabaseError } from "../utils/dbErrorHandler.js";

export const marksService = {
  /**
   * List all marks with optional filtering
   */
  list: async (filters = {}) => {
    const conditions = [];
    const params = [];
    let paramCount = 1;

    if (filters.enrollmentId) {
      conditions.push(`m.enrollment_id = $${paramCount++}`);
      params.push(parseInt(filters.enrollmentId));
    }
    if (filters.subjectId) {
      conditions.push(`m.subject_id = $${paramCount++}`);
      params.push(parseInt(filters.subjectId));
    }
    if (filters.teacherId) {
      conditions.push(`m.teacher_id = $${paramCount++}`);
      params.push(parseInt(filters.teacherId));
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const result = await pool.query(
      `
      SELECT 
        m.mark_id, m.enrollment_id, m.subject_id, m.teacher_id, m.mark_obtained, m.submitted_at,
        json_build_object(
          'enrollmentId', e.enrollment_id,
          'studentId', e.student_id,
          'classId', e.class_id,
          'student', json_build_object(
            'studentId', st.student_id,
            'studentSchoolId', st.student_school_id,
            'fullName', st.full_name,
            'gender', st.gender
          ),
          'class', json_build_object(
            'classId', c.class_id,
            'className', c.class_name,
            'grade', c.grade
          )
        ) as enrollment,
        json_build_object(
          'subjectId', s.subject_id,
          'name', s.name,
          'code', s.code,
          'totalMark', s.total_mark
        ) as subject,
        json_build_object(
          'teacherId', t.teacher_id,
          'fullName', t.full_name
        ) as teacher
      FROM marks m
      JOIN student_enrollments e ON m.enrollment_id = e.enrollment_id
      JOIN students st ON e.student_id = st.student_id
      JOIN classes c ON e.class_id = c.class_id
      JOIN subjects s ON m.subject_id = s.subject_id
      LEFT JOIN teachers t ON m.teacher_id = t.teacher_id
      ${whereClause}
      ORDER BY m.submitted_at DESC
    `,
      params,
    );

    return result.rows.map((row) => ({
      markId: row.mark_id,
      enrollmentId: row.enrollment_id,
      subjectId: row.subject_id,
      teacherId: row.teacher_id,
      markObtained: row.mark_obtained,
      submittedAt: row.submitted_at,
      enrollment: row.enrollment,
      subject: row.subject,
      teacher: row.teacher,
    }));
  },

  /**
   * Get mark by ID
   */
  getById: async (markId) => {
    const result = await pool.query(
      `
      SELECT 
        m.mark_id, m.enrollment_id, m.subject_id, m.teacher_id, m.mark_obtained, m.submitted_at,
        json_build_object(
          'enrollmentId', e.enrollment_id,
          'studentId', e.student_id,
          'classId', e.class_id,
          'student', json_build_object(
            'studentId', st.student_id,
            'studentSchoolId', st.student_school_id,
            'fullName', st.full_name,
            'gender', st.gender
          ),
          'class', json_build_object(
            'classId', c.class_id,
            'className', c.class_name,
            'grade', c.grade
          )
        ) as enrollment,
        json_build_object(
          'subjectId', s.subject_id,
          'name', s.name,
          'code', s.code,
          'totalMark', s.total_mark
        ) as subject,
        json_build_object(
          'teacherId', t.teacher_id,
          'fullName', t.full_name
        ) as teacher
      FROM marks m
      JOIN student_enrollments e ON m.enrollment_id = e.enrollment_id
      JOIN students st ON e.student_id = st.student_id
      JOIN classes c ON e.class_id = c.class_id
      JOIN subjects s ON m.subject_id = s.subject_id
      LEFT JOIN teachers t ON m.teacher_id = t.teacher_id
      WHERE m.mark_id = $1
    `,
      [parseInt(markId)],
    );

    if (result.rows.length === 0) {
      throw new ApiError(404, "Mark not found");
    }

    const row = result.rows[0];
    return {
      markId: row.mark_id,
      enrollmentId: row.enrollment_id,
      subjectId: row.subject_id,
      teacherId: row.teacher_id,
      markObtained: row.mark_obtained,
      submittedAt: row.submitted_at,
      enrollment: row.enrollment,
      subject: row.subject,
      teacher: row.teacher,
    };
  },

  /**
   * Get marks by class ID
   */
  getByClassId: async (classId) => {
    const result = await pool.query(
      `
      SELECT 
        m.mark_id, m.enrollment_id, m.subject_id, m.teacher_id, m.mark_obtained, m.submitted_at,
        json_build_object(
          'enrollmentId', e.enrollment_id,
          'student', json_build_object(
            'studentId', st.student_id,
            'studentSchoolId', st.student_school_id,
            'fullName', st.full_name,
            'gender', st.gender
          )
        ) as enrollment,
        json_build_object(
          'subjectId', s.subject_id,
          'name', s.name,
          'code', s.code,
          'totalMark', s.total_mark
        ) as subject,
        json_build_object(
          'teacherId', t.teacher_id,
          'fullName', t.full_name
        ) as teacher
      FROM marks m
      JOIN student_enrollments e ON m.enrollment_id = e.enrollment_id
      JOIN students st ON e.student_id = st.student_id
      JOIN subjects s ON m.subject_id = s.subject_id
      LEFT JOIN teachers t ON m.teacher_id = t.teacher_id
      WHERE e.class_id = $1
      ORDER BY st.full_name ASC, s.name ASC
    `,
      [parseInt(classId)],
    );

    return result.rows.map((row) => ({
      markId: row.mark_id,
      enrollmentId: row.enrollment_id,
      subjectId: row.subject_id,
      teacherId: row.teacher_id,
      markObtained: row.mark_obtained,
      submittedAt: row.submitted_at,
      enrollment: row.enrollment,
      subject: row.subject,
      teacher: row.teacher,
    }));
  },

  /**
   * Get marks by student ID
   */
  getByStudentId: async (studentId, termId = null) => {
    const params = [parseInt(studentId)];
    let termCondition = "";

    if (termId) {
      termCondition = "AND c.term_id = $2";
      params.push(parseInt(termId));
    }

    const result = await pool.query(
      `
      SELECT 
        m.mark_id, m.enrollment_id, m.subject_id, m.teacher_id, m.mark_obtained, m.submitted_at,
        json_build_object(
          'enrollmentId', e.enrollment_id,
          'class', json_build_object(
            'classId', c.class_id,
            'className', c.class_name,
            'grade', c.grade,
            'term', json_build_object(
              'termId', tm.term_id,
              'academicYear', tm.academic_year,
              'semester', tm.semester
            )
          )
        ) as enrollment,
        json_build_object(
          'subjectId', s.subject_id,
          'name', s.name,
          'code', s.code,
          'totalMark', s.total_mark
        ) as subject,
        json_build_object(
          'teacherId', t.teacher_id,
          'fullName', t.full_name
        ) as teacher
      FROM marks m
      JOIN student_enrollments e ON m.enrollment_id = e.enrollment_id
      JOIN classes c ON e.class_id = c.class_id
      JOIN terms tm ON c.term_id = tm.term_id
      JOIN subjects s ON m.subject_id = s.subject_id
      LEFT JOIN teachers t ON m.teacher_id = t.teacher_id
      WHERE e.student_id = $1 ${termCondition}
      ORDER BY tm.academic_year DESC, s.name ASC
    `,
      params,
    );

    return result.rows.map((row) => ({
      markId: row.mark_id,
      enrollmentId: row.enrollment_id,
      subjectId: row.subject_id,
      teacherId: row.teacher_id,
      markObtained: row.mark_obtained,
      submittedAt: row.submitted_at,
      enrollment: row.enrollment,
      subject: row.subject,
      teacher: row.teacher,
    }));
  },

  /**
   * Get marks for a teacher's assigned classes
   */
  getByTeacherId: async (teacherId) => {
    const result = await pool.query(
      `
      SELECT 
        m.mark_id, m.enrollment_id, m.subject_id, m.teacher_id, m.mark_obtained, m.submitted_at,
        json_build_object(
          'enrollmentId', e.enrollment_id,
          'student', json_build_object(
            'studentId', st.student_id,
            'studentSchoolId', st.student_school_id,
            'fullName', st.full_name,
            'gender', st.gender
          ),
          'class', json_build_object(
            'classId', c.class_id,
            'className', c.class_name,
            'grade', c.grade
          )
        ) as enrollment,
        json_build_object(
          'subjectId', s.subject_id,
          'name', s.name,
          'code', s.code,
          'totalMark', s.total_mark
        ) as subject,
        json_build_object(
          'teacherId', t.teacher_id,
          'fullName', t.full_name
        ) as teacher
      FROM marks m
      JOIN student_enrollments e ON m.enrollment_id = e.enrollment_id
      JOIN students st ON e.student_id = st.student_id
      JOIN classes c ON e.class_id = c.class_id
      JOIN subjects s ON m.subject_id = s.subject_id
      LEFT JOIN teachers t ON m.teacher_id = t.teacher_id
      WHERE EXISTS (
        SELECT 1 FROM teacher_class_subject tcs
        JOIN class_subjects cs ON tcs.class_subject_id = cs.class_subject_id
        WHERE tcs.teacher_id = $1
          AND cs.class_id = e.class_id
          AND cs.subject_id = m.subject_id
      )
      ORDER BY c.class_name ASC, s.name ASC, st.full_name ASC
    `,
      [parseInt(teacherId)],
    );

    return result.rows.map((row) => ({
      markId: row.mark_id,
      enrollmentId: row.enrollment_id,
      subjectId: row.subject_id,
      teacherId: row.teacher_id,
      markObtained: row.mark_obtained,
      submittedAt: row.submitted_at,
      enrollment: row.enrollment,
      subject: row.subject,
      teacher: row.teacher,
    }));
  },

  /**
   * Submit or update a mark with triple authorization check
   * Implements Requirements 7.1, 7.2, 7.3, 7.4
   */
  submitMark: async ({ teacherId, enrollmentId, subjectId, markObtained }) => {
    // 1. Validate enrollment exists and get class info
    const enrollmentResult = await pool.query(
      `
      SELECT e.enrollment_id, e.class_id, c.results_published
      FROM student_enrollments e
      JOIN classes c ON e.class_id = c.class_id
      WHERE e.enrollment_id = $1
    `,
      [parseInt(enrollmentId)],
    );

    if (enrollmentResult.rows.length === 0) {
      throw new ApiError(404, "Student enrollment not found");
    }

    const enrollment = enrollmentResult.rows[0];
    const classId = enrollment.class_id;

    // 2. Check if results are already published (Requirement 7.4)
    if (enrollment.results_published) {
      throw new ApiError(
        409,
        "Results already published. Marks cannot be modified.",
      );
    }

    // 3. Verify teacher is assigned to teach this subject in this class (Requirements 7.1, 7.2)
    const assignmentResult = await pool.query(
      `
      SELECT tcs.teacher_class_subject_id
      FROM teacher_class_subject tcs
      JOIN class_subjects cs ON tcs.class_subject_id = cs.class_subject_id
      WHERE tcs.teacher_id = $1
        AND cs.class_id = $2
        AND cs.subject_id = $3
    `,
      [parseInt(teacherId), classId, parseInt(subjectId)],
    );

    if (assignmentResult.rows.length === 0) {
      throw new ApiError(
        403,
        "Teacher not authorized to submit marks for this subject in this class",
      );
    }

    // 4. Validate mark range
    const subjectResult = await pool.query(
      "SELECT total_mark FROM subjects WHERE subject_id = $1",
      [parseInt(subjectId)],
    );

    if (subjectResult.rows.length === 0) {
      throw new ApiError(404, "Subject not found");
    }

    const totalMark = subjectResult.rows[0].total_mark;

    if (markObtained < 0 || markObtained > totalMark) {
      throw new ApiError(400, `Mark must be between 0 and ${totalMark}`);
    }

    // 5. Insert or update mark
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const existingMark = await client.query(
        "SELECT mark_id FROM marks WHERE enrollment_id = $1 AND subject_id = $2",
        [parseInt(enrollmentId), parseInt(subjectId)],
      );

      let markId;
      if (existingMark.rows.length > 0) {
        // Update existing mark
        await client.query(
          "UPDATE marks SET mark_obtained = $1, teacher_id = $2, submitted_at = CURRENT_TIMESTAMP WHERE enrollment_id = $3 AND subject_id = $4",
          [
            parseInt(markObtained),
            parseInt(teacherId),
            parseInt(enrollmentId),
            parseInt(subjectId),
          ],
        );
        markId = existingMark.rows[0].mark_id;
      } else {
        // Insert new mark
        const insertResult = await client.query(
          "INSERT INTO marks (enrollment_id, subject_id, teacher_id, mark_obtained) VALUES ($1, $2, $3, $4) RETURNING mark_id",
          [
            parseInt(enrollmentId),
            parseInt(subjectId),
            parseInt(teacherId),
            parseInt(markObtained),
          ],
        );
        markId = insertResult.rows[0].mark_id;
      }

      await client.query("COMMIT");

      // Fetch and return the complete mark
      return await marksService.getById(markId);
    } catch (error) {
      await client.query("ROLLBACK");
      handleDatabaseError(error);
    } finally {
      client.release();
    }
  },

  /**
   * Update mark by teacher (with authorization check)
   */
  updateMarkByTeacher: async ({ markId, teacherId, markObtained }) => {
    // Get mark with related data
    const markResult = await pool.query(
      `
      SELECT m.mark_id, m.teacher_id, c.results_published
      FROM marks m
      JOIN student_enrollments e ON m.enrollment_id = e.enrollment_id
      JOIN classes c ON e.class_id = c.class_id
      WHERE m.mark_id = $1
    `,
      [parseInt(markId)],
    );

    if (markResult.rows.length === 0) {
      throw new ApiError(404, "Mark not found");
    }

    const mark = markResult.rows[0];

    // Check if results are published
    if (mark.results_published) {
      throw new ApiError(409, "Results already published for class");
    }

    // Check if teacher owns this mark
    if (mark.teacher_id !== parseInt(teacherId)) {
      throw new ApiError(403, "Teacher cannot modify another teacher's mark");
    }

    // Update mark
    await pool.query(
      "UPDATE marks SET mark_obtained = $1, submitted_at = CURRENT_TIMESTAMP WHERE mark_id = $2",
      [parseInt(markObtained), parseInt(markId)],
    );

    return await marksService.getById(markId);
  },

  /**
   * Create mark (admin/registrar only)
   */
  create: async (data) => {
    const result = await pool.query(
      "INSERT INTO marks (enrollment_id, subject_id, teacher_id, mark_obtained) VALUES ($1, $2, $3, $4) RETURNING mark_id",
      [
        parseInt(data.enrollmentId),
        parseInt(data.subjectId),
        data.teacherId ? parseInt(data.teacherId) : null,
        parseInt(data.markObtained),
      ],
    );

    return await marksService.getById(result.rows[0].mark_id);
  },

  /**
   * Update mark (admin/registrar only)
   */
  update: async (markId, data) => {
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (data.markObtained !== undefined) {
      updates.push(`mark_obtained = $${paramCount++}`);
      values.push(parseInt(data.markObtained));
    }
    if (data.teacherId !== undefined) {
      updates.push(`teacher_id = $${paramCount++}`);
      values.push(parseInt(data.teacherId));
    }

    if (updates.length === 0) {
      throw new ApiError(400, "No fields to update");
    }

    values.push(parseInt(markId));

    await pool.query(
      `UPDATE marks SET ${updates.join(", ")} WHERE mark_id = $${paramCount}`,
      values,
    );

    return await marksService.getById(markId);
  },

  /**
   * Delete mark (admin only)
   */
  remove: async (markId) => {
    const result = await pool.query(
      'DELETE FROM marks WHERE mark_id = $1 RETURNING mark_id',
      [parseInt(markId)]
    );

    if (result.rows.length === 0) {
      throw new ApiError(404, 'Mark not found');
    }

    return { success: true };
  },
};
