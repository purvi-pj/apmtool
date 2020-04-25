'use strict';

const PPOrder 	= require('../schemas/ppOrder'),
	  util 		= require('util');

function getOrderByOrderId(args) {

	return new Promise((resolve, rejevct) => {

		const { orderId } = args;

		const searchQuery = {
			ORDER_ID : orderId
		};

		console.log(util.format('SEARCHING DB FOR ORDER ID `%s`...', orderId));

		PPOrder.findOne(searchQuery, function (err, record) {
			if (record) {
				console.log(util.format('RECORD LOCATED FOR ORDER ID `%s`...', orderId));
			}
			resolve(record);
		});

	});

}

function getOrderStatus(args) {

	return new Promise((resolve, rejevct) => {

		const { orderId } = args;

		const searchQuery = {
			ORDER_ID : orderId
		};

		console.log(util.format('SEARCHING DB FOR ORDER ID `%s`...', orderId));

		PPOrder.findOne(searchQuery, null, { lean: true, select: "STATUS" }, function (err, record) {
			if (err) {
				console.log(util.format("ERROR WHILE RETRIEVING ORDER STATUS...", JSON.stringify(err, null, 2)));
				reject(err);
			} else if (record) {
				console.log(util.format('STATUS RETRIEVED FOR ORDER ID `%s`...', orderId));
				resolve(record.STATUS);
			} else {
				reject();
			}
			
		});

	});

}

function doesOrderExist(args) {

	return new Promise((resolve, rejevct) => {

		const { orderId } = args;

		const searchQuery = {
			ORDER_ID : orderId
		};

		PPOrder.exists(searchQuery, function (err, exists) {
			resolve(exists);
		});

	});

}

function getRecentOrders(args) {

	const { limit } = args;
	
	return new Promise((resolve, reject) => {

		PPOrder.find({}, null, { sort: { 'INSERTION_DATE' : -1 }, limit, lean: true }, function(err, records) {
		  resolve(records);
		});

	});
}
	
module.exports = {
	getOrderByOrderId,
	getOrderStatus,
	doesOrderExist,
	getRecentOrders
}

