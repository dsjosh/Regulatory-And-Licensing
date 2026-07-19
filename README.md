# Regulatory-And-Licensing
This is a Regulatory And Licensing (RAL) web application.

## Scope
Please refer to "[SCOPE.md](SCOPE.md)" file for the explanation on what I built, what I deferred, and the reasons behind it.

## Stack
- Python 3.14.6
- Node v26.5.0
- React
- Vite
- Typescript
- Tailwind v4
- SQLite 3

## AI Usage
TODO

## What I would do next
TODO

## Pre-requisites
- Install Python 3.14.6
- Install python packages using the command "pip install -r requirements.txt" inside the backend folder
- Create a blank database with RAL schema using the "create_db.py" in the backend folder
  - Optionally create and fill up "load_db.txt" file using the example file provided in the backend folder to create a database with data
- Create the "env.txt" file using the example file provided in the backend folder

## Starting the application
Just one line - "python .\backend\main.py"

## Commits
Do a "npm run format" in the frontend folder at the end of every frontend change commit

## Deployment
Before starting the deployment pipeline, do the following in a staging folder on the preprod machine:
- Copy over the entire code to the staging folder
- In the staging frontend folder, do a "npm run build" inside
- In the staging backend folder, edit "main.py" and hardcode the "startup_choice" variable to "n".
- In the staging frontend folder, delete all contents except the "dist" sub-folder.
- Start the deployment pipeline with source as the staging folder (not the original code folder)
