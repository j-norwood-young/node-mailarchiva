const axios = require("axios");
const querystring = require('querystring');
const fs = require("fs");
const path = require("path");
const mkdirp = require("mkdirp-promise");
const https = require('https');

const agent = new https.Agent({
	rejectUnauthorized: false
});

class Mailarchiva {
	constructor(config) {
		if (!config) throw("config required");
		if (!config.baseURL) throw("config.baseURL required");
		if (!config.headers || !config.headers.Authorization) throw("config.headers.Authorization required");
		this.config = config;
		this.mailarchiva = axios.create(this.config);
	}

	async search(query, page, limit)  {
		page = page || 1;
		limit = limit || 10;
		const qs = {
			query,
			page,
			pageSize: limit
		}
		const url = `/api/v1/blobs?${ querystring.stringify(qs) }`;
		this.mailarchiva.defaults.headers['Accept'] = "application/json";
		this.mailarchiva.defaults.headers.common['Accept'] = "application/json";
		try {
			const result = await this.mailarchiva.get(url, { httpsAgent: agent });
			return {
				hits: result.data.totalHits,
				page,
				limit,
				pageCount: Math.ceil(result.data.totalHits / limit),
				data: result.data.searchResults.map(mailObj => {
					let response = {};
					mailObj.fieldValues.forEach(fieldValue => {
						response[fieldValue.field] = fieldValue.value;
					});
					return response;
				})
			};
		} catch(err) {
			console.error(err.data);
			return Promise.reject({ error: "Mailarchiva error", code: err.code });
		};
	};
	
	findByEmail(email, page = 0, limit = 20) {
		var s = `all:"${ email }" AND NOT anyaddress:(dir@open.co.za) AND NOT subject:("*P")`;
		return this.search(s, page, limit);
	}
	
	async attachments(volid, id) {
		try {
			this.mailarchiva.defaults.headers['Accept'] = "application/json";
			var url = `/api/v1/blobs/${ volid }/${ id }?${ querystring.stringify({ xPathQuery: "attachname" }) }`;
			var result = await this.mailarchiva.get(url, { httpsAgent: agent });
			return result.data;
		} catch(err) {
			console.error(err);
			return Promise.reject({ error: `Could not retrieve attachment ${ volid }/${ id }` });
		}
	}
	
	fsExists(file) {
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
	
	async attachment(volid, id, filename) {
		try {
			this.mailarchiva.defaults.headers['Accept'] = "application/octet-stream";
			var url = `/api/v1/blobs/${ volid }/${ id }?${ querystring.stringify({ xPathQuery: `attachmentlist[filename='${ filename }']/download` }) }`;
			var dir = `/tmp/${ volid }/${ id }`;
			var file = path.resolve(dir, filename);
			if (await this.fsExists(file)) return file;
			await mkdirp(dir);
			var response = await this.mailarchiva({ method: "GET", url, responseType: 'stream', httpsAgent: agent });
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
	
	async get(volid, id) {
		try {
			this.mailarchiva.defaults.headers['Accept'] = "application/octet-stream";
			var url = `/api/v1/blobs/${ volid }/${ id }?${ querystring.stringify({ xPathQuery: "view" }) }`;
			var result = await this.mailarchiva.get(url, { httpsAgent: agent });
			return result.data;
		} catch(err) {
			console.error(err.data);
			return Promise.reject({ error: "Mailarchiva error", code: err.code, data: err.data });
		}
	};
}

module.exports = Mailarchiva;
