import { useMemo, useState } from "react"
import { Link } from "react-router-dom"

import { MaterialIcon } from "@/routes/stitch-shell"

const sections = [
  {
    icon: "account_balance",
    title: "Request Scope & Filing",
    items: [
      [
        "To which Public Authority can I file a request through this portal?",
        "An applicant who desires to obtain information under the RTI Act, 2005 can make a request through this RTI Online Portal to the Central Ministries/Departments and other Central Public Authorities mentioned in ONLINE RTI request form.",
      ],
      [
        "How do I write my application for seeking the information as per RTI Act 2005?",
        "The text of the application may be written in the prescribed column of the RTI request form. At present, the text of the application is confined up to 3000 characters only. In case, the text of an application contains more than 3000 characters, it can be uploaded as a PDF attachment in the \"Supporting Document\" column of the form.",
      ],
      [
        "What will happen to my application if I select a wrong Public Authority in the RTI request form?",
        "In case the RTI application is not meant for the Public authority which has been selected by the applicant, the \"Nodal Officer\" of the said public authority would transfer the application electronically to the \"Nodal Officer\" of the concerned Central Public authority, if aligned to this portal and physically to that Central Public authority which is not aligned to this portal, under section 6(3) of the RTI Act. It may be noted that RTI applications filed through this portal for the state public authorities, including NCT of Delhi, would be returned, without any refund of fee",
      ],
      [
        "Can I file RTI application for state public authorities through this portal?",
        "No. This Portal is exclusively meant for Public Authorities under Central Govt. only.",
      ],
      [
        "Is it mandatory to create user account on RTI online web portal?",
        "No. You can directly file your RTI on \"Submit Request\" tab.",
      ],
    ],
  },
  {
    icon: "payments",
    title: "Fees & Payment",
    items: [
      [
        "How do I make the payment for RTI fee?",
        "After filling the first page of the RTI request form, a non-BPL applicant has to click on \"Make Payment\" button for payment of the prescribed RTI fee. The applicant can pay the prescribed RTI fee through the following modes: (i) Internet banking through SBI payment gateway and its associated banks. (ii) Using ATM-cum-Debit card of State Bank of India. (iii) Credit/Debit card of Master/Visa. (iv) UPI It may be noted that no RTI fee is required to be paid by a citizen who is below poverty line, as per RTI Rules, 2012. However, the BPL applicant must attach a copy of the certificate issued by the appropriate government in this regard, along with the application.",
      ],
      [
        "Will I be informed about the additional fee (if any) is required to pay?",
        "In case additional fee representing the cost is required for providing information, the CPIO will intimate the same, which can be viewed by the applicant through \"View Status\" option in the RTI Online Portal and an e-mail alert or SMS or both will also be sent to the applicant for the same. For payment of additional fee online, the applicant needs to use the option 'View Status' in the RTI Online Portal and on providing the registration number of the request, option for \"Make Payment\" will be available.",
      ],
      [
        "What should I do if amount is deducted from my account but registration number is not generated?",
        "Use \"Payment Reconciliation\" feature Please do not attempt to make payment repeatedly or try to submit request once again. Kindly wait for the 24 to 48 working hours as registration number will be generated after reconciliation. If it is not generated within stipulated time frame then kindly send an e-mail at helprtionline-dopt[at]nic[dot]in with your transaction details. However, in cases of unsuccessful RTI payment requests, if the requester wishes to check the payment status before 48 hours, it can be verified using the \"Payment Reconciliation\" feature.",
      ],
      [
        "What if the Registration Number is not received on my Email or Mobile No. even after 48 working Hours?",
        "Registration Number are generated after reconciliation of bank scrolls for cases whose numbers are not generated instantly after the payment. This procedure may take 24 to 48 working hours. If someones still does not receive the Registration Number, They may contact their respective bank for refund of amount.",
      ],
      [
        "What are the reasons for my RTI payment failing?",
        "The major reasons for failure are due to Business declines, Business Decline are as under: 1. Customer has set e-Commerce flag as Disabled for Debit / Credit Card. 2. Customer either closed the internet browser or not proceeded further with the transaction resulting into session timeout. 3. Wrong OTP or no OTP entered by customer. 4. Wrong details of cards entered by customers like Card No, CVV, expiry date. 5. Insufficient balance in customer's account. 6. Customer cancelled the transaction and reinitiated with different mode of payment (say from Debit card to UPI etc.). 7. Customer received collect request for payment in UPI app, but not completed the payment within time limit.",
      ],
    ],
  },
  {
    icon: "gavel",
    title: "Appeals",
    items: [
      [
        "How do I file an appeal with First Appellate Authority?",
        "For making an appeal to the first Appellate Authority, the applicant has to select the option \"Submit First Appeal\" in the RTI Online Portal and fill up the form that will appear. The registration number and e-mail ID of the original application is required for filing the first appeal.",
      ],
      [
        "Do I need to make any payment for filing an appeal?",
        "As per RTI Act, no fee has to be paid for first appeal.",
      ],
      [
        "What should I do when portal is not allowing me to file the first appeal?",
        "This may happen under following two situation: 1) When your RTI application has been physically transferred to other public authority, which is not aligned to this portal. In such a case, you are required to file your appeal in physical mode to the concerned public authority. 2) Another case can be if your RTI application has not been replied to by CPIO and 30 days period has not lapsed. In such a case, you may file first appeal only after completion of stipulated time period of 30 days.",
      ],
      [
        "Can I file online first appeal for any RTI application filed physically in the first place ?",
        "No,Online first appeal can only be filed against previously filed online RTI application.",
      ],
      [
        "If the RTI application is filed manually , then is it possible to file 1st appeal on line?",
        "Manual applications can be lodged into RTI Online portal by CPIOs and can be disposed off by CPIO online. In this context, if applicant provides email id/Mobile No. in the application form and CPIO lodges this RTI application in the portal , then the actions taken by CPIO will be conveyed to applicant automatically through e-mail and Mobile SMS. Then applicant can file 1st appeal with the help of registration number conveyed .",
      ],
    ],
  },
  {
    icon: "manage_search",
    title: "Status, Receipts & Account History",
    items: [
      [
        "Do I get any receipt for online filing of RTI application?",
        "On submission of an application, a unique registration number will be issued, which may be referred by the applicant for any future reference. It may be noted that the application filed through this RTI Online Portal will reach electronically to the \"Nodal Officer\" of the said Ministry/Department and \"Not\" to the CPIO of the concerned Ministry/Department. The Nodal Officer will transmit the RTI application electronically to the concerned CPIO.",
      ],
      [
        "Do I get any SMS from RTI Online Portal?",
        "Though optional, the mobile number can be provided by the applicant/ appellant in order to receive SMS alerts.",
      ],
      [
        "What can I do if I forgot my login credentials?",
        "You can go to View History column to see your past RTI requests/appeals.",
      ],
      [
        "How much time RTI request/appeal retain at this portal?",
        "In the View History/View Status citizen can see RTI Cases retained for a period of 3 years.",
      ],
      [
        "Why RTI application filed by me is not reflecting in my user account history?",
        "If you have opted to file RTI or First Appeal directly i.e without logging into your user account, then in such cases you will not be able to see the filed RTI or Appeal in your registered account's history. However you can always check its status in \"View Status\" with the provided Reg. Nos.",
      ],
      [
        "Why I have received multiple RTI registration numbers, even though I have filed single RTI application ?",
        "This is the case where in your RTI application has been forwarded to multiple CPIOs since the information sought lies with more than one PIO.",
      ],
      [
        "How can I View Status/Reply of my RTI Application or First Appeal?",
        "Status/Reply of the RTI Application or First appeal filed online can be viewed by the applicant by clicking on \"View Status\".",
      ],
      [
        "Why this OTP feature is introduced in view status option?",
        "RTI Application may contain personal information of the Applicant and if any third person gets the registration number and email id, then the person can view this personal information. So, in order to protect personal information of the applicant, according to cyber security norms, this OTP validating feature has been introduced. In view status option while OTPs are promptly dispatched from the NIC email domain, delays may occasionally occur due to high traffic on either NIC server or external email services like Gmail or Yahoo. Importantly, OTPs do not expire until they are used, meaning users can access the status of their applications as soon as the OTP arrives.",
      ],
    ],
  },
  {
    icon: "support_agent",
    title: "Documents, Help & Troubleshooting",
    items: [
      [
        "How to upload a supporting document if an alert comes as \"SUPPORTING DOCUMENTS REQUIRED FROM APPLICANT\"?",
        "When a Public Authority request for supporting document, an alert is sent to the applicant to his/her Mobile or Email Id. In such situation, the applicant is requested to visit the RTI Online Website and enter the details in 'View Status'. Once the detail is entered, the current status of the RTI application is shown along with the option for uploading the supporting document.",
      ],
      [
        "What queries can be raised with Helpline Email helprtionline-dopt(at)nic(dot)in ?",
        "Helpline mail id is exclusively meant for queries or problem being faced while filing the online RTI through this portal. Please do not send mail to this helpline for any other matter or asking for any other details. The reply is limited to RTI online portal of Central Government only.",
      ],
      [
        "What should I do when my browser show certificate error while opening RTI online portal?",
        "You should ignore the certificate error and proceed forward. Kindly select, Mozilla Firefox - I understand the risk add exception. Google Chrome - Proceed Anyway. Internet Explorer - Continue to this website",
      ],
    ],
  },
]

