import bcrypt from "bcryptjs"

const profiles = [
  {
    id: "CIT-2026-004218", username: "rajesh.kumar", initials: "RK", fullName: "Rajesh Kumar", guardianName: "Mahesh Kumar", dateOfBirth: "18 March 1988", gender: "Male", citizenship: "Indian", email: "rajesh.kumar@example.in", mobile: "+91 98765 43210", alternateMobile: "+91 98111 22445", country: "India", countryName: "", areaType: "Urban", educationalStatus: "Literate", addressText: "B-42, Green Park Extension, Near Aurobindo Market, New Delhi, South Delhi", preferredLanguage: "English", address: { line1: "B-42, Green Park Extension", line2: "Near Aurobindo Market", city: "New Delhi", district: "South Delhi", state: "Delhi", pincode: "110016" }, account: { status: "Verified", memberSince: "12 April 2023", lastLogin: "", loginMethod: "Username and password" }, password: "rti@2026",
  },
  {
    id: "CIT-2026-008731", username: "ananya.nair", initials: "AN", fullName: "Ananya Nair", guardianName: "Suresh Nair", dateOfBirth: "09 November 1992", gender: "Female", citizenship: "Indian", email: "ananya.nair@example.in", mobile: "+91 98470 11223", alternateMobile: "+91 98472 66781", country: "India", countryName: "", areaType: "Urban", educationalStatus: "Literate", addressText: "14, Coconut Grove, Vyttila, Ernakulam, Kerala", preferredLanguage: "English", address: { line1: "14, Coconut Grove", line2: "Vyttila, Ernakulam", city: "Kochi", district: "Ernakulam", state: "Kerala", pincode: "682019" }, account: { status: "Verified", memberSince: "09 February 2025", lastLogin: "", loginMethod: "DigiLocker" }, password: "digilocker",
  },
]

const rajeshRequests = [
  ["Road maintenance records for Ward 14", "Municipal Public Works Division", "Processing", "Awaiting reply from the CPIO"],
  ["Ward 14 streetlight repair backlog", "Municipal Public Works Division", "Processing", "Awaiting reply from the CPIO"],
  ["Stormwater drain desilting schedule", "Municipal Public Works Division", "Processing", "No reply received"],
  ["Scholarship disbursement status", "Department of Higher Education", "Satisfied", "Closed"],
  ["Hospital procurement tender copy", "Health Services Directorate", "First Appeal", "Action needed by 19 Aug 2026"],
  ["Public transport accessibility audit", "Ministry of Road Transport and Highways", "Reply received", "Review response"],
  ["Water quality inspection report", "Central Ground Water Board", "Second Appeal", "Filed with CIC"],
  ["Property tax assessment calculation", "Municipal Revenue Department", "Processing", "Reply due 20 Apr 2026"],
  ["Streetlight contractor details", "Municipal Electrical Division", "Reply received", "Review response"],
  ["District hospital medicine stock register", "District Health Office", "Satisfied", "Closed"],
  ["Public park development expenditure", "Urban Development Authority", "First Appeal", "Hearing notice awaited"],
  ["School building safety inspection report", "Directorate of School Education", "Reply received", "Review response"],
]

const ananyaRequests = [
  ["Passport re-issue processing timeline", "Ministry of External Affairs", "Processing", "Awaiting reply from the CPIO"],
  ["EPF withdrawal claim rejection reasons", "Employees' Provident Fund Organisation", "Reply received", "Review response"],
  ["Tatkaal appointment quota at Kochi PSK", "Ministry of External Affairs", "Processing", "Awaiting reply from the CPIO"],
  ["Police verification turnaround times", "Ministry of External Affairs", "Processing", "No reply received"],
  ["Southern Railway accessibility works", "Ministry of Railways", "First Appeal", "Action needed by 17 Sep 2026"],
  ["Income tax refund delay", "Central Board of Direct Taxes", "Satisfied", "Closed"],
  ["Speed post consignment tracking", "Department of Posts", "Reply received", "Review response"],
  ["Cochin Port dredging contract award", "Ministry of Ports, Shipping and Waterways", "Second Appeal", "Filed with CIC"],
  ["Aadhaar enrolment centre disposal statistics", "Unique Identification Authority of India", "Satisfied", "Closed"],
  ["Kendriya Vidyalaya admission lottery", "Kendriya Vidyalaya Sangathan", "Processing", "Reply due 05 Jun 2026"],
]

