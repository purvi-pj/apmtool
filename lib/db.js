'use strict';

const PPOrder 	= require('../schemas/ppOrder'),
	  User 		= require('../schemas/user'),
	  SHA256 	= require("crypto-js/sha256"),
	  util 		= require('util');

function createUser(args) {

	return new Promise((resolve, reject) => {

		const { username, password } = args;

		const searchQuery = {
			USERNAME: username
		};

		User.exists(searchQuery, function (err, exists) {

			if (exists) {
				reject({ err: 'USER EXISTS'});
			} else {

				let user = new User({
					USERNAME: username
				});

				const insertionTime = new Date(user.INSERTION_DATE).getTime();

				user.PASSWORD = SHA256(util.format('%s-%s', insertionTime, password));	

				user.save();		

				resolve(user);		

			}
		});

	});

}

function verifyPassword(args) {

	return new Promise((resolve, reject) => {

		const { username, password } = args;

		const searchQuery = {
			USERNAME: username
		};

		User.findOne(searchQuery, null, { lean: true }, function (err, record) {

			if (err) {
				reject();
			} else if (record) {

				const insertionTime = new Date(record.INSERTION_DATE).getTime();

				const validatePassword = SHA256(util.format('%s-%s', insertionTime, password));	

				if (validatePassword == record.PASSWORD) {
					resolve(record);
				} else {
					reject();
				}
			} else {
				reject();
			}

		});

	});

}	  

function findUserById(args) {

	return new Promise((resolve, reject) => {

		const { id } = args;

		const searchQuery = {
			_id: id
		};

		User.findOne(searchQuery, null, { lean: true }, function (err, record) {

			if (err) {
				reject();
			} else if (record) {
				resolve(record);
			} else {
				reject();
			}
		});

	});

}	  

function getOrderByOrderId(args) {

	return new Promise((resolve, reject) => {

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

function getOrderByCaptureId(args) {

	return new Promise((resolve, reject) => {

		const { captureId } = args;

		const searchQuery = {
			"CAPTURE_ORDER_API.RESPONSE.purchase_units.payments.captures.id" : captureId
		};

		console.log(util.format('SEARCHING DB FOR CAPTURE ID `%s`...', captureId));

		PPOrder.findOne(searchQuery, function (err, record) {
			if (record) {
				console.log(util.format('RECORD LOCATED FOR CAPTURE ID `%s`...', captureId));
			}
			resolve(record);
		});

	});

}

function getOrderStatus(args) {

	return new Promise((resolve, reject) => {

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

	return new Promise((resolve, reject) => {

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
	getOrderByCaptureId,
	getOrderStatus,
	doesOrderExist,
	getRecentOrders,
	createUser,
	findUserById,
	verifyPassword
}

