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
var callRunningStatus = rpc.declare({
		object: 'luci.v2ray',
		method: 'runningStatus',
		params: [],
		expect: { '': { code: 1 } },
	}),
	callListStatus = rpc.declare({
		object: 'luci.v2ray',
		method: 'listStatus',
		params: ['name'],
		expect: { '': { code: 1 } },
		filter: function (t) {
			return 0 === t.code ? { count: t.count, datetime: t.datetime } : { count: 0, datetime: _('Unknown') };
		},
	}),
	callV2RayVersion = rpc.declare({
		object: 'luci.v2ray',
		method: 'v2rayVersion',
		params: [],
		expect: { '': { code: 1 } },
		filter: function (t) {
			return t.code ? '' : t.version;
		},
	}),
	CUSTOMTextValue = form.TextValue.extend({
		__name__: 'CUSTOM.TextValue',
		filepath: null,
		isjson: !1,
		required: !1,
		cfgvalue: function () {
			return this.filepath
				? L.resolveDefault(fs.read(this.filepath), '')
				: this.super('cfgvalue', L.toArray(arguments));
		},
		write: function (t, e) {
			if (!this.filepath) return this.super('write', L.toArray(arguments));
			var i = e.trim().replace(/\r\n/g, '\n') + '\n';
			return fs.write(this.filepath, i);
		},
		validate: function (t, e) {
			if (this.required && !e) {
				var i = this.titleFn('title', t);
				return _('%s is required.').format(i);
			}
			if (this.isjson) {
				var n = void 0;
				try {
					n = JSON.parse(e);
				} catch (t) {
					n = null;
				}
				if (!n || 'object' != typeof n) return _('Invalid JSON content.');
			}
			return !0;
		},
	}),
	CUSTOMListStatusValue = form.AbstractValue.extend({
		__name__: 'CUSTOM.ListStatusValue',
		listtype: null,
		onupdate: null,
		btnstyle: 'button',
		btntitle: null,
		cfgvalue: function () {
			return (
				this.listtype || L.error('TypeError', _('Listtype is required')),
				L.resolveDefault(callListStatus(this.listtype), { count: 0, datetime: _('Unknown') })
			);
		},
		render: function (t, e) {
			return Promise.resolve(this.cfgvalue(e)).then(
				L.bind(function (i) {
					var n = void 0 === i ? {} : i,
						s = n.count,
						a = void 0 === s ? 0 : s,
						r = n.datetime,
						o = void 0 === r ? '' : r,
						u = this.titleFn('title', e),
						l = this.uciconfig || this.section.uciconfig || this.map.config,
						c = this.transformDepList(e),
						d = [
							E('div', {}, [
								E('span', { style: 'color: #ff8c00;margin-right: 5px;' }, _('Total: %s').format(a)),
								_('Time: %s').format(o),
								E(
									'button',
									{
										style: 'margin-left: 10px;',
										class: 'cbi-button cbi-button-%s'.format(this.btnstyle || 'button'),
										click: ui.createHandlerFn(
											this,
											function (t, e, i) {
												if ('function' == typeof this.onupdate) return this.onupdate(i, t, e);
											},
											e,
											this.listtype
										),
									},
									this.titleFn('btntitle', e) || u
								),
							]),
						];
					'string' == typeof this.description &&
						'' !== this.description &&
						d.push(E('div', { class: 'cbi-value-description' }, this.description));
					var f = E(
						'div',
						{
							class: 'cbi-value',
							id: 'cbi-%s-%s-%s'.format(l, e, this.option),
							'data-index': t,
							'data-depends': c,
							'data-field': this.cbid(e),
							'data-name': this.option,
							'data-widget': this.__name__,
						},
						[
							E(
								'label',
								{ class: 'cbi-value-title', for: 'widget.cbid.%s.%s.%s'.format(l, e, this.option) },
								[u]
							),
							E('div', { class: 'cbi-value-field' }, d),
						]
					);
					return (
						c && c.length && f.classList.add('hidden'),
						f.addEventListener('widget-change', L.bind(this.map.checkDepends, this.map)),
						L.dom.bindClassInstance(f, this),
						f
					);
				}, this)
			);
		},
		remove: function () {},
		write: function () {},
	}),
	CUSTOMRunningStatus = form.AbstractValue.extend({
		__name__: 'CUSTOM.RunningStatus',
		fetchVersion: function (t) {
			L.resolveDefault(callV2RayVersion(), '').then(function (e) {
				L.dom.content(
					t,
					e
						? _('Version: %s').format(e)
						: E('em', { style: 'color: red;' }, _('Unable to get Xray version.'))
				);
			});
		},
		pollStatus: function (t) {
			var e = E('em', { style: 'color: red;' }, _('Not Running')),
				i = E('em', { style: 'color: green;' }, _('Running'));
			L.Poll.add(function () {
				L.resolveDefault(callRunningStatus(), { code: 0 }).then(function (n) {
					L.dom.content(t, n.code ? e : i);
				});
			}, 5);
		},
		load: function () {},
		cfgvalue: function () {},
		render: function () {
			var t = E('span', { style: 'margin-left: 5px' }, E('em', {}, _('Collecting data...'))),
				e = E('span', {}, _('Getting...'));
			return this.pollStatus(t), this.fetchVersion(e), E('div', { class: 'cbi-value' }, [t, ' / ', e]);
		},
		remove: function () {},
		write: function () {},
	});
return L.Class.extend({
	TextValue: CUSTOMTextValue,
	ListStatusValue: CUSTOMListStatusValue,
	RunningStatus: CUSTOMRunningStatus,
});
