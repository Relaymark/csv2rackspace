'use strict';

/*
	Expected format :
	Username,Password,Enabled,FirstName,MiddleInitial,LastName,AlternateEmail,Organization,Department,Title,MobilePhoneNumber,BusinessPhoneNumber,Street,City,State,PostalCode,Country,Notes,UserID,CustomID
	,,,,,,,,,,,,,,,,,,
*/

const
	DefaultDelimiter = ',';

var
	Delimiter;

const
	fs = require('fs'),
	parse = require('csv-parse/lib/sync');

let getProcessedData = (filename) => {
	let filedata = fs.readFileSync(filename, {
		flag: 'r'
	});

	var data = parse(filedata, {
		columns: true,
		delimiter : Delimiter || DefaultDelimiter
	});

	console.info('Discovered %s entries in csv file', data.length);
	return data;
};

exports.getProcessedData = getProcessedData;