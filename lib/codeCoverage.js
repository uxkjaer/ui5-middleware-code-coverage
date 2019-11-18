const log = require("@ui5/logger").getLogger("server:custommiddleware:code-coverage")
const im = require('istanbul-middleware')
const express = require("express")
const path = require('path')
const url = require("url")
const fs = require('fs')



function matcher(req) {
	var parsed = url.parse(req.url);

	if (parsed.pathname.match(/\.js$/) && !parsed.pathname.match(/jquery/) && !parsed.pathname.match(/resources/)) {
		return parsed.pathname
	} else {
		return null;
	}
}

/**
 * Custom UI5 Server middleware example
 *
 * @param {Object} parameters Parameters
 * @param {Object} parameters.resources Resource collections
 * @param {module:@ui5/fs.AbstractReader} parameters.resources.all Reader or Collection to read resources of the
 *                                        root project and its dependencies
 * @param {module:@ui5/fs.AbstractReader} parameters.resources.rootProject Reader or Collection to read resources of
 *                                        the project the server is started in
 * @param {module:@ui5/fs.AbstractReader} parameters.resources.dependencies Reader or Collection to read resources of
 *                                        the projects dependencies
 * @param {Object} parameters.options Options
 * @param {string} [parameters.options.configuration] Custom server middleware configuration if given in ui5.yaml
 * @returns {function} Middleware function to use
 */
module.exports = function ({
	resources,
	options
}) {
	//Works for clientside
	const app = express();

	// set up basic middleware
	const watchPath = options.configuration.path || 'webapp';


	let publicDir = path.join(process.cwd(), watchPath)
	im.hookLoader(publicDir);

	app.use('/coverage', im.createHandler({
		verbose: true,
		resetOnGet: true
	}));
	app.use(im.createClientHandler(publicDir, {
		matcher: matcher
	}));
	log.info("Coverage is running on port 3000")
	app.listen(3000);


	return function (req, res, next) {


		var pathname = matcher(req);
		if (pathname) {
			let file = path.join(process.cwd(), watchPath + pathname),
				code;
			try {
				code = fs.readFileSync(file, 'utf8');
				log.info("Request for " + file + " received.");
			} catch (err) {
				log.error("Request for " + file + " failed.");
				next()
			}

			if (code){
				instrumenter = im.getInstrumenter();
				res.send(instrumenter.instrumentSync(code, file));
			}
				
		} else {
			next()
		}
	}

};
