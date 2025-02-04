/**
 * @license
 * Copyright 2020 Xingwang Liao <kuoruan@gmail.com>
 *
 * Licensed to the public under the MIT License.
 */
'use strict';
var b64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=',
	b64re = /^(?:[A-Za-z\d+\\/]{4})*?(?:[A-Za-z\d+\\/]{2}(?:==)?|[A-Za-z\d+\\/]{3}=?)?$/;
return L.Class.extend({
	decode: function (e) {
		if ('function' == typeof atob) return atob(e);
		if (((e = String(e).replace(/[\t\n\f\r ]+/g, '')), !b64re.test(e)))
			throw new TypeError(
				"Failed to execute 'atob' on 'Window': The string to be decoded is not correctly encoded."
			);
		e += '=='.slice(2 - (3 & e.length));
		for (var t, r, n, o = '', a = 0; a < e.length; )
			(t =
				(b64.indexOf(e.charAt(a++)) << 18) |
				(b64.indexOf(e.charAt(a++)) << 12) |
				((r = b64.indexOf(e.charAt(a++))) << 6) |
				(n = b64.indexOf(e.charAt(a++)))),
				(o +=
					64 === r
						? String.fromCharCode((t >> 16) & 255)
						: 64 === n
						? String.fromCharCode((t >> 16) & 255, (t >> 8) & 255)
						: String.fromCharCode((t >> 16) & 255, (t >> 8) & 255, 255 & t));
		return o;
	},
	encode: function (e) {
		if ('function' == typeof btoa) return btoa(e);
		for (var t, r, n, o, a = '', c = 0, i = (e = String(e)).length % 3; c < e.length; ) {
			if ((r = e.charCodeAt(c++)) > 255 || (n = e.charCodeAt(c++)) > 255 || (o = e.charCodeAt(c++)) > 255)
				throw new TypeError(
					"Failed to execute 'btoa' on 'Window': The string to be encoded contains characters outside of the Latin1 range."
				);
			(t = (r << 16) | (n << 8) | o),
				(a +=
					b64.charAt((t >> 18) & 63) +
					b64.charAt((t >> 12) & 63) +
					b64.charAt((t >> 6) & 63) +
					b64.charAt(63 & t));
		}
		return i ? a.slice(0, i - 3) + '==='.substring(i) : a;
	},
});
