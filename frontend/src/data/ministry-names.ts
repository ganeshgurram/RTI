/**
 * Ministries that own departments in the directory but have no row of their own. The portal
 * list contains only authorities an RTI can actually be filed against, so these parents are
 * referenced by parentId and nothing else. Naming them keeps sibling departments in one group
 * rather than scattering them through the D's - a ministry is not a filing target.
 *
 * Shared because three places need the same mapping and had drifted into three copies: the
 * directory page, the request form's grouping, and the recommender's group resolution. A name
 * corrected in one copy but not the others silently disagreed about which office sits where.
 */
export const ministryNames: Record<string, string> = {
  "9": "Ministry of Agriculture & Farmers Welfare",
  "16": "Ministry of Chemicals & Fertilizers",
  "22": "Ministry of Commerce & Industry",
  "26": "Ministry of Communications",
  "30": "Ministry of Consumer Affairs, Food & Public Distribution",
  "33": "Ministry of Defence",
  "41": "Ministry of Finance",
  "46": "Ministry of Health & Family Welfare",
  "50": "Ministry of Heavy Industries & Public Enterprises",
  "65": "Ministry of Law & Justice",
  "74": "Ministry of Personnel, Public Grievances & Pensions",
  "87": "Ministry of Science & Technology",
}
