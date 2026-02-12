import AuthLayout from "../../Components/Auth/AuthLayout";
import LoginCard from "../../Components/Auth/LoginCard";
import PoliciesCard from "../../Components/Auth/PoliciesCard";

export default function Page() {
  return (
    <AuthLayout title="Terminal 4" statusLabel="Online" footerText="© 2026 Terminal 4. Secure connection.">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        <LoginCard />
        <PoliciesCard />
      </div>
    </AuthLayout>
  );
}
