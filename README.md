# Podchecker - Version Checker for CocoaPods
Podchecker will scan your Podfile.lock for Pods that are currently installed and check if they are up-to-date with the latest version available online. 

This is particularly handy when you have specified the versions in the Podfile using the `~>` operator to preserve compatibility with your app, but want to check for new major versions of your dependecies from time to time. Podchecker saves you the time to look up each of your Pods individually.

You can also use it to get a list of Updates, whithout having to run `pod update`.

## Installation
Install Node.js, then run
```
sudo npm install -g podchecker
````
  
## Usage
`cd` into your project directory containing the Podfile and Podfile.lock, then run `podchecker`.
Example output:
```
$ podchecker
Dependencies up-to-date:
ECSlidingViewController: 2.0.3 (2.0.3 installed)
HexColors: 2.2.1 (2.2.1 installed)
WYPopoverController: 0.3.7 (0.3.7 installed)

Dependencies out-of-date:
IDMPhotoBrowser: 1.6.2 (1.4 installed)
MagicalRecord: 2.2 (2.1 installed)
```

## Release History

* 0.1.0 Initial release
