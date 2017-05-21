const os		= require('os');
const buffer	= require('buffer');
const util		= require('util');
const usb		= require('usb');

const EventEmitter = require('events').EventEmitter;

class iAMVOCMonitor extends EventEmitter {
	constructor() {
		super();

		this.vocDevice 		= null;
		this.vocInterface 	= null;
		this.vocEndpoint  	= null;

		this.idVendor  = 0x03eb;
		this.idProduct = 0x2013;

		this.buf = new Buffer(16);
  
		this.buf.writeUInt8(0x40,0);
		this.buf.writeUInt8(0x68,1);
		this.buf.writeUInt8(0x2a,2);
		this.buf.writeUInt8(0x54,3);
		this.buf.writeUInt8(0x52,4);
		this.buf.writeUInt8(0x0a,5);
		this.buf.writeUInt8(0x40,6);
		this.buf.writeUInt8(0x40,7);
		this.buf.writeUInt8(0x40,8);
		this.buf.writeUInt8(0x40,9);
		this.buf.writeUInt8(0x40,10);
		this.buf.writeUInt8(0x40,11);				
		this.buf.writeUInt8(0x40,12);
		this.buf.writeUInt8(0x40,13);
		this.buf.writeUInt8(0x40,14);
		this.buf.writeUInt8(0x40,15);

		process.on('SIGINT', () => {
			this.disconnect(function(cb) {
				if(cb) process.exit();
			});
		});
	}

	setVendorId(vid) {
		this.idVendor = vid;
	}

	setProductId(pid) {
		this.idProduct = pid;
	}

	getVendorId() {
		return this.idVendor;
	}

	getProductId() {
		return this.idProduct;
	}

	connect() {
		usb.setDebugLevel(2);
		this.vocDevice = usb.findByIds(this.idVendor, this.idProduct);
		
		if(!this.vocDevice) {
			this.emit("error", 'CO2 device not found');
		}
		else {
			try {
				this.vocDevice.open();
				
				if (!this.vocDevice.interfaces[0]) {
					throw new Error('Interface not found on Device!');
				}
				else {
					this.vocInterface = this.vocDevice.interfaces[0];

					if (os.platform() === 'linux') {
						if (this.vocInterface.isKernelDriverActive()) {
							this.vocInterface.detachKernelDriver();
						}
					}

					// this.vocDevice.controltransfer(0x21,0x09,0x0300,0x00, this.buf, function(error, data) {
					// 	if (error) {
					// 		throw new Error("Error in opening control transfer: " + error);
					// 	}
					// });

					this.vocInterface.claim();
					this.vocInEndpoint = this.vocInterface.endpoints[0];
					this.vocInEndpoint.transferType = usb.LIBUSB_TRANSFER_TYPE_INTERRUPT;
					this.vocOutEndpoint = this.vocInterface.endpoints[1];					
					this.vocOutEndpoint.transferType = usb.LIBUSB_TRANSFER_TYPE_INTERRUPT;					
					
					this.emit("connected", this.vocDevice);
				}

			} catch (error) {
				throw new Error(error);
			}
		}
	}

	disconnect(cb) {
		try {
			this.vocInEndpoint.stopPoll();
			this.vocInterface.release(true, (error) => {
				if(error) {
					this.emit('error', error);
				}
				else {
					this.vocDevice.close();
					this.vocDevice = null;
					cb(true);
				}
			});
		}
		catch(error) {
			throw new Error(error);
		}
	}

	startTransfer() {
		if (!this.vocDevice) {
			throw new Error("Not connected. Call connect() first");
		}
		this.vocInEndpoint.on("data", (data) => {
			if (data.length == 0) return;
			
			if (data.length > 6) {
				let voc = data.readInt16LE(2, 2);
				if (this.voc != voc && voc > 450 && voc < 2001) {
					this.voc = voc;
					this.emit("rawData", this.voc);
				}
				setTimeout(() => {
					this.vocOutEndpoint.transfer(this.buf, (err) => {
						if (err) {
							throw new Error(err);
						}
					});
				}, 1000);
			
			}
		});
		this.vocInEndpoint.startPoll();
		
		this.vocOutEndpoint.transfer(this.buf, (err) => {
			if (err) {
				throw new Error(err);
			}
		});
	}
}

module.exports = iAMVOCMonitor;
