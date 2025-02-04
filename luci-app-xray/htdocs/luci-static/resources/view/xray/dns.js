/**
 * @license
 * Copyright 2020 Xingwang Liao <kuoruan@gmail.com>
 *
 * Licensed to the public under the MIT License.
 */
'use strict';
'require form';
'require xray';
return L.view.extend({
	load: function () {
		return xray.getSections('dns_server');
	},
	render: function (e) {
		void 0 === e && (e = []);
		var o,
			r = new form.Map(
				'v2ray',
				'%s - %s'.format(_('Xray'), _('DNS')),
				_('Details: %s').format(
					'<a href="https://xtls.github.io/Xray-docs-next/config/dns.html" target="_blank">DnsObject</a>'
				)
			),
			t = r.section(form.NamedSection, 'main_dns', 'dns');
		(t.anonymous = !0),
			(t.addremove = !1),
			((o = t.option(form.Flag, 'enabled', _('Enabled'))).rmempty = !1),
			(o = t.option(form.Value, 'tag', _('Tag'))),
			((o = t.option(
				form.Value,
				'client_ip',
				_('Client IP'),
				'<a href="https://icanhazip.com" target="_blank">%s</a>'.format(_('Get my public IP address'))
			)).datatype = 'ipaddr'),
			(o = t.option(
				form.DynamicList,
				'hosts',
				_('Hosts'),
				_('A list of static addresses, format: <code>domain|address</code>. eg: %s').format(
					'google.com|127.0.0.1'
				)
			)),
			(o = t.option(form.MultiValue, 'servers', _('DNS Servers'), _('Select DNS servers to use')));
		for (var a = 0, n = e; a < n.length; a++) {
			var s = n[a];
			o.value(s.value, s.caption);
		}
		var i = r.section(form.GridSection, 'dns_server', _('DNS server'), _('Add DNS servers here'));
		return (
			(i.anonymous = !0),
			(i.addremove = !0),
			(i.nodescription = !0),
			((o = i.option(form.Value, 'alias', _('Alias'))).rmempty = !1),
			(o = i.option(form.Value, 'address', _('Address'))),
			((o = i.option(form.Value, 'port', _('Port'))).datatype = 'port'),
			(o.placeholder = '53'),
			((o = i.option(form.DynamicList, 'domains', _('Domains'))).modalonly = !0),
			((o = i.option(form.DynamicList, 'expect_ips', _('Expect IPs'))).modalonly = !0),
			r.render()
		);
	},
});
