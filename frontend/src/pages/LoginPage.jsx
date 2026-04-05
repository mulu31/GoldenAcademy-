import { Link } from "react-router-dom";
import LoginForm from "../components/auth/LoginForm";

const LoginPage = () => {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-lg lg:grid-cols-2">
        <div className="hidden bg-emerald-700 p-8 text-white lg:block">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-emerald-100">
            Golden High School
          </p>
          <h2 className="mt-3 text-3xl font-bold">Secure Access Portal</h2>
          <p className="mt-3 text-sm text-emerald-50">
            Please sign in to continue with authorized academic operations.
          </p>
          <div className="mt-8 metric-strip">
            <div className="rounded-xl bg-white/15 px-3 py-2">
              <p className="text-xs uppercase tracking-[0.08em] text-emerald-100">
                Role-based
              </p>
              <p className="text-sm font-bold">Access Control</p>
            </div>
            <div className="rounded-xl bg-white/15 px-3 py-2">
              <p className="text-xs uppercase tracking-[0.08em] text-emerald-100">
                Real-time
              </p>
              <p className="text-sm font-bold">Data Operations</p>
            </div>
            <div className="rounded-xl bg-white/15 px-3 py-2">
              <p className="text-xs uppercase tracking-[0.08em] text-emerald-100">
                Academic
              </p>
              <p className="text-sm font-bold">Reporting</p>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <h1 className="text-2xl font-semibold text-slate-900">Sign In</h1>
          <p className="mb-6 mt-1 text-sm text-slate-500">
            Access the Golden High School academic management platform
          </p>
          <LoginForm />
          <p className="mt-4 text-sm text-slate-600">
            Need an account?{" "}
            <Link to="/register" className="font-semibold text-emerald-700">
              Register Access
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
