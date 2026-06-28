import { Users, Wallet, ShieldCheck } from "lucide-react";
import { Feature108 } from "@/components/landing/ui/shadcnblocks-com-feature108";
import { Reveal } from "./Reveal";

const tabs = [
  {
    value: "tab-1",
    icon: <Users className="h-auto w-4 shrink-0" />,
    label: "People & Leave",
    content: {
      badge: "Everyday HR",
      title: "Manage your whole team in one place.",
      description:
        "Employee records, contracts and documents, plus self-service leave booking with statutory entitlement, holiday accrual and absence tracking approvals routed to the right manager.",
      buttonText: "Explore HR & leave",
      imageSrc: "/hr1.webp",
      imageAlt: "HR team managing people and leave",
    },
  },
  {
    value: "tab-2",
    icon: <Wallet className="h-auto w-4 shrink-0" />,
    label: "Payroll & Pensions",
    content: {
      badge: "HMRC-ready",
      title: "Run UK payroll with confidence.",
      description:
        "PAYE, National Insurance, statutory pay and pension auto-enrolment on the 2024/25 engine. Generate payslips, track employer costs and prepare for RTI.",
      buttonText: "See payroll",
      imageSrc: "/hr2.jpeg",
      imageAlt: "UK payroll and pensions",
    },
  },
  {
    value: "tab-3",
    icon: <ShieldCheck className="h-auto w-4 shrink-0" />,
    label: "Compliance & RTW",
    content: {
      badge: "Compliant by design",
      title: "Stay on the right side of UK law.",
      description:
        "GDPR with DSAR handling, Right-to-Work and visa tracking, equality monitoring and H&S/RIDDOR — surfaced as a live compliance score with deadline alerts.",
      buttonText: "View compliance",
      imageSrc: "/hr3.jpg",
      imageAlt: "UK HR compliance and right-to-work",
    },
  },
];

export function FeatureTabs() {
  return (
    <Reveal direction="left">
      <Feature108
        badge="Platform deep-dive"
        heading="Three pillars. One coherent platform."
        description="People, pay and compliance working together so nothing falls through the cracks."
        tabs={tabs}
      />
    </Reveal>
  );
}
