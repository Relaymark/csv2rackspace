'use strict';

const
	UserAgent = 'csv2rackspace CLI';

var
	AccountNumber,
	Domain,
	Userkey,
	Secretkey;

const
	sha1 = require('crypto-js/sha1'),
	base64 = require('crypto-js/enc-base64'),
	unirest = require('unirest'),
	chalk = require('chalk'),
	sugar = require('sugar');

sugar.extend();

let setKeys = (userkey, secretkey) => {
	Userkey = userkey;
	Secretkey = secretkey;
	console.log('Keys set');
};

let setAccount = (accountNumber, domain) => {
	AccountNumber = accountNumber;
	Domain = domain;
};

let signMessage = () => {
	let dateTime = new Date().setUTC(true).format('{yyyy}{MM}{dd}{HH}{mm}{ss}');
	let dataToSign = Userkey + UserAgent + dateTime + Secretkey;
	let signature = sha1(dataToSign).toString(base64);

	return Userkey + ":" + dateTime + ":" + signature;
};

let unirestFactory = (method, url, callback, data) => {
	return unirest(method, url)
		.header('User-Agent', UserAgent)
		.header('X-Api-Signature', signMessage())
		.header('Accept', 'application/json')
		.form(data)
		.end((response) => {
			callback(response);
		});
};

let request = (url, callback) => {
	return unirestFactory('GET', url, callback);
};

let post = (url, data, callback) => {
	return unirestFactory('POST', url, callback, data);
};

let put = (url, data, callback) => {
	return unirestFactory('PUT', url, callback, data);
};

let getStats = () => {
	// [GET] http://api.emailsrvr.com/v1/customers/(customer account number)/domains/(domain name)
	request('https://api.emailsrvr.com/v1/customers/' + AccountNumber + '/domains/' + Domain, (response) => {
		console.info(chalk.green('Connection OK'));
		console.info(chalk.green('%s mailboxes'), response.body.rsEmailUsedStorage);
	});
};

let mapCsv = (mailbox) => {
	return {
		password: mailbox.Password,
		size: 25600,
		recoverDeleted: false,
		lastName: mailbox.LastName,
		firstName: mailbox.FirstName,
		initials: mailbox.MiddleInitial,
		organizationUnit: mailbox.Organization,
		businessNumber: mailbox.BusinessPhoneNumber,
		mobileNumber: mailbox.MobilePhoneNumber,
		businessStreet: mailbox.Street,
		businessCity: mailbox.City,
		businessState: mailbox.State,
		businessPostalCode: mailbox.PostalCode,
		businessCountry: mailbox.Country,
		notes: mailbox.Notes,
		userID: mailbox.UserID,
		customID: mailbox.CustomID,
		enabled: mailbox.Enabled === '' || mailbox.Enabled === '1'
	};
}

let getMailbox = (email, callback) => {
	// [GET] https://api.emailsrvr.com/v1/customers/(customer account number)/domains/(domain name)/rs/mailboxes/(mailbox name)
	request('https://api.emailsrvr.com/v1/customers/' + AccountNumber + '/domains/' + Domain + '/rs/mailboxes/' + email, (response) => {
		callback(response.body);
	});
};

let createMailbox = (mailbox, callback) => {
	// [POST] https://api.emailsrvr.com/v1/customers/(customer account number)/domains/(domain name)/rs/mailboxes/(mailbox name)
	var email = mailbox.Username + '@' + Domain;

	post('https://api.emailsrvr.com/v1/customers/' + AccountNumber + '/domains/' + Domain + '/rs/mailboxes/' + mailbox.Username, mapCsv(mailbox), (response) => {
			if(response.statusType !== 2) {
				console.error(chalk.bold.red('Error creating %s mailbox : %s'), email,
					response.body.badRequestFault ? response.body.badRequestFault.message : response.body);
			} else {
				console.info(chalk.green('\nMailbox %s created.'), email);
			}

			callback(response.body);
		});
};

// FIXME: DRY
let updateMailbox = (mailbox, callback) => {
	// [PUT] https://api.emailsrvr.com/v1/customers/(customer account number)/domains/(domain name)/rs/mailboxes/(mailbox name)
	var email = mailbox.Username + '@' + Domain;

	put('https://api.emailsrvr.com/v1/customers/' + AccountNumber + '/domains/' + Domain + '/rs/mailboxes/' + mailbox.Username, mapCsv(mailbox), (response) => {
			if(response.statusType !== 2) {
				console.error(chalk.bold.red('Error creating %s mailbox : %s'), email,
					response.body.badRequestFault ? response.body.badRequestFault.message : response.body);
			} else {
				console.info(chalk.green('\nMailbox %s updated.'), email);
			}

			callback(response.body);
		});
};

exports.createMailbox = createMailbox;
exports.updateMailbox = updateMailbox;
exports.getMailbox = getMailbox;
exports.getStats = getStats;
exports.setKeys = setKeys;
exports.setAccount = setAccount;
exports.signMessage = signMessage;
