const iAMVOCMonitor = require('iam-voc-monitor');

let voc = new iAMVOCMonitor();
voc.on("connected", (device) => {
	console.log("connected");
});
voc.on("rawData", (date) => {
	console.log("VOC:", date, "ppm eqiv");
});
voc.on("error", (error) => {
	console.log(error);
});
voc.connect();
voc.startTransfer();
