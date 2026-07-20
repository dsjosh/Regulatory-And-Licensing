# Scope

## Reasons for choosing this Tech Stack

- Python 3.14.6
- React 19.2.7
- Tailwind v4.3.3
- SQLite 3

The reason I chose this stack is because I'm time-constrained to finish this assignment in 3 days. Python is one of the backend languages with the most online references and React is also extremely popular as a frontend framework. Hence I figured I can get things done fast with online references if I used such popular languages.

The choice of SQLite for database is a conscious decision for the ease of running this on other machines if anyone reviewed my submission - so that they didnt have to do time-consuming installations. Of course I'm aware that SQLite is not ideal for production.

## What I built
- Use Case 3 (On-Site Assessment & Post-Site Clarification)
- Working:
  - Officer can access full checklist
  - Officer can input comments per checklist item
  - Officer can save as draft
  - Officer can mark individual items as "Need Further Clarification"
  - Operator does not see full checklist
  - Operator sees only items flagged for clarification
  - Operator sees the officer’s comment per flagged item
  - Operator can respond to each item and upload supporting documents
  - Multiple clarification rounds are supported per checklist item
  - Each item maintains a full audit trail: comments, responses, timestamps
  - Operators cannot see the internal approval stage at any point
  - Operators see only the final outcome: Approved or Rejected

## What I deferred
 - Use Case 1 (Operator Application Submission & Resubmission)
 - Use Case 2 (Officer Application Review & Feedback)

## What I assumed

 - I have assumed that officer will only create a new inspection flow once the site visit is scheduled. Right now there are no checks to ensure the visit is indeed scheduled since I have not implemented the scheduling of the system, but I have just assumed the visit is scheduled so that I could implement Use Case 3.
 - I have assumed that if all the items in the checklist passes, then the inspection will pass.

## What I mocked
 - For the inspection checklist, I mocked some points which are relevant for on-prem datacentre hosting in case the operator is hosting the application there.

