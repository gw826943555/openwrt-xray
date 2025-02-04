/**
 * @license
 * Copyright 2020 Xingwang Liao <kuoruan@gmail.com>
 *
 * Licensed to the public under the MIT License.
 */
'use strict';
'require form';
'require uci';
'require xray';
'require ui';
'require view/xray/include/custom as custom';
'require view/xray/tools/converters as converters';
return L.view.extend({
	handleImportSave: function (e) {
		for (var s = e.split(/\r?\n/), o = 0, t = 0, a = s; t < a.length; t++) {
			var r = a[t],
				l = void 0;
			if (r && (l = converters.vmessLinkToVmess(r)) && '2' === l.v) {
				var n = uci.add('v2ray', 'outbound');
				if (n) {
					var d = l.add || '0.0.0.0',
						p = l.port || '0',
						m = l.tls || '',
						i = l.net || '',
						c = l.type || '',
						u = l.path || '',
						f = l.ps || '%s:%s'.format(d, p);
					uci.set('v2ray', n, 'alias', f),
						uci.set('v2ray', n, 'protocol', 'vmess'),
						uci.set('v2ray', n, 's_vmess_address', d),
						uci.set('v2ray', n, 's_vmess_port', p),
						uci.set('v2ray', n, 's_vmess_user_id', l.id || ''),
						uci.set('v2ray', n, 's_vmess_user_alter_id', l.aid || ''),
						uci.set('v2ray', n, 'ss_security', m);
					var v = [];
					switch ((l.host && (v = l.host.split(',')), i)) {
						case 'tcp':
							uci.set('v2ray', n, 'ss_network', 'tcp'),
								uci.set('v2ray', n, 'ss_tcp_header_type', c),
								'http' === c &&
									v.length > 0 &&
									(uci.set('v2ray', n, 'ss_tcp_header_request_headers', ['Host=%s'.format(v[0])]),
									'tls' === m && uci.set('v2ray', n, 'ss_tls_server_name', v[0]));
							break;
						case 'kcp':
						case 'mkcp':
							uci.set('v2ray', n, 'ss_network', 'kcp'), uci.set('v2ray', n, 'ss_kcp_header_type', c);
							break;
						case 'ws':
							uci.set('v2ray', n, 'ss_network', 'ws'), uci.set('v2ray', n, 'ss_websocket_path', u);
							break;
						case 'http':
						case 'h2':
							uci.set('v2ray', n, 'ss_network', 'http'),
								uci.set('v2ray', n, 'ss_http_path', u),
								v.length > 0 &&
									(uci.set('v2ray', n, 'ss_http_host', v),
									uci.set('v2ray', n, 'ss_tls_server_name', v[0]));
							break;
						case 'quic':
							uci.set('v2ray', n, 'ss_network', 'quic'),
								uci.set('v2ray', n, 'ss_quic_header_type', c),
								uci.set('v2ray', n, 'ss_quic_key', u),
								v.length > 0 &&
									(uci.set('v2ray', n, 'ss_quic_security', v[0]),
									'tls' === m && uci.set('v2ray', n, 'ss_tls_server_name', v[0]));
							break;
						default:
							uci.remove('v2ray', n);
							continue;
					}
					o++;
				}
			}
		}
		if (o > 0)
			return uci.save().then(function () {
				ui.showModal(_('Outbound Import'), [
					E('p', {}, _('Imported %d links.').format(o)),
					E(
						'div',
						{ class: 'right' },
						E(
							'button',
							{
								class: 'btn',
								click: ui.createHandlerFn(this, function () {
									return uci.apply().then(function () {
										ui.hideModal(), window.location.reload();
									});
								}),
							},
							_('OK')
						)
					),
				]);
			});
		ui.showModal(_('Outbound Import'), [
			E('p', {}, _('No links imported.')),
			E('div', { class: 'right' }, E('button', { class: 'btn', click: ui.hideModal }, _('OK'))),
		]);
	},
	handleImportClick: function () {
		var e = new ui.Textarea('', {
			rows: 10,
			placeholder: _('You can add multiple links at once, one link per line.'),
			validate: function (e) {
				return e ? !!/^(vmess:\/\/[a-zA-Z0-9/+=]+\s*)+$/i.test(e) || _('Invalid links.') : _('Empty field.');
			},
		});
		ui.showModal(_('Import Vmess Links'), [
			E('div', {}, [E('p', {}, _('Allowed link format: <code>%s</code>').format('vmess://xxxxx')), e.render()]),
			E('div', { class: 'right' }, [
				E('button', { class: 'btn', click: ui.hideModal }, _('Dismiss')),
				' ',
				E(
					'button',
					{
						class: 'cbi-button cbi-button-positive important',
						click: ui.createHandlerFn(
							this,
							function (e) {
								var s;
								if ((e.triggerValidation(), e.isValid() && (s = e.getValue()) && (s = s.trim())))
									return this.handleImportSave(s);
							},
							e
						),
					},
					_('Save')
				),
			]),
		]);
	},
	load: function () {
		return xray.getLocalIPs();
	},
	render: function (e) {
		void 0 === e && (e = []);
		var s,
			o = new form.Map('v2ray', '%s - %s'.format(_('Xray'), _('Outbound'))),
			t = o.section(form.GridSection, 'outbound');
		(t.anonymous = !0),
			(t.addremove = !0),
			(t.sortable = !0),
			(t.modaltitle = function (e) {
				var s = uci.get('v2ray', e, 'alias');
				return _('Outbound') + ' » ' + (null != s ? s : _('Add'));
			}),
			(t.nodescriptions = !0),
			t.tab('general', _('General Settings')),
			t.tab('stream', _('Stream Settings')),
			t.tab('other', _('Other Settings')),
			((s = t.taboption('general', form.Value, 'alias', _('Alias'))).rmempty = !1),
			((s = t.taboption('general', form.Value, 'send_through', _('Send through'))).datatype = 'ipaddr');
		for (var a = 0, r = e; a < r.length; a++) {
			var l = r[a];
			s.value(l);
		}
		(s = t.taboption('general', form.ListValue, 'protocol', _('Protocol'))).value('blackhole', 'Blackhole'),
			s.value('dns', 'DNS'),
			s.value('freedom', 'Freedom'),
			s.value('http', 'HTTP/2'),
			s.value('mtproto', 'MTProto'),
			s.value('shadowsocks', 'Shadowsocks'),
			s.value('socks', 'Socks'),
			s.value('vmess', 'VMess'),
			((s = t.taboption(
				'general',
				form.ListValue,
				's_blackhole_reponse_type',
				'%s - %s'.format('Blackhole', _('Response type'))
			)).modalonly = !0),
			s.depends('protocol', 'blackhole'),
			s.value(''),
			s.value('none', _('None')),
			s.value('http', 'HTTP'),
			((s = t.taboption(
				'general',
				form.ListValue,
				's_dns_network',
				'%s - %s'.format('DNS', _('Network'))
			)).modalonly = !0),
			s.depends('protocol', 'dns'),
			s.value(''),
			s.value('tcp', 'TCP'),
			s.value('udp', 'UDP'),
			((s = t.taboption(
				'general',
				form.Value,
				's_dns_address',
				'%s - %s'.format('DNS', _('Address'))
			)).modalonly = !0),
			s.depends('protocol', 'dns'),
			((s = t.taboption('general', form.Value, 's_dns_port', '%s - %s'.format('DNS', _('Port')))).modalonly = !0),
			s.depends('protocol', 'dns'),
			(s.datatype = 'port'),
			((s = t.taboption(
				'general',
				form.ListValue,
				's_freedom_domain_strategy',
				'%s - %s'.format('Freedom', _('Domain strategy'))
			)).modalonly = !0),
			s.depends('protocol', 'freedom'),
			s.value(''),
			s.value('AsIs'),
			s.value('UseIP'),
			s.value('UseIPv4'),
			s.value('UseIPv6'),
			((s = t.taboption(
				'general',
				form.Value,
				's_freedom_redirect',
				'%s - %s'.format('Freedom', _('Redirect'))
			)).modalonly = !0),
			s.depends('protocol', 'freedom'),
			((s = t.taboption(
				'general',
				form.Value,
				's_freedom_user_level',
				'%s - %s'.format('Freedom', _('User level'))
			)).modalonly = !0),
			s.depends('protocol', 'freedom'),
			(s.datatype = 'uinteger'),
			((s = t.taboption(
				'general',
				form.Value,
				's_http_server_address',
				'%s - %s'.format('HTTP', _('Server address'))
			)).modalonly = !0),
			s.depends('protocol', 'http'),
			(s.datatype = 'host'),
			((s = t.taboption(
				'general',
				form.Value,
				's_http_server_port',
				'%s - %s'.format('HTTP', _('Server port'))
			)).modalonly = !0),
			s.depends('protocol', 'http'),
			(s.datatype = 'port'),
			((s = t.taboption(
				'general',
				form.Value,
				's_http_account_user',
				'%s - %s'.format('HTTP', _('User'))
			)).modalonly = !0),
			s.depends('protocol', 'http'),
			((s = t.taboption(
				'general',
				form.Value,
				's_http_account_pass',
				'%s - %s'.format('HTTP', _('Password'))
			)).modalonly = !0),
			s.depends('protocol', 'http'),
			(s.password = !0),
			((s = t.taboption(
				'general',
				form.Value,
				's_shadowsocks_email',
				'%s - %s'.format('Shadowsocks', _('Email'))
			)).modalonly = !0),
			s.depends('protocol', 'shadowsocks'),
			((s = t.taboption(
				'general',
				form.Value,
				's_shadowsocks_address',
				'%s - %s'.format('Shadowsocks', _('Address'))
			)).modalonly = !0),
			s.depends('protocol', 'shadowsocks'),
			(s.datatype = 'host'),
			((s = t.taboption(
				'general',
				form.Value,
				's_shadowsocks_port',
				'%s - %s'.format('Shadowsocks', _('Port'))
			)).modalonly = !0),
			s.depends('protocol', 'shadowsocks'),
			(s.datatype = 'port'),
			((s = t.taboption(
				'general',
				form.ListValue,
				's_shadowsocks_method',
				'%s - %s'.format('Shadowsocks', _('Method'))
			)).modalonly = !0),
			s.depends('protocol', 'shadowsocks'),
			s.value(''),
			s.value('aes-256-cfb'),
			s.value('aes-128-cfb'),
			s.value('chacha20'),
			s.value('chacha20-ietf'),
			s.value('aes-256-gcm'),
			s.value('aes-128-gcm'),
			s.value('chacha20-poly1305'),
			s.value('chacha20-ietf-poly1305'),
			((s = t.taboption(
				'general',
				form.Value,
				's_shadowsocks_password',
				'%s - %s'.format('Shadowsocks', _('Password'))
			)).modalonly = !0),
			s.depends('protocol', 'shadowsocks'),
			(s.password = !0),
			((s = t.taboption(
				'general',
				form.Value,
				's_shadowsocks_level',
				'%s - %s'.format('Shadowsocks', _('User level'))
			)).modalonly = !0),
			s.depends('protocol', 'shadowsocks'),
			(s.datatype = 'uinteger'),
			((s = t.taboption(
				'general',
				form.Flag,
				's_shadowsocks_ota',
				'%s - %s'.format('Shadowsocks', _('OTA'))
			)).modalonly = !0),
			s.depends('protocol', 'shadowsocks'),
			((s = t.taboption(
				'general',
				form.Value,
				's_socks_server_address',
				'%s - %s'.format('Socks', _('Server address'))
			)).modalonly = !0),
			s.depends('protocol', 'socks'),
			(s.datatype = 'host'),
			((s = t.taboption(
				'general',
				form.Value,
				's_socks_server_port',
				'%s - %s'.format('Socks', _('Server port'))
			)).modalonly = !0),
			s.depends('protocol', 'socks'),
			(s.datatype = 'port'),
			((s = t.taboption(
				'general',
				form.Value,
				's_socks_account_user',
				'%s - %s'.format('Socks', _('User'))
			)).modalonly = !0),
			s.depends('protocol', 'socks'),
			((s = t.taboption(
				'general',
				form.Value,
				's_socks_account_pass',
				'%s - %s'.format('Socks', _('Password'))
			)).modalonly = !0),
			s.depends('protocol', 'socks'),
			(s.password = !0),
			((s = t.taboption(
				'general',
				form.Value,
				's_socks_user_level',
				'%s - %s'.format('Socks', _('User level'))
			)).modalonly = !0),
			s.depends('protocol', 'socks'),
			(s.datatype = 'uinteger'),
			((s = t.taboption(
				'general',
				form.Value,
				's_vmess_address',
				'%s - %s'.format('VMess', _('Address'))
			)).modalonly = !0),
			s.depends('protocol', 'vmess'),
			(s.datatype = 'host'),
			((s = t.taboption(
				'general',
				form.Value,
				's_vmess_port',
				'%s - %s'.format('VMess', _('Port'))
			)).modalonly = !0),
			s.depends('protocol', 'vmess'),
			(s.datatype = 'port'),
			((s = t.taboption(
				'general',
				form.Value,
				's_vmess_user_id',
				'%s - %s'.format('VMess', _('User ID'))
			)).modalonly = !0),
			s.depends('protocol', 'vmess'),
			((s = t.taboption(
				'general',
				form.Value,
				's_vmess_user_alter_id',
				'%s - %s'.format('VMess', _('Alter ID'))
			)).modalonly = !0),
			s.depends('protocol', 'vmess'),
			(s.datatype = 'and(uinteger, max(65535))'),
			((s = t.taboption(
				'general',
				form.ListValue,
				's_vmess_user_security',
				'%s - %s'.format('VMess', _('Security'))
			)).modalonly = !0),
			s.depends('protocol', 'vmess'),
			s.value(''),
			s.value('auto', _('Auto')),
			s.value('aes-128-gcm'),
			s.value('chacha20-poly1305'),
			s.value('none', _('None')),
			((s = t.taboption(
				'general',
				form.Value,
				's_vmess_user_level',
				'%s - %s'.format('VMess', _('User level'))
			)).modalonly = !0),
			s.depends('protocol', 'vmess'),
			(s.datatype = 'uinteger'),
			(s = t.taboption('stream', form.ListValue, 'ss_network', _('Network'))).value(''),
			s.value('tcp', 'TCP'),
			s.value('kcp', 'mKCP'),
			s.value('ws', 'WebSocket'),
			s.value('http', 'HTTP/2'),
			s.value('domainsocket', 'Domain Socket'),
			s.value('quic', 'QUIC'),
			((s = t.taboption('stream', form.ListValue, 'ss_security', _('Security'))).modalonly = !0),
			s.value(''),
			s.value('none', _('None')),
			s.value('tls', 'TLS'),
			((s = t.taboption(
				'stream',
				form.Value,
				'ss_tls_server_name',
				'%s - %s'.format('TLS', _('Server name'))
			)).modalonly = !0),
			s.depends('ss_security', 'tls'),
			((s = t.taboption('stream', form.Value, 'ss_tls_alpn', '%s - %s'.format('TLS', 'ALPN'))).modalonly = !0),
			s.depends('ss_security', 'tls'),
			(s.placeholder = 'http/1.1'),
			((s = t.taboption(
				'stream',
				form.Flag,
				'ss_tls_allow_insecure',
				'%s - %s'.format('TLS', _('Allow insecure'))
			)).modalonly = !0),
			s.depends('ss_security', 'tls'),
			((s = t.taboption(
				'stream',
				form.Flag,
				'ss_tls_allow_insecure_ciphers',
				'%s - %s'.format('TLS', _('Allow insecure ciphers'))
			)).modalonly = !0),
			s.depends('ss_security', 'tls'),
			((s = t.taboption(
				'stream',
				form.Flag,
				'ss_tls_disable_system_root',
				'%s - %s'.format('TLS', _('Disable system root'))
			)).modalonly = !0),
			s.depends('ss_security', 'tls'),
			((s = t.taboption(
				'stream',
				form.ListValue,
				'ss_tls_cert_usage',
				'%s - %s'.format('TLS', _('Certificate usage'))
			)).modalonly = !0),
			s.depends('ss_security', 'tls'),
			s.value(''),
			s.value('encipherment'),
			s.value('verify'),
			s.value('issue'),
			((s = t.taboption(
				'stream',
				form.Value,
				'ss_tls_cert_fiile',
				'%s - %s'.format('TLS', _('Certificate file'))
			)).modalonly = !0),
			s.depends('ss_security', 'tls'),
			((s = t.taboption(
				'stream',
				form.Value,
				'ss_tls_key_file',
				'%s - %s'.format('TLS', _('Key file'))
			)).modalonly = !0),
			s.depends('ss_security', 'tls'),
			((s = t.taboption(
				'stream',
				form.ListValue,
				'ss_tcp_header_type',
				'%s - %s'.format('TCP', _('Header type'))
			)).modalonly = !0),
			s.depends('ss_network', 'tcp'),
			s.value(''),
			s.value('none', _('None')),
			s.value('http', 'HTTP'),
			((s = t.taboption(
				'stream',
				form.Value,
				'ss_tcp_header_request_version',
				'%s - %s'.format('TCP', _('HTTP request version'))
			)).modalonly = !0),
			s.depends('ss_tcp_header_type', 'http'),
			((s = t.taboption(
				'stream',
				form.ListValue,
				'ss_tcp_header_request_method',
				'%s - %s'.format('TCP', _('HTTP request method'))
			)).modalonly = !0),
			s.depends('ss_tcp_header_type', 'http'),
			s.value(''),
			s.value('GET'),
			s.value('HEAD'),
			s.value('POST'),
			s.value('DELETE'),
			s.value('PUT'),
			s.value('PATCH'),
			s.value('OPTIONS'),
			((s = t.taboption(
				'stream',
				form.Value,
				'ss_tcp_header_request_path',
				'%s - %s'.format('TCP', _('Request path'))
			)).modalonly = !0),
			s.depends('ss_tcp_header_type', 'http'),
			((s = t.taboption(
				'stream',
				form.DynamicList,
				'ss_tcp_header_request_headers',
				'%s - %s'.format('TCP', _('Request headers')),
				_('A list of HTTP headers, format: <code>header=value</code>. eg: %s').format('Host=www.bing.com')
			)).modalonly = !0),
			s.depends('ss_tcp_header_type', 'http'),
			((s = t.taboption(
				'stream',
				form.Value,
				'ss_tcp_header_response_version',
				'%s - %s'.format('TCP', _('HTTP response version'))
			)).modalonly = !0),
			s.depends('ss_tcp_header_type', 'http'),
			((s = t.taboption(
				'stream',
				form.Value,
				'ss_tcp_header_response_status',
				'%s - %s'.format('TCP', _('HTTP response status'))
			)).modalonly = !0),
			s.depends('ss_tcp_header_type', 'http'),
			((s = t.taboption(
				'stream',
				form.Value,
				'ss_tcp_header_response_reason',
				'%s - %s'.format('TCP', _('HTTP response reason'))
			)).modalonly = !0),
			s.depends('ss_tcp_header_type', 'http'),
			((s = t.taboption(
				'stream',
				form.DynamicList,
				'ss_tcp_header_response_headers',
				'%s - %s'.format('TCP', _('Response headers')),
				_('A list of HTTP headers, format: <code>header=value</code>. eg: %s').format('Host=www.bing.com')
			)).modalonly = !0),
			s.depends('ss_tcp_header_type', 'http'),
			((s = t.taboption(
				'stream',
				form.Value,
				'ss_kcp_mtu',
				'%s - %s'.format('mKCP', _('Maximum transmission unit (MTU)'))
			)).modalonly = !0),
			s.depends('ss_network', 'kcp'),
			(s.datatype = 'and(min(576), max(1460))'),
			(s.placeholder = '1350'),
			((s = t.taboption(
				'stream',
				form.Value,
				'ss_kcp_tti',
				'%s - %s'.format('mKCP', _('Transmission time interval (TTI)'))
			)).modalonly = !0),
			s.depends('ss_network', 'kcp'),
			(s.datatype = 'and(min(10), max(100))'),
			(s.placeholder = '50'),
			((s = t.taboption(
				'stream',
				form.Value,
				'ss_kcp_uplink_capacity',
				'%s - %s'.format('mKCP', _('Uplink capacity'))
			)).modalonly = !0),
			s.depends('ss_network', 'kcp'),
			(s.datatype = 'uinteger'),
			(s.placeholder = '5'),
			((s = t.taboption(
				'stream',
				form.Value,
				'ss_kcp_downlink_capacity',
				'%s - %s'.format('mKCP', _('Downlink capacity'))
			)).modalonly = !0),
			s.depends('ss_network', 'kcp'),
			(s.datatype = 'uinteger'),
			(s.placeholder = '20'),
			((s = t.taboption(
				'stream',
				form.Flag,
				'ss_kcp_congestion',
				'%s - %s'.format('mKCP', _('Congestion enabled'))
			)).modalonly = !0),
			s.depends('ss_network', 'kcp'),
			((s = t.taboption(
				'stream',
				form.Value,
				'ss_kcp_read_buffer_size',
				'%s - %s'.format('mKCP', _('Read buffer size'))
			)).modalonly = !0),
			s.depends('ss_network', 'kcp'),
			(s.datatype = 'uinteger'),
			(s.placeholder = '2'),
			((s = t.taboption(
				'stream',
				form.Value,
				'ss_kcp_write_buffer_size',
				'%s - %s'.format('mKCP', _('Write buffer size'))
			)).modalonly = !0),
			s.depends('ss_network', 'kcp'),
			(s.datatype = 'uinteger'),
			(s.placeholder = '2'),
			((s = t.taboption(
				'stream',
				form.ListValue,
				'ss_kcp_header_type',
				'%s - %s'.format('mKCP', _('Header type'))
			)).modalonly = !0),
			s.depends('ss_network', 'kcp'),
			s.value(''),
			s.value('none', _('None')),
			s.value('srtp', 'SRTP'),
			s.value('utp', 'uTP'),
			s.value('wechat-video', _('Wechat Video')),
			s.value('dtls', 'DTLS 1.2'),
			s.value('wireguard', 'WireGuard'),
			((s = t.taboption(
				'stream',
				form.Value,
				'ss_websocket_path',
				'%s - %s'.format('WebSocket', _('Path'))
			)).modalonly = !0),
			s.depends('ss_network', 'ws'),
			((s = t.taboption(
				'stream',
				form.DynamicList,
				'ss_websocket_headers',
				'%s - %s'.format('WebSocket', _('Headers')),
				_('A list of HTTP headers, format: <code>header=value</code>. eg: %s').format('Host=www.bing.com')
			)).modalonly = !0),
			s.depends('ss_network', 'ws'),
			((s = t.taboption(
				'stream',
				form.DynamicList,
				'ss_http_host',
				'%s - %s'.format('HTTP/2', _('Host'))
			)).modalonly = !0),
			s.depends('ss_network', 'http'),
			((s = t.taboption(
				'stream',
				form.Value,
				'ss_http_path',
				'%s - %s'.format('HTTP/2', _('Path'))
			)).modalonly = !0),
			s.depends('ss_network', 'http'),
			(s.placeholder = '/'),
			((s = t.taboption(
				'stream',
				form.Value,
				'ss_domainsocket_path',
				'%s - %s'.format('Domain Socket', _('Path'))
			)).modalonly = !0),
			s.depends('ss_network', 'domainsocket'),
			((s = t.taboption(
				'stream',
				form.ListValue,
				'ss_quic_security',
				'%s - %s'.format('QUIC', _('Security'))
			)).modalonly = !0),
			s.depends('ss_network', 'quic'),
			s.value(''),
			s.value('none', _('None')),
			s.value('aes-128-gcm'),
			s.value('chacha20-poly1305'),
			((s = t.taboption('stream', form.Value, 'ss_quic_key', '%s - %s'.format('QUIC', _('Key')))).modalonly = !0),
			s.depends('ss_quic_security', 'aes-128-gcm'),
			s.depends('ss_quic_security', 'chacha20-poly1305'),
			((s = t.taboption(
				'stream',
				form.ListValue,
				'ss_quic_header_type',
				'%s - %s'.format('QUIC', _('Header type'))
			)).modalonly = !0),
			s.depends('ss_network', 'quic'),
			s.value(''),
			s.value('none', _('None')),
			s.value('srtp', 'SRTP'),
			s.value('utp', 'uTP'),
			s.value('wechat-video', _('Wechat Video')),
			s.value('dtls', 'DTLS 1.2'),
			s.value('wireguard', 'WireGuard'),
			((s = t.taboption(
				'stream',
				form.Value,
				'ss_sockopt_mark',
				'%s - %s'.format(_('Sockopt'), _('Mark')),
				_('If transparent proxy is enabled, this option is ignored and will be set to 255.')
			)).modalonly = !0),
			(s.placeholder = '255'),
			((s = t.taboption(
				'stream',
				form.ListValue,
				'ss_sockopt_tcp_fast_open',
				'%s - %s'.format(_('Sockopt'), _('TCP fast open'))
			)).modalonly = !0),
			s.value(''),
			s.value('0', _('False')),
			s.value('1', _('True')),
			(s = t.taboption('general', form.Value, 'tag', _('Tag'))),
			((s = t.taboption(
				'general',
				form.Value,
				'proxy_settings_tag',
				'%s - %s'.format(_('Proxy settings'), _('Tag'))
			)).modalonly = !0),
			((s = t.taboption(
				'other',
				form.Flag,
				'mux_enabled',
				'%s - %s'.format(_('Mux'), _('Enabled'))
			)).modalonly = !0),
			((s = t.taboption(
				'other',
				form.Value,
				'mux_concurrency',
				'%s - %s'.format(_('Mux'), _('Concurrency'))
			)).modalonly = !0),
			(s.datatype = 'uinteger'),
			(s.placeholder = '8');
		var n = this;
		return o.render().then(function (e) {
			var s = o.findElement('id', 'cbi-v2ray-outbound'),
				t = E(
					'div',
					{ class: 'cbi-section-create cbi-tblsection-create' },
					E(
						'button',
						{
							class: 'cbi-button cbi-button-neutral',
							title: _('Import'),
							click: L.bind(n.handleImportClick, n),
						},
						_('Import')
					)
				);
			return L.dom.append(s, t), e;
		});
	},
});
