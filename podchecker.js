#! /usr/bin/env node


'use strict';

var   fs          = require('fs'),
      lineReader  = require('line-reader'),
      request     = require('request'); //TODO Replace

function printUsage() {
  console.log("usage");
  process.exit(2);
}


function getPodsInstalled(filename, cb) {
  var array = [];
  var reachedDependencies = false;

  lineReader.eachLine(filename, function(line, last) {

    if (line.indexOf("DEPENDENCIES:") == 0) {
      reachedDependencies = true;
      return;
    }

    if (reachedDependencies) {   

      var re = /^\s*- +(\w*) \((.*)\)$/; 
      var m;

      if ((m = re.exec(line)) !== null) {
        var podName = m[1], versionString = m[2];

        var reVersion = /^.*?(\d(?:\.\d){0,2})$/;
        var mVersion;
        var podVersion = null;
        if ((mVersion = reVersion.exec(versionString)) !== null) {
          podVersion = mVersion[1];
        }

        array.push({ 
          name: podName,
          versionInstalled: podVersion
        });
      }
    }

    if (reachedDependencies && line.length == 0) {
      return false;
    }
  }).then(function () {
    cb(array);
  });

}

/* Program start */

console.log(process.argv);


if (process.argv.length < 3) {
  printUsage();
}

var filename = process.argv[2]
var stat = fs.statSync(filename);

if (!stat.isFile()) {
  console.log("not a file");
  printUsage();
}

getPodsInstalled(filename, function(pods) {
  console.log(pods);

  pods.forEach(function(pod){
    var url = 'https://search.cocoapods.org/api/v1/pods.flat.hash.json?query=name%3A'+pod.name+'&ids=20&offset=0';

    request(url, {json: true}, function (error, response, data) {
      if (!error && response.statusCode == 200) {
        
        console.log(pod.name+': '+data[0].version + '(' + pod.versionInstalled + ' installed)');
      }
    })
  });
});








