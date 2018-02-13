# Winning With Containers Manager Reporting App Development

This is the dashboard app for learning map applications specifically for WWC project. This is *only* the dashboard code, not the deployment package.

**Ensure that the options in config.json match that of the corresponding learning map application**

API Keys and full configuration are located in the config.json file which is *not* included in this repo.

---

Static assets for the front end are `front/www/*` and all app development files are located in `front/app/*`.
On build, the `front/www/js/app` directory is cleaned and new code is bundled there.

JS Entry point is `front/app/index.js`
SASS is `front/app/index.sass`

## Dashboard source

https://gitlab.cee.redhat.com/mperkins/mwc-manager-report

## Building

Utilizing docker-compose

### For development:
docker-compose -f docker-compose-dev.yml [build | up | stop]

Web server will be on localhost:3000

### For building:
docker-compose -f docker-compose-build.yml [build | up | stop]

## Notes

- When the application start, it will try to load ./front/www/config.json for special configuration options for the running app. If there is a problem, a warning will appear in the log and the app will try to run normally.

# Deployment

1. Update dashboard (this project) as needed
2. Build the project
3. Copy front/www to the deploy project's front/www
4. Push changes to https://gitlab.cee.redhat.com/mperkins/mwc-manager-report-app
5. Trigger new build in OpenShift env, dev (stage) or prod