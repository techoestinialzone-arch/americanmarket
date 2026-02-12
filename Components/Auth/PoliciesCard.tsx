import CardShell from "../ui/CardShell";

const POLICIES = [
  {
    title: "Payments and refunds",
    items: [
      "Payments are generally non-refundable once the service is provisioned or a digital item is delivered.",
      "If a purchase fails to deliver due to a verified system error, you may request a review within 24 hours.",
      "Chargebacks and payment disputes may result in account restrictions.",
    ],
  },
  {
    title: "Account security",
    items: [
      "Do not share your password or verification codes.",
      "Repeated failed login attempts may trigger temporary lockouts.",
      "We may log security-related events to prevent abuse and protect accounts.",
    ],
  },
  {
    title: "Usage",
    items: [
      "One account per person unless explicitly approved.",
      "Automated scraping, reverse engineering, and abuse attempts are prohibited.",
      "Violation of terms may result in suspension without notice.",
    ],
  },
];

export default function PoliciesCard() {
  return (
    <CardShell
      title="Policies & Terms"
      subtitle="Please review before continuing."
    >
      <div className="space-y-6">
        {POLICIES.map((section) => (
          <div key={section.title}>
            <h3 className="text-sm font-semibold text-white">{section.title}</h3>
            <ul className="mt-3 text-xs text-slate-400 space-y-2 list-disc pl-5">
              {section.items.map((text, idx) => (
                <li key={idx}>{text}</li>
              ))}
            </ul>
          </div>
        ))}

    
      </div>
    </CardShell>
  );
}
