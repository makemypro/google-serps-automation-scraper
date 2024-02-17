class SearchSession {
    fields = {
        keyword: null,
        top_ads: null,
        paid_blocklist: null,
        organic_target: null,
        organic_target_wait_seconds: null,
        organic_max_page: 1,
        num: null,
        max_organic_serp_position_click_limit: null,
        chance_to_open_competitor: 0,
        screenshot_data: null,
        html_content: null,
        ts: null,
        paid_results: null,
        organic_results: null,
        actions: [],
        ip_address: null,
        job_id: null,
        actions: [],
        should_pogo_click: null,
        location: null,
        fingerprint: null
    };

    fill(newFields) {
        for(var field in this.fields) {
            if(this.fields[field] !== 'undefined') {
                this.fields[field] = newFields[field];
            }
        }
    }

    onStart(){
        this.fields.ts = Math.floor(Date.now()/1000);
    }
    setOrganicResults(results){
        this.fields.organic_results = results;
    }
    setPaidResults(results){
        this.fields.paid_results = results;
    }

    getScreenshotName() {
        return `${this.fields.keyword}.png`;
    }

    setScreenshotData(data){
        this.fields.screenshot_data = data;
    }

    addAction(action){
        this.fields.actions.push(action);
    }
};

class YoutubeSession {
    fields = {
        youtube_target: null,
        screenshot_data: null,
        actions: [],
        ts: null,
    };

    fill(newFields) {
        for(var field in this.fields) {
            if(this.fields[field] !== 'undefined') {
                this.fields[field] = newFields[field];
            }
        }
    }

    onStart(){
        this.fields.ts = Math.floor(Date.now()/1000);
    }

    getScreenshotName() {
        return 'yt.png';
    }

    setScreenshotData(data){
        this.fields.screenshot_data = data;
    }

    addAction(action){
        this.fields.actions.push(action);
    }
};

class GoogleMapsSession {
    fields = {
        coords: null,
        keyword: null,
        target_id: null,
        screenshot_data: null,
        actions: [],
        ts: null,
        job_id: null,
        html_content: null,
        zoom: null
    };

    fill(newFields) {
        for(var field in this.fields) {
            if(this.fields[field] !== 'undefined') {
                this.fields[field] = newFields[field];
            }
        }
    }

    onStart(){
        this.fields.ts = Math.floor(Date.now()/1000);
    }

    getScreenshotName() {
        return `${this.fields.keyword}-${this.fields.target_url}.png`;
    }

    setScreenshotData(data){
        this.fields.screenshot_data = data;
    }

    addAction(action){
        this.fields.actions.push(action);
    }
};

class backlinkSession {
    fields = {
        direct_url: null,
        screenshot_data: null,
        html_content: null,
        target_domain: null,
        organic_target_wait_seconds: null,
        job_id: null
    };

    fill(newFields) {
        for(var field in this.fields) {
            if(this.fields[field] !== 'undefined') {
                this.fields[field] = newFields[field];
            }
        }
    }

    onStart(){
        this.fields.ts = Math.floor(Date.now()/1000);
    }

    getScreenshotName() {
        return `${this.fields.organic_target_wait_seconds}-${this.fields.target_domain}.png`;
    }

    setScreenshotData(data){
        this.fields.screenshot_data = data;
    }

    addAction(action){
        this.fields.actions.push(action);
    }
};


exports.SearchSession = SearchSession;
exports.YoutubeSession = YoutubeSession;
exports.GoogleMapsSession = GoogleMapsSession;
exports.backlinkSession = backlinkSession;

exports.newSearchSession = function(data){
    let obj = new SearchSession();
    obj.fill(data);
    return obj;
};

exports.newYoutubeSession = function(data){
    let obj = new YoutubeSession();
    obj.fill(data);
    return obj;
};

exports.newGoogleMapsSession = function(data){
    let obj = new GoogleMapsSession();
    obj.fill(data);
    return obj;
};

exports.newSessionObj = function(klass, data){
    let obj = new klass();
    obj.fill(data);
    return obj;
}

exports.newBacklinkSession = function(data){
    let obj = new backlinkSession();
    obj.fill(data);
    return obj;
}
