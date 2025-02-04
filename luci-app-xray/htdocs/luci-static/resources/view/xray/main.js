/**
 * @license
 * Copyright 2020 Xingwang Liao <kuoruan@gmail.com>
 *
 * Licensed to the public under the MIT License.
 */
'use strict';
'require form';
'require fs';
'require ui';
'require xray';
'require view/xray/include/custom as custom';
return L.view.extend({
	handleServiceReload: function (e) {
		return fs
			.exec('/etc/init.d/v2ray', ['reload'])
			.then(
				L.bind(
					function (e, o) {
						0 !== o.code &&
							(ui.addNotification(null, [
								E('p', _('Reload service failed with code %d').format(o.code)),
								o.stderr ? E('pre', {}, [o.stderr]) : '',
							]),
							L.raise('Error', 'Reload failed'));
					},
					this,
					e.target
				)
			)
			.catch(function (e) {
				ui.addNotification(null, E('p', e.message));
			});
	},
	load: function () {
		return Promise.all([xray.getSections('inbound'), xray.getSections('outbound')]);
	},
	render: function (e) {
		var o,
			r = void 0 === e ? [] : e,
			a = r[0],
			t = void 0 === a ? [] : a,
			n = r[1],
			i = void 0 === n ? [] : n,
			l = new form.Map(
				'v2ray',
				'%s - %s'.format(_('Xray'), _('Global Settings')),
				'<p>%s</p><p>%s</p>'.format(
					_('A platform for building proxies to bypass network restrictions.'),
					_('For more information, please visit: %s').format(
						'<a href="https://xtls.github.io/Xray-docs-next/" target="_blank">https://xtls.github.io/Xray-docs-next/</a>'
					)
				)
			),
			s = l.section(form.NamedSection, 'main', 'v2ray');
		(s.addremove = !1),
			(s.anonymous = !0),
			s.option(custom.RunningStatus, '_status'),
			((o = s.option(form.Flag, 'enabled', _('Enabled'))).rmempty = !1),
			((o = s.option(
				form.Button,
				'_reload',
				_('Reload Service'),
				_('This will restart service when config file changes.')
			)).inputstyle = 'action reload'),
			(o.inputtitle = _('Reload')),
			(o.onclick = L.bind(this.handleServiceReload, this)),
			((o = s.option(
				form.Value,
				'v2ray_file',
				_('Xray file'),
				_('Set the Xray executable file path.')
			)).datatype = 'file'),
			(o.placeholder = '/usr/bin/xray'),
			(o.rmempty = !1),
			((o = s.option(
				form.Value,
				'asset_location',
				_('Xray asset location'),
				_('Directory where geoip.dat and geosite.dat files are, default: /usr/share/xray/.')
			)).datatype = 'directory'),
			(o.placeholder = '/usr/share/xray/'),
			((o = s.option(
				form.Value,
				'mem_percentage',
				_('Memory percentage'),
				_('The maximum percentage of memory used by Xray.')
			)).datatype = 'and(uinteger, max(100))'),
			(o.placeholder = '80'),
			((o = s.option(form.Value, 'config_file', _('Config file'), _('Use custom config file.'))).datatype =
				'file'),
			o.value('', _('None')),
			(o = s.option(form.Value, 'access_log', _('Access log file'), _('Access Log file path. Disable access log if none'))).depends('config_file', ''),
			o.value('none'),
			o.value('/var/log/v2ray-access.log'),
			(o = s.option(form.ListValue, 'loglevel', _('Log level'))).depends('config_file', ''),
			o.value('debug', _('Debug')),
			o.value('info', _('Info')),
			o.value('warning', _('Warning')),
			o.value('error', _('Error')),
			o.value('none', _('None')),
			(o.default = 'warning'),
			(o = s.option(form.Value, 'error_log', _('Error log file'))).value('/dev/null'),
			o.value('/var/log/v2ray-error.log'),
			o.depends('loglevel', 'debug'),
			o.depends('loglevel', 'info'),
			o.depends('loglevel', 'warning'),
			o.depends('loglevel', 'error'),
			(o = s.option(form.MultiValue, 'inbounds', _('Inbounds enabled'))).depends('config_file', '');
		for (var d = 0, u = t; d < u.length; d++) {
			var f = u[d];
			o.value(f.value, f.caption);
		}
		(o = s.option(form.MultiValue, 'outbounds', _('Outbounds enabled'))).depends('config_file', '');
		for (var c = 0, p = i; c < p.length; c++) {
			var v = p[c];
			o.value(v.value, v.caption);
		}
		return (
			(o = s.option(form.Flag, 'stats_enabled', '%s - %s'.format(_('Stats'), _('Enabled')))).depends(
				'config_file',
				''
			),
			(o = s.option(form.Flag, 'transport_enabled', '%s - %s'.format(_('Transport'), _('Enabled')))).depends(
				'config_file',
				''
			),
			(o = s.option(
				custom.TextValue,
				'_transport',
				'%s - %s'.format(_('Transport'), _('Settings')),
				_('<code>transport</code> field in top level configuration, JSON string')
			)).depends('transport_enabled', '1'),
			(o.wrap = 'off'),
			(o.rows = 5),
			(o.datatype = 'string'),
			(o.filepath = '/etc/v2ray/transport.json'),
			(o.required = !0),
			(o.isjson = !0),
			l.render()
		);
	},
});
