function isJson(str) {
    if(!str){
        return false
    }
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

module.exports = {
    isJson: isJson
}