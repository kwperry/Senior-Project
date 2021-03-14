# Senior-Project

# How to deploy on Heroku

You have two options to start

1. Start this process through the Heroku CLI
2. Start this process through Github

## Heroku CLI

First, install Heroku CLI:
- This is the link to do so: https://devcenter.heroku.com/articles/heroku-cli

Next, login:

`$ heroku login`

Make sure you have this repository on your machine and the most up to date version

`$ cd Senior-Project`
`$ git pull`

Then you would commit your new changes and push to heroku

`$ git add .`
`$ git commit -am "New commit"`
`$ git push heroku master`

Or you can just add this to link to the remote repository and push to it

`$ heroku git:remote -a senior-project-big-pivot`

## Github

You can use the GUI available to choose the repository under your github username and have it connect to that repository.
This will enable code diffs and deploy the application instantaniously.

# YOU'RE DONE!!!!