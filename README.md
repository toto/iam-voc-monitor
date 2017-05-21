# iam-voc-monitor

This is a node module for the [iAM USB indor air quality monitor ](http://ams.com/eng/Products/Environmental-Sensors/Air-Quality-Sensors/iAM) built by Applied Sensors but distributed under many different brands (e.g. [Voltcraft CO-20](https://www.amazon.de/Voltcraft-CO-20-USB-Raumluftmessgerät/dp/B003WFJN9Y)   [Rehau](https://www.amazon.de/Rehau-REHAU-Raumluftsensor-USB-Stick/dp/B00ZXP6EI4/)). 

## Requirements

Needs libusb support (depends on node `usb` module). Tested on Linux only so far.

## Usage


```
let voc = new iAMVOCMonitor();

voc.on("connected", (device) => {
	console.log("connected");
});

voc.on("error", (error) => {
	console.log(error);
});

voc.on("rawData", (date) => {
	console.log("VOC:", date);
});
voc.connect();
voc.startTransfer();
```

See [demo.js](demo.js) as well.

The `iAMVOCMonitor` emitts three events:

- `error`: If a (non-fatal) error occurs during data reads. Passed the error.
- `connected`: After calling `connect()` when connected. Passed the libusb device.
- `rawData`: Emitted when data is read from the sensor. Passed a Number with mesured value. Values range from 450 to 2000 and are measured in ppm (parts per million) equivalent. 

## License

BSD Licensed. Look at [Licence file](LICENSE) for details.