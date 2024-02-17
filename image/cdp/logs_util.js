var request = require('request');
const { v4: uuidv4 } = require('uuid');
var fs = require('fs');

qp_base_url = 'https://quantumpuppy.com'


async function add_session_logs(type, uuid = null) {
  return new Promise((resolve, reject) => {
    if (!uuid) {
      uuid = uuidv4(); // Assign the generated UUID to the 'uuid' variable
    }

    var url = `${qp_base_url}/star-destroyer/session/`;
    var body = JSON.stringify({ 'type': type, 'uuid': uuid });
    var headers = { 'Content-Type': 'application/json' };
    if (process.env.ENV != 'DEV') {
        request.post({ url: url, body: body, headers: headers }, function(err, httpResponse, data) {
          resolve(uuid);
        });
    } else {
      resolve();
    }
  });
}


async function add_job_logs(type, actions, session) {
  return new Promise((resolve, reject) => {
    const uuid = uuidv4();
    var url = `${qp_base_url}/star-destroyer/job/`
    var body = JSON.stringify({'type': type, 'actions': actions, 'uuid': uuid, 'session_uuid': session})
    var headers = {'Content-Type': 'application/json'}
    if (process.env.ENV != 'DEV') {
        console.log("Sending job logs to QP..")
        request.post({url: url, body: body, headers: headers}, function(err, httpResponse, data) {
          resolve(data);
        });
    } else {
      resolve();
    }
  });
}

async function get_job() {
  return new Promise((resolve, reject) => {
    var url = `${qp_base_url}/star-destroyer/brand-defense-queue/get/`
    var headers = {'Content-Type': 'application/json'}
    console.log("Getting job...")
    request.get({url: url, headers: headers}, function(err, httpResponse, data) {
      resolve(JSON.parse(data));
    });
  });
}

async function mark_job_as_completed(actions, job_id, imageData, htmlContent, fingerPrintData) {
  var base64Image = null
  var base64fingerprint = null
  if (imageData) {
    base64Image = imageData.data
  }
  if (fingerPrintData) {
    base64fingerprint = fingerPrintData.data
  }
  actions = JSON.parse(actions)
  let payload = {'actions': actions,}
  if (base64Image){
    payload['screenshot'] = base64Image
  }
  if (htmlContent){
    payload['html_content'] = htmlContent
  }

  if (base64fingerprint) {
    payload['fingerprint'] = base64fingerprint
  }
  return new Promise((resolve, reject) => {
    var url = `${qp_base_url}/star-destroyer/brand-defense-queue/${job_id}/complete/`
    var body = JSON.stringify(payload)
    var headers = {'Content-Type': 'application/json'}
    console.log("marking job as completed...")
    request.post({url: url, body: body, headers: headers}, function(err, httpResponse, data) {
      console.log("response here", data)
      resolve();
    });
  });
}

async function mark_job_as_failed(actions, job_id, imageData, htmlContent, fingerPrintData) {
  var base64Image = null
  var base64fingerprint = null
  if (imageData) {
    base64Image = imageData.data
  }
  if (fingerPrintData) {
    base64fingerprint = fingerPrintData.data
  }
  let payload = {'actions': actions,}
  if (base64Image){
    payload['screenshot'] = base64Image
  }
  if (htmlContent){
    payload['html_content'] = htmlContent
  }
  if (base64fingerprint) {
    payload['fingerprint'] = base64fingerprint
  }
  return new Promise((resolve, reject) => {
    var url = `${qp_base_url}/star-destroyer/brand-defense-queue/${job_id}/failed/`
    var body = JSON.stringify(payload)
    var headers = {'Content-Type': 'application/json'}
    console.log("marking job as failed...")
    request.post({url: url, body: body, headers: headers}, function(err, httpResponse, data) {
      console.log("response here", data)
      resolve();
    });
  });
}

async function get_gmb_job() {
  return new Promise((resolve, reject) => {
    var url = `${qp_base_url}/star-destroyer/google-maps-campaign-queue/get/`
    var headers = {'Content-Type': 'application/json'}
    console.log("Getting job...")
    request.get({url: url, headers: headers}, function(err, httpResponse, data) {
      resolve(JSON.parse(data));
    });
  });
}