function makeRequests(user, entries, registrationStart, baseTime) {
  return entries.map(([subject, authority, status, nextAction], index) => {
    const createdAt = new Date(baseTime - (index + 1) * 8 * 24 * 60 * 60 * 1000)
    return {
      requestId: `RTI-2026-${String(registrationStart - index).padStart(5, "0")}`,
      userId: user._id,
      applicant: { name: user.profile.fullName, email: user.profile.email, phone: user.profile.mobile },
      authority,
      subject,
      requestText: `Please provide the relevant records and certified information concerning ${subject.toLowerCase()}.`,
      isBplApplicant: false,
      status,
      nextAction,
      createdAt,
      updatedAt: new Date(createdAt.getTime() + 3 * 24 * 60 * 60 * 1000),
      timeline: [{ label: "Application submitted", createdAt }],
    }
  })
}

export async function seedDatabase(db) {
  const users = db.collection("users")
  const seededUsers = []
  for (const { password, ...profile } of profiles) {
    let user = await users.findOne({ username: profile.username })
    if (!user) {
      const result = await users.insertOne({ username: profile.username, passwordHash: await bcrypt.hash(password, 12), profile, createdAt: new Date(), updatedAt: new Date() })
      user = { _id: result.insertedId, username: profile.username, profile }
    }
    seededUsers.push(user)
  }

  const baseTime = Date.now()
  const requests = db.collection("requests")
  if (!await requests.countDocuments()) {
    await requests.insertMany([
      ...makeRequests(seededUsers[0], rajeshRequests, 12100, baseTime),
      ...makeRequests(seededUsers[1], ananyaRequests, 13100, baseTime),
    ])
  }

  const notifications = db.collection("notifications")
  if (!await notifications.countDocuments()) {
    const rows = [
      [0, "pending_actions", "Request is being processed", "Your RTI application has been assigned to the concerned CPIO.", "RTI-2026-12100", "viewRequest", false, 2],
      [0, "mark_email_read", "A response is available", "A public authority has uploaded a reply to one of your RTI requests.", "RTI-2026-12099", "viewResponse", false, 24],
      [0, "gavel", "First appeal can now be filed", "No reply has been recorded within the statutory response period for your request.", "RTI-2026-12098", "fileFirstAppeal", false, 36],
      [0, "account_balance", "Request forwarded to the concerned authority", "Your application was transferred to the authority responsible for the requested information.", "RTI-2026-12096", "viewRequest", true, 144],
      [0, "archive", "Request archived", "Your older application remains available in Request History.", "RTI-2026-12093", "viewRequest", true, 480],
      [1, "verified_user", "DigiLocker identity verified", "Your identity details from DigiLocker are applied to your profile.", "RTI-2026-13100", "viewRequest", false, 1],
      [1, "mark_email_read", "A response is available", "A public authority has uploaded a reply to one of your RTI requests.", "RTI-2026-13099", "viewResponse", false, 24],
      [1, "gavel", "First appeal can now be filed", "No reply has been recorded within the statutory response period for your request.", "RTI-2026-13097", "fileFirstAppeal", false, 40],
      [1, "payments", "Fee payment confirmed", "Your RTI fee was received and the registration number was generated.", "RTI-2026-13094", "viewRequest", true, 504],
    ]
    await notifications.insertMany(rows.map(([userIndex, icon, title, description, requestId, action, isRead, hoursAgo], index) => ({
      notificationId: `seed-notification-${index + 1}`,
      userId: seededUsers[userIndex]._id,
      icon,
      title,
      description,
      requestId,
      action,
      isRead,
      createdAt: new Date(baseTime - hoursAgo * 60 * 60 * 1000),
    })))
  }

  const payments = db.collection("payments")
  if (!await payments.countDocuments()) {
    await payments.insertMany([
      { transactionId: "TXN_9823410", userId: seededUsers[0]._id, applicantName: seededUsers[0].profile.fullName, email: seededUsers[0].profile.email, mobile: "9876543210", amount: "₹ 10.00", method: "SBI Net Banking", authority: "Municipal Public Works Division", purpose: "RTI application fee", outcome: "confirmed", registrationNumber: "RTI-2026-12057", createdAt: new Date(baseTime - 9 * 24 * 60 * 60 * 1000), updatedAt: new Date() },
      { transactionId: "TXN_9831774", userId: seededUsers[0]._id, applicantName: seededUsers[0].profile.fullName, email: seededUsers[0].profile.email, mobile: "9876543210", amount: "₹ 10.00", method: "SBI Debit Card", authority: "Central Ground Water Board", purpose: "RTI application fee", outcome: "awaitingBank", createdAt: new Date(baseTime - 7 * 24 * 60 * 60 * 1000), updatedAt: new Date() },
      { transactionId: "TXN_9820165", userId: seededUsers[1]._id, applicantName: seededUsers[1].profile.fullName, email: seededUsers[1].profile.email, mobile: "9847011223", amount: "₹ 10.00", method: "UPI", authority: "Ministry of External Affairs", purpose: "RTI application fee", outcome: "refunded", refundReference: "RRN-4471902238", createdAt: new Date(baseTime - 10 * 24 * 60 * 60 * 1000), updatedAt: new Date() },
    ])
  }
}
