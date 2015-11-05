window.SocialButtons = {};

SocialButtons.services = {
	'facebook': {
		title: 'Share', 
		counterUrl: '//graph.facebook.com/?id={url}',
		popupUrl: 'https://www.facebook.com/sharer/sharer.php?u={url}',
		count: 'shares',
		width: 600, height: 500
	},
	'twitter': {
		title: 'Tweet',
		counterUrl: '//cdn.api.twitter.com/1/urls/count.json?url={url}&callback={cb}',
		popupUrl: 'https://twitter.com/intent/tweet?url={url}&text={title}',
		width: 600, height: 450
	},
	'pinterest': {
		title: 'Pin it',
		counterUrl: '//api.pinterest.com/v1/urls/count.json?url={url}&callback={cb}',
		popupUrl: 'https://pinterest.com/pin/create/button/?url={url}&description={title}',
		width: 630, height: 270
	},
	'mailru': {
		counterUrl: '//connect.mail.ru/share_count?url_list={url}&callback=1&func={cb}',
		popupUrl: 'http://connect.mail.ru/share?share_url={url}&title={title}',
		count: 'shares',
		width: 550, height: 360
	},
	'gplus': {
		title: 'Share',
		counterUrl: '//share.yandex.ru/gpp.xml?url={url}',
		popupUrl: 'https://plus.google.com/share?url={url}',
		count: function(cb){
			if (!window.services) window.services = {};
			window.services.gplus = {
				cb: function(count) {
					cb(count);
				}
			};
		},
		width: 500, height: 500
	},
	'odnoklassniki': {
		title: 'Share',
		counterUrl: '//connect.ok.ru/dk?st.cmd=extLike&ref={url}&uid={index}',
		popupUrl: 'http://connect.ok.ru/dk?st.cmd=WidgetSharePreview&service=odnoklassniki&st.shareUrl={url}',
		count: function(cb){
			if (!window.ODKL) window.ODKL = {};
			window.ODKL.updateCount = function(id, count) {
				cb(count);
			};
		},
		width: 550, height: 360

	},
	'vkontakte': {
		title: 'Share',
		counterUrl: '//vk.com/share.php?act=count&url={url}',
		popupUrl: 'http://vk.com/share.php?url={url}&title={title}',
		count: function(cb){
			if (!window.VK) window.VK = {};
			window.VK.Share = {
				count: function(id, count) {
					cb(count);
				}
			};
		},
		width: 550, height: 330
	}
};

SocialButtons.CB = {};

SocialButtons.JS = function(url){
	var script = document.createElement('script');
	script.src = url;
	document.body.appendChild(script);
};


SocialButtons.JSONP = function(url, callback, error){
	var callbackName = String(Math.random()).slice(-6);
	var scriptOk = false;

	SocialButtons.CB['cb'+callbackName] = function(data) {
		scriptOk = true;
		delete SocialButtons.CB[callbackName]; 
		callback(data);
	};

	var checkCallback = function() {
		if (scriptOk) return;
		delete SocialButtons.CB[callbackName];
		error(url);
	};

	var script = document.createElement('script');
	script.onload = script.onerror = checkCallback;
	script.src = SocialButtons.template(url, {cb: 'SocialButtons.CB.cb' + callbackName})+'&';
	document.body.appendChild(script);
};


SocialButtons.JSON = function(url, callback, error) {
	var xhr = new XMLHttpRequest();
	xhr.open('GET', url, true);
	xhr.onreadystatechange = function() {
		if (xhr.readyState != 4) return;
		if (xhr.status == 200) {
			callback(JSON.parse(xhr.responseText));
		} else {
			if (error) error(xhr);
		}
	};
	xhr.send();
};

SocialButtons.getCount = function(el, callback, error) {
	var protocol = location.protocol === 'https:' ? 'https:' : 'http:'; 

	var url = this.template(protocol + this.services[el.name].counterUrl, el.option);

	if(typeof this.services[el.name].count == 'function') {
		this.JS(url);
		this.services[el.name].count(callback);
	} else {
		this[/\{cb\}/.test(url)? 'JSONP' : 'JSON'](url, function(data) {
			callback(data[SocialButtons.services[el.name].count || 'count']);
		}, error);
	}
};

SocialButtons.template = function(str, obj) {
	return str.replace(/\{([^\}]+)\}/g, function(m, k) {
		return obj[k] || m;
	});
};

SocialButtons.openPoup = function(url, opt){
	var left = Math.round(screen.width/2 - opt.width/2);
	var top = screen.height > opt.height? Math.round(screen.height/3 - opt.height/2) : 0;

	var win = window.open(url, '-',
		'left=' + left +
		',top=' + top +
		',width=' + opt.width +
		',height=' + opt.height +
		',personalbar=0,toolbar=0,scrollbars=1,resizable=1'
	);

	if (win) {
		win.focus();
	} else {
		location.href = url;
	}
};

SocialButtons.init = function() {
	var container = document.querySelector('.social-buttons');
	var btns = document.querySelectorAll('.social-buttons>div');

	for (var i = 0; i < btns.length; i++) {

		var el = {};
		el.name = btns[i].className;
		el.btn = btns[i];

		el.option = {
			url: btns[i].getAttribute('data-url') || container.getAttribute('data-url') || window.location.href,
			title: btns[i].getAttribute('data-title') || container.getAttribute('data-title') || document.title,
			media: btns[i].getAttribute('data-media') || container.getAttribute('data-media') || '',
			start: btns[i].getAttribute('data-start') || 0
		};

		el.icon  = document.createElement('span');
		el.icon.classList.add('icon');

		el.title = document.createElement('span');
		el.title.classList.add('title');
		el.title.innerText = btns[i].innerText || this.services[el.name].title;

		el.count = document.createElement('span');
		el.count.classList.add('count');

		el.btn.innerHTML = '';
		el.btn.appendChild(el.icon);
		el.btn.appendChild(el.title);
		el.btn.appendChild(el.count);

		el.btn.addEventListener('click', function() {
			SocialButtons.openPoup(SocialButtons.template(SocialButtons.services[this.name].popupUrl, this.option), SocialButtons.services[this.name]);
		}.bind(el), false);

		this.getCount(el, function(count) {
			count = parseInt(count) || this.option.start;
			if(count) {
				this.count.innerText = count;
			}else{
				this.count.parentNode.removeChild(this.count);
			}
		}.bind(el), function() {
			this.count.parentNode.removeChild(this.count);
		}.bind(el));
	}
};

window.addEventListener('DOMContentLoaded', function() {
	SocialButtons.init();
});