async function mark_gmb_job_as_completed(actions, job_id, imageData, htmlContent) {
  var base64Image = null
  if (imageData) {
    base64Image = imageData.data
  }
  actions = JSON.parse(actions)
  let payload = {'actions': actions,}
  if (base64Image){
    payload['screenshot'] = base64Image
  }
  if (htmlContent){
    payload['html_content'] = htmlContent
  }
  return new Promise((resolve, reject) => {
    var url = `${qp_base_url}/star-destroyer/google-maps-campaign-queue/${job_id}/complete/`
    var body = JSON.stringify(payload)
    var headers = {'Content-Type': 'application/json'}
    console.log("marking job as completed...")
    request.post({url: url, body: body, headers: headers}, function(err, httpResponse, data) {
      console.log("response here", data)
      resolve();
    });
  });
}

async function mark_gmb_job_as_failed(actions, job_id, imageData, htmlContent) {
  var base64Image = null
  if (imageData) {
    base64Image = imageData.data
  }
  let payload = {'actions': actions,}
  if (base64Image){
    payload['screenshot'] = base64Image
  }
  if (htmlContent){
    payload['html_content'] = htmlContent
  }
  return new Promise((resolve, reject) => {
    var url = `${qp_base_url}/star-destroyer/google-maps-campaign-queue/${job_id}/failed/`
    var body = JSON.stringify(payload)
    var headers = {'Content-Type': 'application/json'}
    console.log("marking job as failed...")
    request.post({url: url, body: body, headers: headers}, function(err, httpResponse, data) {
      console.log("response here", data)
      resolve();
    });
  });
}

async function get_backlink_job() {
  return new Promise((resolve, reject) => {
    var url = `${qp_base_url}/star-destroyer/backlink-campaign-queue/get/`
    var headers = {'Content-Type': 'application/json'}
    console.log("Getting job...")
    request.get({url: url, headers: headers}, function(err, httpResponse, data) {
      resolve(JSON.parse(data));
    });
  });
}

async function mark_backlink_job_as_completed(actions, job_id, imageData, htmlContent) {
  var base64Image = null
  if (imageData) {
    base64Image = imageData.data
  }
  actions = JSON.parse(actions)
  let payload = {'actions': actions,}
  if (base64Image){
    payload['screenshot'] = base64Image
  }
  if (htmlContent){
    payload['html_content'] = htmlContent
  }
  return new Promise((resolve, reject) => {
    var url = `${qp_base_url}/star-destroyer/backlink-campaign-queue/${job_id}/complete/`
    var body = JSON.stringify(payload)
    var headers = {'Content-Type': 'application/json'}
    console.log("marking job as completed...")
    request.post({url: url, body: body, headers: headers}, function(err, httpResponse, data) {
      console.log("response here", data)
      resolve();
    });
  });
}

async function mark_backlink_job_as_failed(actions, job_id, imageData, htmlContent) {
  var base64Image = null
  if (imageData) {
    base64Image = imageData.data
  }
  let payload = {'actions': actions,}
  if (base64Image){
    payload['screenshot'] = base64Image
  }
  if (htmlContent){
    payload['html_content'] = htmlContent
  }
  return new Promise((resolve, reject) => {
    var url = `${qp_base_url}/star-destroyer/backlink-campaign-queue/${job_id}/failed/`
    var body = JSON.stringify(payload)
    var headers = {'Content-Type': 'application/json'}
    console.log("marking job as failed...")
    request.post({url: url, body: body, headers: headers}, function(err, httpResponse, data) {
      console.log("response here", data)
      resolve();
    });
  });
}

exports.add_job_logs = add_job_logs
exports.add_session_logs = add_session_logs
exports.get_job = get_job
exports.mark_job_as_completed = mark_job_as_completed
exports.mark_job_as_failed = mark_job_as_failed
exports.get_gmb_job = get_gmb_job
exports.mark_gmb_job_as_completed = mark_gmb_job_as_completed
exports.mark_gmb_job_as_failed = mark_gmb_job_as_failed
exports.get_backlink_job = get_backlink_job
exports.mark_backlink_job_as_completed = mark_backlink_job_as_completed
exports.mark_backlink_job_as_failed = mark_backlink_job_as_failed
