const config = require("config");
const axios = require("axios");
const querystring = require('querystring');
const fs = require("fs");
const path = require("path");
const mkdirp = require("mkdirp-promise");
const https = require('https');
const mailarchiva = axios.create(config.mailarchiva);

const agent = new https.Agent({
	rejectUnauthorized: false
});

var search = async (query, page, limit) => {
	var page = page || 1;
	var limit = limit || 10;
	var qs = {
		query,
		page,
		pageSize: limit
	}
	var url = `/api/v1/blobs?${ querystring.stringify(qs) }`;
	console.log(url);
	mailarchiva.defaults.headers['Accept'] = "application/json";
	mailarchiva.defaults.headers.common['Accept'] = "application/json";
    try {
        var result = await mailarchiva.get(url, { httpsAgent: agent });
        return {
			hits: result.data.totalHits,
			page,
			limit,
			pageCount: Math.ceil(result.data.totalHits / limit),
			data: result.data.searchResults.map(mailObj => {
				var response = {};
				mailObj.fieldValues.forEach(fieldValue => {
					response[fieldValue.field] = fieldValue.value;
				});
				return response;
			})
		};
	} catch(err) {
		console.error(err);
		return Promise.reject({ error: "Mailarchiva error", code: err.code });
	};
};

var findByEmail = (email, page = 0, limit = 20) => {
    var s = `all:"${ email }" AND NOT anyaddress:(dir@open.co.za) AND NOT subject:("*P")`;
    return search(s, page, limit);
}

var attachments = async (volid, id) => {
	try {
    	mailarchiva.defaults.headers['Accept'] = "application/json";
    	var url = `/api/v1/blobs/${ volid }/${ id }?${ querystring.stringify({ xPathQuery: "attachname" }) }`;
    	var result = await mailarchiva.get(url, { httpsAgent: agent });
		console.log(result.data);
        return result.data;
	} catch(err) {
		console.error(err);
		return Promise.reject({ error: `Could not retrieve attachment ${ volid }/${ id }` });
	}
}

var fsExists = (file) => {
	return new Promise((resolve, reject) => {
		fs.open(file, 'r', (err, fd) => {
			if (err) {
				if (err.code === 'ENOENT') {
	      			resolve(false);
	    		}
				reject(err);
	  		}
			resolve(true);
		});
	});
};

var attachment = async (volid, id, filename) => {
	try {
    	mailarchiva.defaults.headers['Accept'] = "application/octet-stream";
    	var url = `/api/v1/blobs/${ volid }/${ id }?${ querystring.stringify({ xPathQuery: `attachmentlist[filename='${ filename }']/download` }) }`;
		console.log({url});
		var dir = `/tmp/${ volid }/${ id }`;
		var file = path.resolve(dir, filename);
		if (await fsExists(file)) return file;
		console.log("Downloading", file);
		await mkdirp(dir);
    	var response = await mailarchiva({ method: "GET", url, responseType: 'stream' });
		response.data.pipe(fs.createWriteStream(file));
		return new Promise((resolve, reject) => {
			response.data.on('end', () => { return resolve(file) });
			response.data.on('error', () => reject);
		});
	} catch(err) {
		console.error(err.response ? err.response.data : err);
		return Promise.reject(err.response ? err.response.data : err);
	}
}

var get = async (volid, id) => {
    try {
    	mailarchiva.defaults.headers['Accept'] = "application/octet-stream";
    	var url = `/api/v1/blobs/${ volid }/${ id }?${ querystring.stringify({ xPathQuery: "view" }) }`;
    	var result = await mailarchiva.get(url, { httpsAgent: agent });
		console.log(result.data);
        return result.data;
	} catch(err) {
		console.error(err);
		return Promise.reject({ error: "Mailarchiva error", code: err.code });
	}
};

module.exports = { search, get, findByEmail, attachments, attachment };
