#! /usr/bin/env node


'use strict';

var   _           = require('underscore'),
      fs          = require('fs'),
      lineReader  = require('line-reader'),
      request     = require('request'),
      colors      = require('colors'),
      semver      = require('semver');

function printUsage() {
  //console.log("usage"); TODO
  process.exit(2);
}


function getPodsInstalled(filename, cb) {
  var allPods = [];
  var dependencies = [];
  var current = undefined;

  lineReader.eachLine(filename, function(line, last) {
    //Build a small state machine
    if (line.indexOf("PODS:") == 0) {
      current = allPods;
      return;
    }
    if (line.indexOf("DEPENDENCIES:") == 0) {
      current = dependencies;
      return;
    }
    if (line.length == 0) {
      current = undefined;
    }


    if (current) {   
      var re = /^\s*- +(\w*)(?: \((.*)\))?.*$/; 
      var m;

      if ((m = re.exec(line)) !== null) {
        var podName = m[1], versionString = m[2];

        var reVersion = /^.*?(\d+(?:\.\d+){0,2}(?:.*?))$/;
        var mVersion;
        var podVersion = null;
        if ((mVersion = reVersion.exec(versionString)) !== null) {
          podVersion = mVersion[1];
        }

        current.push({ 
          name: podName,
          version: podVersion
        });
      }
    }


  }).then(function () {
    var array = [];

    //For each pod in the dependencies array, find the corresponding pod in 
    //allPods, then return name and version from allPods (which is the 
    //version that is actually installed)
    dependencies.forEach(function(pod) {
      var podInstalled = _.find(allPods,function(findpod) {
        return findpod.name == pod.name;
      });

      var resultPod = {
        name: pod.name
      };

      if (podInstalled) {
        resultPod.installedVersion = podInstalled.version;
      }
      array.push(resultPod);

    });
    cb(array);
  });

}

function getLatestVersionForPods(pods, cb) {
  var numFinished = 0;

  pods.forEach(function(pod){
    var url = 'https://search.cocoapods.org/api/v1/pods.flat.hash.json?query=name%3A'+pod.name+'&ids=20&offset=0';

    request(url, {json: true}, function (error, response, data) {
      if (!error && response.statusCode == 200) {
        
        if (data.length > 0 && data[0].version != undefined) {
          pod.latestVersion = data[0].version;
        }
      }

      if (++numFinished == pods.length) {
        cb(pods);
      } 
    })
  });
}

function printPods(pods) {
  pods.forEach(function(pod){
    var str = pod.name + ':';

    if (pod.latestVersion) {
      str += ' ' + pod.latestVersion;
    } else {
      str += ' ?';
    }

    if (pod.installedVersion) {
      str += ' (' + pod.installedVersion + ' installed)';
    } else {
      str += ' (Couldn\'t determine installed version)';
    }

    console.log(str);
  });
}

function semverGt(v1, v2) {
  //Quick fix for broken version number like 2.0 which should be 2.0.0
  var fix = function(str) {
    if (str.split('.').length == 2) {
      return str + ".0";
    } else {
      return str;
    }
  };

  return semver.gt(fix(v1), fix(v2));
}

/* Program start */

var filename = 'Podfile.lock'

if (!fs.existsSync(filename) || !fs.statSync(filename).isFile()) {
  console.log('Podfile.lock not found. Please run pod install first.');
  printUsage();
}

getPodsInstalled(filename, function(pods) {


  getLatestVersionForPods(pods, function(pods) {

    var upToDate = pods.filter(function(pod) {
      return (pod.latestVersion && pod.installedVersion && !semverGt(pod.latestVersion,  pod.installedVersion));
    });
    var dontKnow  = pods.filter(function(pod) {
      return (!pod.latestVersion || !pod.installedVersion);
    });
    var outOfDate = pods.filter(function(pod) {
      return (pod.latestVersion && pod.installedVersion && semverGt(pod.latestVersion,  pod.installedVersion));
    });

    if (upToDate.length > 0) {
      console.log('Dependencies up-to-date:'.green);
      printPods(upToDate);
    }

    if (dontKnow.length > 0) {
      console.log('\nDependencies with unknown state:'.yellow);
      printPods(dontKnow);
    }

    if (outOfDate.length > 0) {
      console.log('\nDependencies out-of-date:'.red);
      printPods(outOfDate);
    }

  });
});








