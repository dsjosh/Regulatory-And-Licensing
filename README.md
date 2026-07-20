# Regulatory-And-Licensing
This is a Regulatory And Licensing web application.

## Scope
Please refer to "[SCOPE.md](SCOPE.md)" file for the explanation on what I built, what I deferred, and the reasons behind it.

## Stack
- Python 3.14.6
- React 19.2.7
- Tailwind v4.3.3
- SQLite 3

## AI Usage
I have used AI for the follwing:
- Used ChatGPT
  - Generating the tailwind parts of the code since manual UI adjustment requires a lot of trial-and-error.
    - Prompts like "I need the username on the navbar for logged-in users"
    - AI does reduce the trial-and-error needed for UI programming, but there are still errors. For example, the original header in the Home page was cropped. I had to add "leading-normal" class to the css to make it not cropped.
  - Generating the "create_db.py" because it's for one-time use and technically not part of the application. It's included in the project only so that the testing experience is improved.
    - Prompts like "I need a Python SQLite database initialization script that recreates the database, imports SQL from a seed file, and logs each step."
    - AI did surprisingly well for this and I got quality code with only a few revisions.

## What I would do next
I have only focused on Use Case 3 (On-Site Assessment & Post-Site Clarification) for this submission. So I would do the following use cases next if I were to do enhancement on this:
 - Use Case 1 (Operator Application Submission & Resubmission)
 - Use Case 2 (Officer Application Review & Feedback)

## Pre-requisites (for testing)
- Install Python 3.14.6
- Install python packages using the command "pip install -r requirements.txt" in the backend folder
- Install Node v26.5.0
- Install node modules using "npm install" in the frontend folder
- Create a blank database with application schema using the "create_db.py" in the backend folder
  - Optionally create and fill up "load_db.txt" file using the example file provided in the backend folder to create a database with data
- Create the "env.txt" file using the example file provided in the backend folder

## Starting the application
Just one line - "python .\backend\main.py"

## Commits
Do a "npm run format" in the frontend folder at the end of every frontend change commit to beautify code.

## Deployment (for prod, not for testing)
Before starting the deployment pipeline, do the following in a staging folder on the preprod machine:
- Copy over the entire code to the staging folder
- In the staging frontend folder, do a "npm run build" inside
- In the staging backend folder, edit "main.py" and hardcode the "startup_choice" variable to "n".
- In the staging frontend folder, delete all contents except the "dist" sub-folder.
- Start the deployment pipeline with source as the staging folder (not the original code folder)