export function FaqPage() {
  const [query, setQuery] = useState("")

  const filteredSections = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    if (!normalizedQuery) {
      return sections
    }

    return sections
      .map((section) => {
        const matchesSection = section.title.toLowerCase().includes(normalizedQuery)
        const items = section.items.filter(([question, answer]) => {
          return (
            matchesSection ||
            question.toLowerCase().includes(normalizedQuery) ||
            answer.toLowerCase().includes(normalizedQuery)
          )
        })

        return { ...section, items }
      })
      .filter((section) => section.items.length > 0)
  }, [query])

  const resultCount = filteredSections.reduce(
    (total, section) => total + section.items.length,
    0
  )

  return (
      <div className="mx-auto w-full max-w-container-max space-y-stack-lg px-margin-mobile py-stack-lg md:px-margin-desktop">
        <section className="mx-auto max-w-3xl space-y-stack-md text-center">
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-primary md:text-display-lg">Frequently Asked Questions</h1>
          <p className="font-body-lg text-on-surface-variant">Find answers to common questions about filing Right to Information requests online.</p>
          <div className="relative mt-stack-md">
            <MaterialIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-outline">search</MaterialIcon>
            <input
              aria-label="Search FAQs"
              className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest py-3 pl-12 pr-4 font-body-md shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search FAQs..."
              type="search"
              value={query}
            />
          </div>
          {query.trim() && (
            <p className="font-body-md text-sm text-on-surface-variant">
              Showing {resultCount} result{resultCount === 1 ? "" : "s"} for "{query.trim()}"
            </p>
          )}
        </section>

        <section className="grid grid-cols-1 gap-gutter lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-gutter">
            {filteredSections.length === 0 && (
              <div className="rounded-lg border border-surface-variant bg-surface-container-lowest p-stack-lg text-center">
                <MaterialIcon className="mb-3 text-3xl text-muted-foreground">search_off</MaterialIcon>
                <h2 className="font-headline-md text-headline-md text-foreground">No FAQs found</h2>
                <p className="mt-2 font-body-md text-on-surface-variant">
                  Try searching for payment, appeal, status, public authority, OTP, or supporting document.
                </p>
              </div>
            )}
            {filteredSections.map((section) => (
              <div className="rounded-lg border border-surface-variant bg-surface-container-lowest p-stack-md md:p-stack-lg" key={section.title}>
                <div className="mb-stack-md flex items-center space-x-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-muted text-foreground">
                    <MaterialIcon>{section.icon}</MaterialIcon>
                  </div>
                  <h2 className="font-headline-md text-headline-md text-foreground">{section.title}</h2>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {section.items.map(([question, answer], index) => {
                    const isOddLastItem =
                      section.items.length % 2 === 1 && index === section.items.length - 1

                    return (
                    <article className={isOddLastItem ? "rounded-DEFAULT border border-surface-variant bg-surface p-4 md:col-span-2" : "rounded-DEFAULT border border-surface-variant bg-surface p-4"} key={question}>
                      <div className="mb-2 flex items-start gap-3">
                        <MaterialIcon className="mt-0.5 text-muted-foreground">help</MaterialIcon>
                        <h3 className="font-body-md text-body-md font-semibold text-on-surface">{question}</h3>
                      </div>
                      <p className="pl-8 font-body-md text-on-surface-variant">{answer}</p>
                    </article>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          <aside className="space-y-gutter lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-lg bg-primary p-stack-md text-primary-foreground">
              <h3 className="mb-stack-sm font-headline-md text-headline-md text-primary-foreground">Need Help?</h3>
              <p className="mb-stack-md font-body-md opacity-90">If you cannot find the answer you are looking for, contact our support desk.</p>
              <Link className="block w-full rounded-DEFAULT border border-primary-foreground/20 bg-primary-foreground py-2 text-center font-label-lg text-primary transition-colors hover:bg-primary-foreground/90" to="/contact-us">Contact Support</Link>
            </div>
            <div className="rounded-lg border border-surface-variant bg-surface-container-lowest p-stack-md">
              <h4 className="mb-2 font-headline-md text-headline-md text-foreground">User Manual</h4>
              <p className="mb-4 font-body-md text-on-surface-variant">Download the comprehensive guide for using the RTI Online portal.</p>
              <a className="inline-flex items-center font-label-lg text-foreground hover:underline" download href="/rti-online-user-manual.pdf">Download PDF <MaterialIcon className="ml-1 text-sm">download</MaterialIcon></a>
            </div>
          </aside>
        </section>
      </div>
  )
}
