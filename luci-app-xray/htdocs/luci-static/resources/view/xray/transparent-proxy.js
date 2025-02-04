/**
 * @license
 * Copyright 2020 Xingwang Liao <kuoruan@gmail.com>
 *
 * Licensed to the public under the MIT License.
 */
'use strict';
'require form';
'require fs';
'require rpc';
'require uci';
'require ui';
'require xray';
'require tools/widgets as widgets';
'require view/xray/include/custom as custom';
'require view/xray/tools/converters as converters';
var gfwlistUrls = {
		github: 'https://raw.githubusercontent.com/gfwlist/gfwlist/master/gfwlist.txt',
		gitlab: 'https://gitlab.com/gfwlist/gfwlist/raw/master/gfwlist.txt',
		pagure: 'https://pagure.io/gfwlist/raw/master/f/gfwlist.txt',
		bitbucket: 'https://bitbucket.org/gfwlist/gfwlist/raw/HEAD/gfwlist.txt',
	},
	apnicDelegatedUrls = {
		apnic: 'https://ftp.apnic.net/stats/apnic/delegated-apnic-latest',
		arin: 'https://ftp.arin.net/pub/stats/apnic/delegated-apnic-latest',
		ripe: 'https://ftp.ripe.net/pub/stats/apnic/delegated-apnic-latest',
		iana: 'https://ftp.iana.org/pub/mirror/rirstats/apnic/delegated-apnic-latest',
	};
