const TABLE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

const getRandomElementFromList = function(items){
    return items[Math.floor(Math.random()*items.length)];
};

const sleep = function (ms) {
    console.log("sleep called for", ms/1000);
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
};

function randomIntFromInterval(min, max) { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min)
}

function randomCoordsFromIntervals(arr1, arr2) {
    return [randomIntFromInterval(arr1[0], arr1[1]), randomIntFromInterval(arr2[0], arr2[1])]
}

function random_item_from_list(ls){
    return ls[Math.floor((Math.random() * ls.length))];
};

function generateUule(location){
      const len = location.length;
      const key = TABLE[len];
      return (
        'w+CAIQICI' + key + Buffer.from(location, 'ascii').toString('base64')
      );
    };

exports.sleep = sleep;
exports.getRandomElementFromList = getRandomElementFromList;
exports.randomIntFromInterval = randomIntFromInterval;
exports.randomCoordsFromIntervals = randomCoordsFromIntervals;
exports.random_item_from_list = random_item_from_list;
exports.generateUule = generateUule
