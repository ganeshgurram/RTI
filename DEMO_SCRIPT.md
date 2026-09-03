# RTI Online Redesign - 2-Minute Demo Script

## 0:00-1:00 - Citizen product demo

"Imagine I am a citizen who needs information from a Central Government authority. The home page immediately gives me clear paths: find an authority, submit an RTI request, view status, reconcile a payment, or file an appeal.

I can sign up, sign in, or begin with DigiLocker. My profile keeps useful details available so the request form can prefill relevant information instead of making me type it repeatedly.

I do not know which department holds my information, so I search the Public Authorities directory by topic. I review likely matches, choose an authority, and go directly to the RTI form with that authority already selected. The form guides the request text, supporting-document option, payment methods, and payment-reconciliation path.

RTI Sahayak helps me understand the process and suggests relevant departments. It never asks for personal information, registration numbers, OTPs, Aadhaar, passwords, payment details, or documents. I can switch between English and Hindi, and even earlier chatbot messages translate with the rest of the portal, so I never lose my conversation.

The same smooth journey includes secure status tracking, First Appeal, and Second Appeal routes."

## 1:00-2:00 - How and why we built it

"We did not change the RTI process itself. We focused on the friction around it: unclear next steps, difficulty choosing the right authority, repetitive forms, language barriers, and fear of exposing sensitive details.

The prototype is built with Vite, React, TypeScript, React Router, Tailwind CSS, and reusable accessible components. Its responsive journeys make important actions visible instead of making citizens infer what comes next.

For an honest demo, authentication, requests, payments, notifications, and status use clearly labelled mock data. We never claim access to real government accounts, applications, payment records, or case data.

Privacy is built into RTI Sahayak. Sensitive-data checks run before a chat message is sent and again on the server route. The assistant gives only general portal guidance, does not offer legal advice, and falls back to local guidance if AI is unavailable.

The result is a detailed, bilingual, privacy-aware experience that makes RTI filing feel calmer, clearer, and more actionable for citizens."
