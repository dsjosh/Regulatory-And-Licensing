# Regulatory-And-Licensing
Regulatory And Licensing (RAL)

## Stack
- Python 3.14.6
- Node v26.5.0
- React
- Vite
- Typescript

## Starting the application
Just one line - "python .\backend\main.py"

## Commits
Do a "npm run format" at the end of every frontend change commit

## Deployment
Before starting the deployment pipeline, do the following in a staging folder on the preprod machine:
- Copy over the entire code to the staging folder
- In the staging frontend folder, do a "npm run build" inside
- In the staging backend folder, edit "main.py" and hardcode the "startup_choice" variable to "n".
- In the staging frontend folder, delete all contents except the "dist" sub-folder.
- Start the deployment pipeline with source as the staging folder (not the original code folder)
