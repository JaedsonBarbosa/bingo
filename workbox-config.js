module.exports = {
	globDirectory: 'public/',
	globPatterns: [
		'**/*.{js,html,css,jpg,ttf}'
	],
	ignoreURLParametersMatching: [
		/^utm_/,
		/^fbclid$/
	],
	swDest: 'public/sw.js',
	mode: 'production',
	sourcemap: false
};