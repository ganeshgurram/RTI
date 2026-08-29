/**
 * The 28 States and 8 Union Territories, as notified after the 2019-20 reorganisations - Jammu and
 * Kashmir and Ladakh split, and Dadra and Nagar Haveli merged with Daman and Diu.
 *
 * Shared because three forms ask for the same field: the RTI request, the first appeal and the
 * profile. They previously kept their own lists and only the profile was complete, so an applicant
 * from anywhere outside four states could not file at all.
 */
export const indianStates = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
] as const

export const indianUnionTerritories = [
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
] as const

/** Flat list for the searchable profile picker, which groups nothing and filters by substring. */
export const indianStatesAndTerritories: readonly string[] = [
  ...indianStates,
  ...indianUnionTerritories,
]
