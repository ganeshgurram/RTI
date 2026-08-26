import {
  BadgeCheck,
  Banknote,
  Clock3,
  FileQuestion,
  FileText,
  HelpCircle,
  Landmark,
  MessageSquareText,
  ShieldCheck,
  UserRound,
} from "lucide-react"

export const navItems = [
  { label: "Home", path: "/" },
  { label: "Login", path: "/login" },
  { label: "FAQ", path: "/faq" },
  { label: "Profile", path: "/profile" },
]

export const quickActions = [
  {
    title: "Submit RTI Request",
    description: "Start a guided application with department selection and fee mockup.",
    icon: FileText,
    path: "/login",
  },
  {
    title: "Track Application",
    description: "Use a mock registration number to review status and next steps.",
    icon: Clock3,
    path: "/profile",
  },
  {
    title: "First Appeal",
    description: "Prepare an appeal when a reply is delayed or incomplete.",
    icon: MessageSquareText,
    path: "/profile",
  },
  {
    title: "Read FAQ",
    description: "Understand eligibility, fees, timelines, and exemptions.",
    icon: HelpCircle,
    path: "/faq",
  },
]

export const serviceStats = [
  { label: "Average filing time", value: "7 min" },
  { label: "Mock departments", value: "24" },
  { label: "Guidance checks", value: "12" },
]

export const faqItems = [
  {
    id: "scope",
    question: "Who can file an RTI request?",
    answer:
      "Any citizen of India can request information from a public authority under the RTI Act. This prototype keeps the journey mocked and does not collect real identity documents.",
  },
  {
    id: "fee",
    question: "What is the application fee?",
    answer:
      "The standard central RTI application fee is represented as a mock payment step here. No real payment gateway is connected in this build.",
  },
  {
    id: "timeline",
    question: "How long does a response take?",
    answer:
      "Most RTI requests follow a thirty-day response window, with shorter timelines for life and liberty matters. The tracker uses sample timeline states for the demo.",
  },
  {
    id: "appeal",
    question: "What if I do not receive a response?",
    answer:
      "The first appeal flow helps prepare the next step when the response is delayed, rejected, or incomplete. The data is mocked for frontend demonstration.",
  },
  {
    id: "privacy",
    question: "Should I enter real personal details?",
    answer:
      "No. This is an independent hackathon prototype. Use only sample data while testing the experience.",
  },
]

export const timeline = [
  { label: "Application submitted", date: "12 Aug 2026", state: "complete" },
  { label: "Forwarded to public authority", date: "13 Aug 2026", state: "complete" },
  { label: "Under review", date: "In progress", state: "active" },
  { label: "Reply due", date: "11 Sep 2026", state: "pending" },
]

export const profileSummary = [
  { label: "Filed", value: "8", icon: FileText },
  { label: "In progress", value: "3", icon: Clock3 },
  { label: "Replied", value: "5", icon: BadgeCheck },
  { label: "Appeals", value: "1", icon: FileQuestion },
]

export const recentApplications = [
  {
    id: "RTI/2026/11842",
    subject: "Road maintenance records for Ward 14",
    authority: "Municipal Public Works Division",
    status: "Under review",
    due: "11 Sep 2026",
  },
  {
    id: "RTI/2026/10319",
    subject: "Scholarship disbursement status",
    authority: "Department of Higher Education",
    status: "Reply received",
    due: "Closed",
  },
  {
    id: "RTI/2026/09751",
    subject: "Hospital procurement tender copy",
    authority: "Health Services Directorate",
    status: "First appeal ready",
    due: "Action needed",
  },
]

export const trustMarkers = [
  { label: "Citizen-first flow", icon: UserRound },
  { label: "Plain-language checks", icon: ShieldCheck },
  { label: "Mock fee receipt", icon: Banknote },
  { label: "Authority mapping", icon: Landmark },
]
