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
	doesOrderExist,
	getRecentOrders
}

