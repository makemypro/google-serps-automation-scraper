

exports.checkDevicePublicIpAddress = function(){
    // This function checks the device's public IP
    // Important to know which IP address is being used to perform searches on Google in our logs
    url = "https://checkip.amazonaws.com";
    return axios.get(url).data;
};

exports.cycleIpAddress = function(){
    // This function communicates to the proxy that the IP address should be cycled, needs to be changed.
    // Once we're done a set of tasks and its time to move onto a new IP address, this function is called so we
    // can start a new search session from a new IP.
    url = "https://checkip.amazonaws.com";
    return axios.get(url).data;
};

