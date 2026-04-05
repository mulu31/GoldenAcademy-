import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import AdminDashboard from "../AdminDashboard";
import userApi from "../../../api/userApi";
import departmentApi from "../../../api/departmentApi";
import termApi from "../../../api/termApi";
import classApi from "../../../api/classApi";
import auditApi from "../../../api/auditApi";
import roleApi from "../../../api/roleApi";

// Mock all API modules
vi.mock("../../../api/userApi");
vi.mock("../../../api/departmentApi");
vi.mock("../../../api/termApi");
vi.mock("../../../api/classApi");
vi.mock("../../../api/auditApi");
vi.mock("../../../api/roleApi");
vi.mock("../../../utils/notifications");

const mockUsers = [
  {
    user_id: 1,
    email: "admin@test.com",
    is_active: true,
    roles: ["SYSTEM_ADMIN"],
  },
  {
    user_id: 2,
    email: "user@test.com",
    is_active: true,
    roles: ["TEACHER"],
  },
];

const mockDepartments = [
  { department_id: 1, name: "Mathematics", code: "MATH" },
  { department_id: 2, name: "Science", code: "SCI" },
];

const mockTerms = [
  { term_id: 1, academic_year: "2024", semester: "S1" },
  { term_id: 2, academic_year: "2024", semester: "S2" },
];

const mockClasses = [
  {
    class_id: 1,
    class_name: "Class A",
    grade: "10",
    term_id: 1,
    results_published: false,
  },
  {
    class_id: 2,
    class_name: "Class B",
    grade: "11",
    term_id: 1,
    results_published: true,
  },
];

const mockRoles = [
  { role_id: 1, name: "SYSTEM_ADMIN" },
  { role_id: 2, name: "TEACHER" },
];

const mockAuditLogs = {
  logs: [
    {
      audit_log_id: 1,
      user: { email: "admin@test.com" },
      action: "CREATE",
      resource_type: "USER",
      resource_id: 1,
      created_at: new Date().toISOString(),
    },
  ],
  total: 1,
  page: 1,
  totalPages: 1,
};

