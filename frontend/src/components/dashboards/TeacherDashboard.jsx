import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import marksApi from "../../api/marksApi";
import reportApi from "../../api/reportApi";
import teacherApi from "../../api/teacherApi";
import classApi from "../../api/classApi";
import Table from "../common/Table";
import TableSection from "../common/TableSection";
import StateView from "../common/StateView";
import Modal from "../common/Modal";
import Input from "../common/Input";
import Select from "../common/Select";
import Button from "../common/Button";
import { useAuth } from "../../hooks/useAuth";
import { useFetch } from "../../hooks/useFetch";
import { formatDate } from "../../utils/formatDate";
import { notify } from "../../utils/notifications";

const toNumber = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [showMarkEntry, setShowMarkEntry] = useState(false);
  const [markFormData, setMarkFormData] = useState({
    enrollmentId: "",
    markObtained: "",
  });
  const [submittingMark, setSubmittingMark] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [classRoster, setClassRoster] = useState([]);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState(''); // 'saving', 'saved', 'error'
  const autoSaveTimeoutRef = useRef(null);
  const [showHomeroomSection, setShowHomeroomSection] = useState(false);

  const teachersQuery = useFetch(() => teacherApi.getAll(), []);
  const reportsQuery = useFetch(() => reportApi.getAcademicReport(), []);

  const currentTeacher = useMemo(
    () =>
      (teachersQuery.data || []).find(
        (teacher) => Number(teacher.user_id) === Number(user?.user_id),
      ),
    [teachersQuery.data, user?.user_id],
  );

  // Fetch homeroom class when teacher is identified
  const homeroomClassQuery = useFetch(
    () => currentTeacher ? teacherApi.getHomeroomClass(currentTeacher.teacher_id) : Promise.resolve(null),
    [currentTeacher?.teacher_id]
  );

  const homeroomClass = homeroomClassQuery.data;
  const isHomeroomTeacher = !!homeroomClass;

  // Fetch class report for homeroom class
  const homeroomReportQuery = useFetch(
    () => homeroomClass ? reportApi.getClassReport(homeroomClass.classId) : Promise.resolve(null),
    [homeroomClass?.classId]
  );

  // Fetch mark completion status for homeroom class
  const markCompletionQuery = useFetch(
    () => homeroomClass ? reportApi.getMarkCompletionStatus(homeroomClass.classId) : Promise.resolve(null),
    [homeroomClass?.classId]
  );

  // Fetch teacher assignments when teacher is identified
  const assignmentsQuery = useFetch(
    () => currentTeacher ? teacherApi.getAssignments(currentTeacher.teacher_id) : Promise.resolve([]),
    [currentTeacher?.teacher_id]
  );

  // Fetch marks for this teacher
  const teacherMarksQuery = useFetch(
    () => currentTeacher ? marksApi.getByTeacher(currentTeacher.teacher_id) : Promise.resolve([]),
    [currentTeacher?.teacher_id]
  );

  const scopedMarks = teacherMarksQuery.data || [];

  // Calculate assignment statistics
  const assignmentStats = useMemo(() => {
    const assignments = assignmentsQuery.data || [];
    const marks = scopedMarks;
    
    const stats = assignments.map(assignment => {
      const classId = assignment.classSubject?.class?.classId;
      const subjectId = assignment.classSubject?.subject?.subjectId;
      
      // Count marks submitted for this class-subject combination
      const submittedMarks = marks.filter(
        mark => 
          mark.enrollment?.classId === classId && 
          mark.subjectId === subjectId
      );
      
      return {
        ...assignment,
        className: assignment.classSubject?.class?.className || 'Unknown',
        subjectName: assignment.classSubject?.subject?.name || 'Unknown',
        classId,
        subjectId,
        marksSubmitted: submittedMarks.length,
        resultsPublished: assignment.classSubject?.class?.resultsPublished || false
      };
    });
    
    return stats;
  }, [assignmentsQuery.data, scopedMarks]);

  const marksAverage = scopedMarks.length
    ? (
        scopedMarks.reduce(
          (sum, mark) => sum + toNumber(mark.mark_obtained || mark.markObtained),
          0,
        ) / scopedMarks.length
      ).toFixed(1)
    : "0.0";

  const recentMarks = useMemo(
    () =>
      [...scopedMarks]
        .sort(
          (a, b) =>
            new Date(b.submitted_at || b.submittedAt || 0).getTime() -
            new Date(a.submitted_at || a.submittedAt || 0).getTime(),
        )
        .slice(0, 12)
        .map((mark) => ({
          ...mark,
          student_name: mark.enrollment?.student?.fullName || mark.enrollment?.student?.full_name || 'Unknown',
          subject_name: mark.subject?.name || 'Unknown',
          class_name: mark.enrollment?.class?.className || mark.enrollment?.class?.class_name || 'Unknown',
          submitted_on: formatDate(mark.submitted_at || mark.submittedAt),
        })),
    [scopedMarks],
  );

  const supportRows = useMemo(
    () =>
      (reportsQuery.data || [])
        .filter((row) => row.status !== "PASS")
        .sort((a, b) => toNumber(a.average_score) - toNumber(b.average_score))
        .slice(0, 12),
    [reportsQuery.data],
  );

  // Load class roster for mark entry
  const loadClassRoster = useCallback(async (classId) => {
    setLoadingRoster(true);
    try {
      const enrollments = await classApi.getEnrollments(classId);
      setClassRoster(enrollments);
    } catch (error) {
      notify({ type: 'error', message: error.message || 'Failed to load class roster' });
      setClassRoster([]);
    } finally {
      setLoadingRoster(false);
    }
  }, []);

  // Handle opening mark entry modal
  const handleOpenMarkEntry = useCallback((assignment) => {
    setSelectedAssignment(assignment);
    setSelectedClass(assignment.classId);
    setMarkFormData({ enrollmentId: "", markObtained: "" });
    setShowMarkEntry(true);
    loadClassRoster(assignment.classId);
  }, [loadClassRoster]);

  // Handle mark submission
  const handleSubmitMark = useCallback(async (e) => {
    e.preventDefault();
    
    if (!markFormData.enrollmentId || !markFormData.markObtained) {
      notify({ type: 'error', message: 'Please select a student and enter a mark' });
      return;
    }

    if (!currentTeacher || !selectedAssignment) {
      notify({ type: 'error', message: 'Teacher or assignment information missing' });
      return;
    }

    const markValue = parseInt(markFormData.markObtained);
    if (isNaN(markValue) || markValue < 0 || markValue > 100) {
      notify({ type: 'error', message: 'Mark must be between 0 and 100' });
      return;
    }

    setSubmittingMark(true);
    setAutoSaveStatus('');
    try {
      await marksApi.submitMark({
        teacherId: currentTeacher.teacher_id || currentTeacher.teacherId,
        enrollmentId: parseInt(markFormData.enrollmentId),
        subjectId: selectedAssignment.subjectId,
        markObtained: markValue,
      });
      
      notify({ type: 'success', message: 'Mark submitted successfully' });
      setMarkFormData({ enrollmentId: "", markObtained: "" });
      
      // Refresh data
      await teacherMarksQuery.refetch();
      await assignmentsQuery.refetch();
    } catch (error) {
      notify({ type: 'error', message: error.message || 'Failed to submit mark' });
    } finally {
      setSubmittingMark(false);
    }
  }, [markFormData, currentTeacher, selectedAssignment, teacherMarksQuery, assignmentsQuery]);

  // Auto-save functionality for mark entry
  const handleMarkChange = useCallback((field, value) => {
    setMarkFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear any existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    // Only auto-save if both fields are filled
    if (field === 'markObtained' && markFormData.enrollmentId && value) {
      const markValue = parseInt(value);
      
      // Validate mark range
      if (isNaN(markValue) || markValue < 0 || markValue > 100) {
        setAutoSaveStatus('error');
        return;
      }
      
      // Set up auto-save after 2 seconds of inactivity
      setAutoSaveStatus('');
      autoSaveTimeoutRef.current = setTimeout(async () => {
        if (!currentTeacher || !selectedAssignment) return;
        
        setAutoSaveStatus('saving');
        try {
          await marksApi.submitMark({
            teacherId: currentTeacher.teacher_id || currentTeacher.teacherId,
            enrollmentId: parseInt(markFormData.enrollmentId),
            subjectId: selectedAssignment.subjectId,
            markObtained: markValue,
          });
          
          setAutoSaveStatus('saved');
          
          // Refresh data in background
          teacherMarksQuery.refetch();
          assignmentsQuery.refetch();
          
          // Clear saved status after 3 seconds
          setTimeout(() => setAutoSaveStatus(''), 3000);
        } catch (error) {
          setAutoSaveStatus('error');
          notify({ type: 'error', message: error.message || 'Auto-save failed' });
        }
      }, 2000);
    } else if (field === 'enrollmentId' && markFormData.markObtained && value) {
      const markValue = parseInt(markFormData.markObtained);
      
      // Validate mark range
      if (isNaN(markValue) || markValue < 0 || markValue > 100) {
        setAutoSaveStatus('error');
        return;
      }
      
      // Set up auto-save after 2 seconds of inactivity
      setAutoSaveStatus('');
      autoSaveTimeoutRef.current = setTimeout(async () => {
        if (!currentTeacher || !selectedAssignment) return;
        
        setAutoSaveStatus('saving');
        try {
          await marksApi.submitMark({
            teacherId: currentTeacher.teacher_id || currentTeacher.teacherId,
            enrollmentId: parseInt(value),
            subjectId: selectedAssignment.subjectId,
            markObtained: markValue,
          });
          
          setAutoSaveStatus('saved');
          
          // Refresh data in background
          teacherMarksQuery.refetch();
          assignmentsQuery.refetch();
          
          // Clear saved status after 3 seconds
          setTimeout(() => setAutoSaveStatus(''), 3000);
        } catch (error) {
          setAutoSaveStatus('error');
          notify({ type: 'error', message: error.message || 'Auto-save failed' });
        }
      }, 2000);
    }
  }, [markFormData, currentTeacher, selectedAssignment, teacherMarksQuery, assignmentsQuery]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Handle viewing class roster
  const handleViewRoster = useCallback(async (assignment) => {
    setSelectedAssignment(assignment);
    setSelectedClass(assignment.classId);
    await loadClassRoster(assignment.classId);
  }, [loadClassRoster]);

  const errors = [
    teachersQuery.error,
    assignmentsQuery.error,
    teacherMarksQuery.error,
    reportsQuery.error,
    homeroomClassQuery.error,
    homeroomReportQuery.error,
    markCompletionQuery.error,
  ].filter(Boolean);

  const loading =
    teachersQuery.loading || assignmentsQuery.loading || teacherMarksQuery.loading || reportsQuery.loading;

  const refreshAll = async () => {
    await Promise.allSettled([
      teachersQuery.refetch(),
      assignmentsQuery.refetch(),
      teacherMarksQuery.refetch(),
      reportsQuery.refetch(),
      homeroomClassQuery.refetch(),
      homeroomReportQuery.refetch(),
      markCompletionQuery.refetch(),
    ]);
  };

  // Calculate homeroom class statistics
  const homeroomStats = useMemo(() => {
    if (!homeroomReportQuery.data) return null;
    
    const report = homeroomReportQuery.data;
    const students = report.students || [];
    
    const passCount = students.filter(s => s.status === 'PASS').length;
    const failCount = students.filter(s => s.status === 'FAIL').length;
    const incompleteCount = students.filter(s => s.status === 'INCOMPLETE').length;
    
    const completeStudents = students.filter(s => s.isComplete);
    const averageScore = completeStudents.length > 0
      ? (completeStudents.reduce((sum, s) => sum + (s.average || 0), 0) / completeStudents.length).toFixed(1)
      : '0.0';
    
    return {
      totalStudents: students.length,
      passCount,
      failCount,
      incompleteCount,
      averageScore,
      allMarksComplete: report.allMarksComplete,
      resultsPublished: report.resultsPublished
    };
  }, [homeroomReportQuery.data]);

  return (
    <div className="space-y-4">
      {errors.length ? (
        <StateView
          type="error"
          title="Some teaching data failed to load"
          description={errors[0]}
          action={
            <button
              type="button"
              onClick={refreshAll}
              className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Retry Dashboard Load
            </button>
          }
        />
      ) : null}

      {!loading && !currentTeacher ? (
        <StateView
          type="empty"
          title="Teacher profile not linked"
          description="Your user account is not yet mapped to a teacher record. You can still review reports and mark activity."
        />
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="metric-item">
          <p className="metric-label">Teacher Profile</p>
          <p className="metric-value">
            {currentTeacher?.full_name || currentTeacher?.fullName || "Unlinked"}
          </p>
          <p className="mt-1 text-xs text-slate-600">
            {currentTeacher
              ? `ID ${currentTeacher.teacher_id || currentTeacher.teacherId}`
              : "Needs mapping"}
          </p>
        </div>
        <div className="metric-item">
          <p className="metric-label">Class Assignments</p>
          <p className="metric-value">{assignmentStats.length}</p>
          <p className="mt-1 text-xs text-slate-600">Classes you teach</p>
        </div>
        <div className="metric-item">
          <p className="metric-label">Submitted Marks</p>
          <p className="metric-value">{scopedMarks.length}</p>
          <p className="mt-1 text-xs text-slate-600">Your current workload</p>
        </div>
        <div className="metric-item">
          <p className="metric-label">Average Mark</p>
          <p className="metric-value">{marksAverage}</p>
          <p className="mt-1 text-xs text-slate-600">From your submissions</p>
        </div>
      </div>

      {/* Homeroom Teacher Section */}
      {isHomeroomTeacher && homeroomClass && (
        <div className="space-y-4 border-t-2 border-emerald-200 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                Homeroom Class: {homeroomClass.className}
              </h2>
              <p className="text-sm text-slate-600">
                Grade {homeroomClass.grade} • {homeroomClass.term?.academicYear} - Semester {homeroomClass.term?.semester}
              </p>
            </div>
            <button
              onClick={() => setShowHomeroomSection(!showHomeroomSection)}
              className="text-sm text-emerald-600 hover:text-emerald-800 font-medium"
            >
              {showHomeroomSection ? 'Hide Details' : 'Show Details'}
            </button>
          </div>

          {homeroomStats && (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <div className="metric-item bg-blue-50">
                <p className="metric-label">Total Students</p>
                <p className="metric-value">{homeroomStats.totalStudents}</p>
              </div>
              <div className="metric-item bg-green-50">
                <p className="metric-label">Passing</p>
                <p className="metric-value">{homeroomStats.passCount}</p>
              </div>
              <div className="metric-item bg-red-50">
                <p className="metric-label">Failing</p>
                <p className="metric-value">{homeroomStats.failCount}</p>
              </div>
              <div className="metric-item bg-yellow-50">
                <p className="metric-label">Incomplete</p>
                <p className="metric-value">{homeroomStats.incompleteCount}</p>
              </div>
              <div className="metric-item bg-purple-50">
                <p className="metric-label">Class Average</p>
                <p className="metric-value">{homeroomStats.averageScore}</p>
              </div>
            </div>
          )}

          {showHomeroomSection && (
            <div className="space-y-4">
              {/* Mark Completion Status */}
              {markCompletionQuery.data && (
                <div className="card">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-800">Mark Completion Status</h3>
                    {markCompletionQuery.data.allMarksComplete ? (
                      <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-green-100 text-green-800">
                        ✓ All Marks Complete
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-yellow-100 text-yellow-800">
                        ⚠ Marks Pending
                      </span>
                    )}
                  </div>

                  {markCompletionQuery.data.pendingSubjects && markCompletionQuery.data.pendingSubjects.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-slate-700">Pending Subjects:</p>
                      <div className="space-y-2">
                        {markCompletionQuery.data.pendingSubjects.map((subject) => (
                          <div key={subject.subjectId} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                            <div>
                              <p className="font-medium text-slate-800">{subject.subjectName}</p>
                              <p className="text-sm text-slate-600">
                                {subject.submittedCount} / {subject.totalStudents} marks submitted
                              </p>
                              {subject.teachers && subject.teachers.length > 0 && (
                                <p className="text-xs text-slate-500 mt-1">
                                  Teacher: {subject.teachers.map(t => t.fullName).join(', ')}
                                </p>
                              )}
                            </div>
                            <span className="text-sm font-medium text-yellow-700">
                              {subject.pendingCount} pending
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {markCompletionQuery.data.allMarksComplete && (
                    <div className="text-center py-4">
                      <p className="text-slate-600">All marks have been submitted for this class.</p>
                      {!homeroomStats?.resultsPublished && (
                        <button
                          onClick={async () => {
                            try {
                              await classApi.publishResults(homeroomClass.classId);
                              notify({ type: 'success', message: 'Results published successfully' });
                              await refreshAll();
                            } catch (error) {
                              notify({ type: 'error', message: error.message || 'Failed to publish results' });
                            }
                          }}
                          className="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                        >
                          Publish Results
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Student Rankings */}
              {homeroomReportQuery.data && homeroomReportQuery.data.students && (
                <TableSection title="Student Rankings & Performance">
                  <Table
                    rows={homeroomReportQuery.data.students}
                    loading={homeroomReportQuery.loading}
                    error={homeroomReportQuery.error}
                    columns={[
                      { 
                        key: "rank", 
                        title: "Rank",
                        render: (row) => row.rank || '-'
                      },
                      { 
                        key: "student", 
                        title: "Student",
                        render: (row) => (
                          <div>
                            <p className="font-medium">{row.student?.fullName}</p>
                            <p className="text-xs text-slate-500">{row.student?.studentSchoolId}</p>
                          </div>
                        )
                      },
                      { 
                        key: "average", 
                        title: "Average",
                        render: (row) => row.average !== null ? row.average.toFixed(1) : '-'
                      },
                      { 
                        key: "status", 
                        title: "Status",
                        render: (row) => (
                          <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                            row.status === 'PASS' 
                              ? 'bg-green-100 text-green-800' 
                              : row.status === 'FAIL'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {row.status}
                          </span>
                        )
                      },
                      {
                        key: "marks",
                        title: "Marks",
                        render: (row) => (
                          <button
                            onClick={() => {
                              // Show marks detail modal
                              alert(`Marks for ${row.student?.fullName}:\n${row.marks.map(m => `${m.subjectName}: ${m.markObtained}`).join('\n')}`);
                            }}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            View Details
                          </button>
                        )
                      }
                    ]}
                    searchPlaceholder="Search students..."
                    pageSize={20}
                    pageSizeOptions={[10, 20, 50]}
                  />
                </TableSection>
              )}

              {/* Subject Performance Summary */}
              {markCompletionQuery.data && markCompletionQuery.data.subjectStatus && (
                <TableSection title="Subject Performance Overview">
                  <Table
                    rows={markCompletionQuery.data.subjectStatus}
                    loading={markCompletionQuery.loading}
                    error={markCompletionQuery.error}
                    columns={[
                      { key: "subjectName", title: "Subject" },
                      { key: "subjectCode", title: "Code" },
                      { 
                        key: "teachers", 
                        title: "Teacher(s)",
                        render: (row) => row.teachers?.map(t => t.fullName).join(', ') || '-'
                      },
                      { 
                        key: "completion", 
                        title: "Completion",
                        render: (row) => `${row.submittedCount} / ${row.totalStudents}`
                      },
                      { 
                        key: "isComplete", 
                        title: "Status",
                        render: (row) => (
                          <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                            row.isComplete 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {row.isComplete ? 'Complete' : 'Pending'}
                          </span>
                        )
                      }
                    ]}
                    searchPlaceholder="Search subjects..."
                    pageSize={10}
                    pageSizeOptions={[10, 20, 50]}
                  />
                </TableSection>
              )}
            </div>
          )}
        </div>
      )}

      {/* Assigned Classes and Subjects with Mark Submission Status */}
      <TableSection title="Your Class Assignments">
        <Table
          rows={assignmentStats}
          loading={assignmentsQuery.loading && !assignmentStats.length}
          error={assignmentsQuery.error}
          columns={[
            { key: "className", title: "Class" },
            { key: "subjectName", title: "Subject" },
            { key: "marksSubmitted", title: "Marks Submitted" },
            { 
              key: "resultsPublished", 
              title: "Status",
              render: (row) => (
                <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                  row.resultsPublished 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {row.resultsPublished ? 'Published' : 'In Progress'}
                </span>
              )
            },
            {
              key: "actions",
              title: "Actions",
              render: (row) => (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenMarkEntry(row)}
                    disabled={row.resultsPublished}
                    className="text-sm text-emerald-600 hover:text-emerald-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    Enter Marks
                  </button>
                  <button
                    onClick={() => handleViewRoster(row)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    View Roster
                  </button>
                </div>
              )
            }
          ]}
          searchPlaceholder="Search assignments..."
          pageSize={10}
          pageSizeOptions={[10, 20, 50]}
        />
      </TableSection>

      <div className="grid gap-3 md:grid-cols-2">
        <Link to="/marks" className="card">
          <p className="text-sm font-semibold">Open Marks Entry</p>
          <p className="text-xs text-slate-500">
            Submit and adjust marks for your classes.
          </p>
        </Link>
        <Link to="/reports" className="card">
          <p className="text-sm font-semibold">Open Reports</p>
          <p className="text-xs text-slate-500">
            Track outcomes and identify support needs.
          </p>
        </Link>
      </div>

      <TableSection title="Recent Marks Submitted">
        <Table
          rows={recentMarks}
          loading={teacherMarksQuery.loading && !recentMarks.length}
          error={teacherMarksQuery.error}
          columns={[
            { key: "student_name", title: "Student" },
            { key: "class_name", title: "Class" },
            { key: "subject_name", title: "Subject" },
            { 
              key: "mark_obtained", 
              title: "Mark",
              render: (row) => row.mark_obtained || row.markObtained || 0
            },
            { key: "submitted_on", title: "Submitted" },
          ]}
          searchPlaceholder="Search submitted marks..."
          pageSize={12}
          pageSizeOptions={[12, 24, 36]}
        />
      </TableSection>

      <TableSection title="Students Requiring Support">
        <Table
          rows={supportRows}
          loading={reportsQuery.loading && !supportRows.length}
          error={reportsQuery.error}
          columns={[
            { key: "student_school_id", title: "Student ID" },
            { key: "full_name", title: "Student" },
            { key: "class_name", title: "Class" },
            { key: "average_score", title: "Average" },
            { key: "status", title: "Status" },
          ]}
          searchPlaceholder="Search support list..."
          pageSize={12}
          pageSizeOptions={[12, 24, 36]}
        />
      </TableSection>

      {/* Mark Entry Modal */}
      <Modal
        isOpen={showMarkEntry}
        onClose={() => {
          setShowMarkEntry(false);
          setAutoSaveStatus('');
          if (autoSaveTimeoutRef.current) {
            clearTimeout(autoSaveTimeoutRef.current);
          }
        }}
        title={`Enter Marks - ${selectedAssignment?.className} - ${selectedAssignment?.subjectName}`}
      >
        <form onSubmit={handleSubmitMark} className="space-y-4">
          <Select
            label="Student"
            name="enrollmentId"
            value={markFormData.enrollmentId}
            onChange={(e) => handleMarkChange('enrollmentId', e.target.value)}
            options={classRoster.map((enrollment) => ({
              value: enrollment.enrollment_id || enrollment.enrollmentId,
              label: `${enrollment.student?.full_name || enrollment.student?.fullName} (${enrollment.student?.student_school_id || enrollment.student?.studentSchoolId})`,
            }))}
            disabled={loadingRoster}
          />
          
          <div>
            <Input
              label="Mark Obtained (0-100)"
              name="markObtained"
              type="number"
              min="0"
              max="100"
              value={markFormData.markObtained}
              onChange={(e) => handleMarkChange('markObtained', e.target.value)}
              placeholder="Enter mark between 0 and 100"
            />
            {autoSaveStatus && (
              <div className="mt-2 text-sm">
                {autoSaveStatus === 'saving' && (
                  <span className="text-blue-600">💾 Auto-saving...</span>
                )}
                {autoSaveStatus === 'saved' && (
                  <span className="text-green-600">✓ Auto-saved successfully</span>
                )}
                {autoSaveStatus === 'error' && (
                  <span className="text-red-600">✗ Auto-save failed</span>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              onClick={() => {
                setShowMarkEntry(false);
                setAutoSaveStatus('');
                if (autoSaveTimeoutRef.current) {
                  clearTimeout(autoSaveTimeoutRef.current);
                }
              }}
              disabled={submittingMark}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={submittingMark}
            >
              Submit Mark
            </Button>
          </div>
        </form>
      </Modal>

      {/* Class Roster Modal */}
      <Modal
        isOpen={selectedClass !== null && !showMarkEntry}
        onClose={() => {
          setSelectedClass(null);
          setSelectedAssignment(null);
          setClassRoster([]);
        }}
        title={`Class Roster - ${selectedAssignment?.className} - ${selectedAssignment?.subjectName}`}
      >
        <div className="space-y-4">
          {loadingRoster ? (
            <div className="text-center py-8">
              <p className="text-slate-600">Loading roster...</p>
            </div>
          ) : classRoster.length === 0 ? (
            <StateView
              type="empty"
              title="No students enrolled"
              description="This class has no enrolled students yet."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Enrolled</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {classRoster.map((enrollment) => (
                    <tr key={enrollment.enrollment_id || enrollment.enrollmentId}>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {enrollment.student?.student_school_id || enrollment.student?.studentSchoolId}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {enrollment.student?.full_name || enrollment.student?.fullName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatDate(enrollment.enrolled_at || enrollment.enrolledAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default TeacherDashboard;
