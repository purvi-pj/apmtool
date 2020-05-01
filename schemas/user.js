'use strict';

const mongoose = require('mongoose');

let user = function() {

	const userSchema = mongoose.Schema({
		INSERTION_DATE: { type: Date, default: Date.now },
		USERNAME: String,
		PASSWORD: String
	});

	return mongoose.model('user', userSchema);
	
}

module.exports = new user();