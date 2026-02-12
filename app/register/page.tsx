import AuthLayout from "../../Components/Auth/AuthLayout";
import PoliciesCard from "../../Components/Auth/PoliciesCard";
import RegisterCard from "../../Components/Auth/RegisterCard";

export default function Page() {
  return (
    <AuthLayout title="Terminal 4" statusLabel="Online" footerText="© 2026 Terminal 4. Secure connection.">
      <div className="w-full max-w-6xl">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-white">Create your account</h1>
          <p className="mt-2 text-sm text-slate-400">
            Use a strong password. You may be asked to verify your email.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-start">
          <RegisterCard />
          <PoliciesCard />
        </div>

        <p className="mt-8 text-center text-xs text-slate-500">
          Already have an account?{" "}
          <a className="text-cyan-200 hover:text-white hover:underline underline-offset-4" href="/">
            Sign in
          </a>
        </p>
      </div>
    </AuthLayout>
  );
}
