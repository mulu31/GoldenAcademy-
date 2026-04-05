import { Link } from "react-router-dom";
import RegisterForm from "../components/auth/RegisterForm";

const RegisterPage = () => {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-lg lg:grid-cols-2">
        <div className="hidden bg-emerald-700 p-8 text-white lg:block">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-emerald-100">
            Golden High School
          </p>
          <h2 className="mt-3 text-3xl font-bold">Account Registration</h2>
          <p className="mt-3 text-sm text-emerald-50">
            Create authorized user access for institutional academic operations.
          </p>
        </div>

        <div className="p-6 sm:p-8">
          <h1 className="text-2xl font-semibold text-slate-900">
            Register Account
          </h1>
          <p className="mb-6 mt-1 text-sm text-slate-500">
            Complete registration with role-based permissions
          </p>
          <RegisterForm />
          <p className="mt-4 text-sm text-slate-600">
            Already registered?{" "}
            <Link to="/login" className="font-semibold text-emerald-700">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