return L.view.extend({
	handleListUpdate: function (t, e, r) {
		var i = function () {
			ui.hideModal(), window.location.reload();
		};
		switch (r) {
			case 'gfwlist':
				var a = uci.get('v2ray', e, 'gfwlist_mirror') || 'github',
					s = gfwlistUrls[a];
				return L.Request.request(L.url('admin/services/xray/request'), {
					method: 'post',
					timeout: 5e4,
					query: { url: s, token: L.env.token, sessionid: L.env.sessionid },
				})
					.then(function (t) {
						var e;
						if (200 === t.status && (e = t.json())) {
							var r = void 0;
							if (!e.code && (r = e.content)) {
								var a = converters.extractGFWList(r);
								a
									? fs
											.write('/etc/v2ray/dst_net.forward', a)
											.then(function () {
												ui.showModal(_('List Update'), [
													E('p', _('GFWList updated.')),
													E(
														'div',
														{ class: 'right' },
														E('button', { class: 'btn', click: i }, _('OK'))
													),
												]);
											})
											.catch(L.raise)
									: L.raise('Error', _('Failed to decode GFWList.'));
							} else L.raise('Error', e.message || _('Failed to fetch GFWList.'));
						} else L.raise('Error', t.statusText);
					})
					.catch(function (t) {
						ui.addNotification(null, E('p', t.message));
					});
			case 'chnroute':
			case 'chnroute6':
				var o = uci.get('v2ray', e, 'apnic_delegated_mirror') || 'apnic';
				s = apnicDelegatedUrls[o];
				return L.Request.request(L.url('admin/services/v2ray/request'), {
					method: 'post',
					timeout: 5e4,
					query: { url: s, token: L.env.token, sessionid: L.env.sessionid },
				})
					.then(function (t) {
						var e;
						if (200 === t.status && (e = t.json())) {
							var a;
							if ((a = e.content)) {
								var s = converters.extractCHNRoute(a, 'dst_ips.bypass' === r);
								fs.write('/etc/v2ray/' + r, s)
									.then(function () {
										ui.showModal(_('List Update'), [
											E('p', _('CHNRoute list updated.')),
											E(
												'div',
												{ class: 'right' },
												E('button', { class: 'btn', click: i }, _('OK'))
											),
										]);
									})
									.catch(L.raise);
							} else L.raise('Error', e.message || _('Failed to fetch CHNRoute list.'));
						} else L.raise('Error', t.statusText);
					})
					.catch(function (t) {
						ui.addNotification(null, E('p', t.message));
					});
			default:
				ui.addNotification(null, _('Unexpected error.'));
		}
	},
	load: function () {
		return xray.getDokodemoDoorPorts();
	},
	render: function (t) {
		void 0 === t && (t = []);
		var e,
			r = new form.Map('v2ray', '%s - %s'.format(_('Xray'), _('Transparent Proxy'))),
			i = r.section(form.NamedSection, 'main_transparent_proxy', 'transparent_proxy');
		(e = i.option(
			form.Value,
			'redirect_port',
			_('Redirect port'),
			_('Enable transparent proxy on Dokodemo-door port.')
		)).value('', _('None'));
		for (var a = 0, s = t; a < s.length; a++) {
			var o = s[a];
			e.value(o.value, o.caption);
		}
		return (
			(e.datatype = 'port'),
			((e = i.option(
				widgets.DeviceSelect,
				'lan_ifaces',
				_('LAN interfaces'),
				_('Enable proxy on selected interfaces.')
			)).multiple = !0),
			(e.nocreate = !0),
			(e.filter = function (t, e) {
				return e.indexOf('wan') < 0;
			}),
			(e.rmempty = !1),
			(e = i.option(form.Flag, 'use_tproxy', _('Use TProxy'), _('Setup redirect rules with TProxy.'))),
			(e = i.option(
				form.Flag,
				'only_privileged_ports',
				_('Only privileged ports'),
				_('Only redirect traffic on ports below 1024.')
			)),
			(e = i.option(form.Flag, 'redirect_udp', _('Redirect UDP'), _('Redirect UDP traffic to Xray.'))),
			(e = i.option(form.Flag, 'redirect_dns', _('Redirect DNS'), _('Redirect DNS traffic to Xray.'))).depends(
				'redirect_udp',
				''
			),
			e.depends('redirect_udp', '0'),
			(e = i.option(
				form.ListValue,
				'proxy_mode',
				_('Proxy mode'),
				_('If enabled, iptables rules will be added to pre-filter traffic and then sent to Xray.')
			)).value('default', _('Default')),
			e.value('cn_direct', _('CN Direct')),
			e.value('cn_proxy', _('CN Proxy')),
			e.value('gfwlist_proxy', _('GFWList Proxy')),
			(e = i.option(form.ListValue, 'apnic_delegated_mirror', _('APNIC delegated mirror'))).value(
				'apnic',
				'APNIC'
			),
			e.value('arin', 'ARIN'),
			e.value('ripe', 'RIPE'),
			e.value('iana', 'IANA'),
			((e = i.option(custom.ListStatusValue, '_chnroutelist', _('CHNRoute'))).listtype = 'chnroute'),
			(e.btntitle = _('Update')),
			(e.btnstyle = 'apply'),
			(e.onupdate = L.bind(this.handleListUpdate, this)),
			(e = i.option(form.ListValue, 'gfwlist_mirror', _('GFWList mirror'))).value('github', 'GitHub'),
			e.value('gitlab', 'GitLab'),
			e.value('bitbucket', 'Bitbucket'),
			e.value('pagure', 'Pagure'),
			((e = i.option(custom.ListStatusValue, '_gfwlist', _('GFWList'))).listtype = 'gfwlist'),
			(e.btntitle = _('Update')),
			(e.btnstyle = 'apply'),
			(e.onupdate = L.bind(this.handleListUpdate, this)),
			((e = i.option(
				custom.TextValue,
				'_proxy_list',
				_('Extra proxy list'),
				_('One address per line. Allow types: DOMAIN, IP, CIDR. eg: %s, %s, %s').format(
					'www.google.com',
					'1.1.1.1',
					'192.168.0.0/16'
				)
			)).wrap = 'off'),
			(e.rows = 5),
			(e.datatype = 'string'),
			(e.filepath = '/etc/v2ray/proxylist.txt'),
			((e = i.option(
				custom.TextValue,
				'_direct_list',
				_('Extra direct list'),
				_('One address per line. Allow types: DOMAIN, IP, CIDR. eg: %s, %s, %s').format(
					'www.google.com',
					'1.1.1.1',
					'192.168.0.0/16'
				)
			)).wrap = 'off'),
			(e.rows = 5),
			(e.datatype = 'string'),
			(e.filepath = '/etc/v2ray/directlist.txt'),
			(e = i.option(
				form.Value,
				'proxy_list_dns',
				_('Proxy list DNS'),
				_('DNS used for domains in proxy list, format: <code>ip#port</code>. eg: %s').format('1.1.1.1#53')
			)),
			(e = i.option(
				form.Value,
				'direct_list_dns',
				_('Direct list DNS'),
				_('DNS used for domains in direct list, format: <code>ip#port</code>. eg: %s').format(
					'114.114.114.114#53'
				)
			)),
			((e = i.option(
				custom.TextValue,
				'_src_direct_list',
				_('Local devices direct outbound list'),
				_('One address per line. Allow types: IP, CIDR. eg: %s, %s').format('192.168.0.19', '192.168.0.0/16')
			)).wrap = 'off'),
			(e.rows = 3),
			(e.datatype = 'string'),
			(e.filepath = '/etc/v2ray/srcdirectlist.txt'),
			r.render()
		);
	},
});