describe("AdminDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock implementations
    userApi.getWithRoles.mockResolvedValue({ data: mockUsers });
    departmentApi.getAll.mockResolvedValue({ data: mockDepartments });
    termApi.getAll.mockResolvedValue({ data: mockTerms });
    classApi.getAll.mockResolvedValue({ data: mockClasses });
    roleApi.getAll.mockResolvedValue({ data: mockRoles });
    auditApi.getAll.mockResolvedValue({ data: mockAuditLogs });
  });

  const renderDashboard = () => {
    return render(
      <BrowserRouter>
        <AdminDashboard />
      </BrowserRouter>
    );
  };

  it("should render dashboard with system-wide statistics", async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("Users")).toBeInTheDocument();
      expect(screen.getByText("Departments")).toBeInTheDocument();
      expect(screen.getByText("Terms")).toBeInTheDocument();
      expect(screen.getByText("Pending Publication")).toBeInTheDocument();
    });

    // Check statistics values - use getAllByText since multiple metrics may show "2"
    expect(screen.getAllByText("2").length).toBeGreaterThan(0); // Users count
    expect(screen.getByText("2 active")).toBeInTheDocument();
  });

  it("should display user management interface with CRUD operations", async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("User Management")).toBeInTheDocument();
    });

    // Check if Create User button exists
    const createButton = screen.getByText("Create User");
    expect(createButton).toBeInTheDocument();

    // Check if user data is displayed
    expect(screen.getByText("admin@test.com")).toBeInTheDocument();
    expect(screen.getByText("user@test.com")).toBeInTheDocument();
  });

  it("should open create user modal when Create User button is clicked", async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("Create User")).toBeInTheDocument();
    });

    const createButton = screen.getByText("Create User");
    fireEvent.click(createButton);

    await waitFor(() => {
      // Use getByRole to find the modal dialog, then check labels within it
      const dialog = screen.getByRole("dialog");
      expect(dialog).toBeInTheDocument();
      expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    });
  });

  it("should display department management interface", async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("Department Management")).toBeInTheDocument();
    });

    // Check if Create Department button exists
    const createButton = screen.getByText("Create Department");
    expect(createButton).toBeInTheDocument();

    // Check if department data is displayed
    expect(screen.getByText("Mathematics")).toBeInTheDocument();
    expect(screen.getByText("Science")).toBeInTheDocument();
  });

  it("should display audit log viewer with recent activities", async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("Recent Audit Activities")).toBeInTheDocument();
    });

    // Check if View All and Export buttons exist
    expect(screen.getByText("View All")).toBeInTheDocument();
    expect(screen.getByText("Export")).toBeInTheDocument();
  });

  it("should handle user creation", async () => {
    userApi.create.mockResolvedValue({ data: { user_id: 3 } });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("Create User")).toBeInTheDocument();
    });

    // Open create modal
    const createButton = screen.getByText("Create User");
    fireEvent.click(createButton);

    // Wait for modal and inputs to be available
    const emailInput = await screen.findByLabelText(/^Email/i);
    const passwordInput = await screen.findByLabelText(/^Password/i);

    fireEvent.change(emailInput, { target: { value: "newuser@test.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    // Submit the form directly
    const form = emailInput.closest("form");
    fireEvent.submit(form);

    await waitFor(() => {
      expect(userApi.create).toHaveBeenCalledWith({
        email: "newuser@test.com",
        password: "password123",
        is_active: true,
      });
    });
  });

  it("should handle department creation", async () => {
    departmentApi.create.mockResolvedValue({ data: { department_id: 3 } });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("Create Department")).toBeInTheDocument();
    });

    // Open create modal
    const createButton = screen.getByText("Create Department");
    fireEvent.click(createButton);

    // Wait for modal inputs to be available
    const nameInput = await screen.findByLabelText(/^Name/i);
    const codeInput = await screen.findByLabelText(/^Code/i);

    fireEvent.change(nameInput, { target: { value: "English" } });
    fireEvent.change(codeInput, { target: { value: "ENG" } });

    // Submit the form directly
    const form = nameInput.closest("form");
    fireEvent.submit(form);

    await waitFor(() => {
      expect(departmentApi.create).toHaveBeenCalledWith({
        name: "English",
        code: "ENG",
      });
    });
  });

  it("should handle audit log filtering", async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("View All")).toBeInTheDocument();
    });

    // Open audit log modal
    const viewAllButton = screen.getByText("View All");
    fireEvent.click(viewAllButton);

    await waitFor(() => {
      expect(screen.getByText("All Audit Logs")).toBeInTheDocument();
    });
  });

  it("should display action links for navigation", async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("Manage Departments")).toBeInTheDocument();
      expect(screen.getByText("Manage Terms")).toBeInTheDocument();
      expect(screen.getByText("Review Classes")).toBeInTheDocument();
      expect(screen.getByText("Open Reports")).toBeInTheDocument();
    });
  });

  it("should show error state when data fails to load", async () => {
    userApi.getWithRoles.mockRejectedValue(new Error("Failed to load"));

    renderDashboard();

    await waitFor(() => {
      expect(
        screen.getByText("Some dashboard data failed to load")
      ).toBeInTheDocument();
    });
  });

  it("should handle user deletion", async () => {
    window.confirm = vi.fn(() => true);
    userApi.remove.mockResolvedValue({ data: {} });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("admin@test.com")).toBeInTheDocument();
    });

    // Find and click delete button
    const deleteButtons = screen.getAllByText("Delete");
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(userApi.remove).toHaveBeenCalled();
    });
  });

  it("should handle role assignment", async () => {
    userApi.assignRole.mockResolvedValue({ data: {} });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("admin@test.com")).toBeInTheDocument();
    });

    // Find and click assign role button
    const assignButtons = screen.getAllByText("Assign Role");
    fireEvent.click(assignButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/Assign Role to/i)).toBeInTheDocument();
    });
  });
});
