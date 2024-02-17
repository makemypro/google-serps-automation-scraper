const celery = require('celery-node');
const utils = require("../utils.js");

async function triggerJob() {
    // start a new job
    let celery_broker_url = process.env.CELERY_BROKER_URL

    const celery_client = celery.createClient(celery_broker_url, celery_broker_url);
    console.log('Client Successfully connected with ', celery_broker_url);

    const task = celery_client.createTask("app.tasks.add_job");
    console.log('Successfully created a task object');

    await task.applyAsync([process.env.JOB_ID, process.env.JOB_NAME])
    await utils.sleep(5000)
    console.log(`Process completed with job ID: ${process.env.JOB_ID}`)
    process.exit()
}

triggerJob()