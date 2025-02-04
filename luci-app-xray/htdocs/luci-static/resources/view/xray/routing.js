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
return L.view.extend({
	load: function () {
		return Promise.all([xray.getSections('routing_rule'), xray.getSections('routing_balancer', 'tag')]);
	},
	render: function (o) {
		var t,
			e = void 0 === o ? [] : o,
			a = e[0],
			r = void 0 === a ? [] : a,
			n = e[1],
			i = void 0 === n ? [] : n,
			l = new form.Map(
				'v2ray',
				'%s - %s'.format(_('Xray'), _('Routing')),
				_('Details: %s').format(
					'<a href="https://xtls.github.io/Xray-docs-next/config/routing.html" target="_blank">RoutingObject</a>'
				)
			),
			u = l.section(form.NamedSection, 'main_routing', 'routing');
		(u.anonymous = !0),
			(u.addremove = !1),
			(t = u.option(form.Flag, 'enabled', _('Enabled'))),
			(t = u.option(form.ListValue, 'domain_strategy', _('Domain resolution strategy'))).value(''),
			t.value('AsIs'),
			t.value('IPIfNonMatch'),
			t.value('IPOnDemand'),
			(t = u.option(form.MultiValue, 'rules', _('Rules'), _('Select routing rules to use')));
		for (var m = 0, s = r; m < s.length; m++) {
			var c = s[m];
			t.value(c.value, c.caption);
		}
		t = u.option(form.MultiValue, 'balancers', _('Balancers'), _('Select routing balancers to use'));
		for (var d = 0, p = i; d < p.length; d++) {
			c = p[d];
			t.value(c.value, c.caption);
		}
		var g = l.section(form.GridSection, 'routing_rule', _('Routing Rule'), _('Add routing rules here'));
		(g.anonymous = !0),
			(g.addremove = !0),
			(g.sortable = !0),
			(g.nodescription = !0),
			((t = g.option(form.Value, 'alias', _('Alias'))).rmempty = !1),
			(t = g.option(form.ListValue, 'type', _('Type'))).value('field'),
			((t = g.option(form.DynamicList, 'domain', _('Domain'))).modalonly = !0),
			((t = g.option(form.DynamicList, 'ip', _('IP'))).modalonly = !0),
			((t = g.option(form.DynamicList, 'port', _('Port'))).modalonly = !0),
			(t.datatype = 'or(port, portrange)'),
			(t = g.option(form.MultiValue, 'network', _('Network'))).value('tcp'),
			t.value('udp'),
			((t = g.option(form.DynamicList, 'source', _('Source'))).modalonly = !0),
			((t = g.option(form.DynamicList, 'user', _('User'))).modalonly = !0),
			(t = g.option(form.DynamicList, 'inbound_tag', _('Inbound tag'))),
			((t = g.option(form.MultiValue, 'protocol', _('Protocol'))).modalonly = !0),
			t.value('http'),
			t.value('tls'),
			t.value('bittorrent'),
			((t = g.option(form.Value, 'attrs', _('Attrs'))).modalonly = !0),
			(t = g.option(form.Value, 'outbound_tag', _('Outbound tag'))),
			((t = g.option(form.Value, 'balancer_tag', _('Balancer tag'))).modalonly = !0),
			t.depends('outbound_tag', '');
		var f = l.section(
			form.TypedSection,
			'routing_balancer',
			_('Routing Balancer', _('Add routing balancers here'))
		);
		return (
			(f.anonymous = !0),
			(f.addremove = !0),
			((t = f.option(form.Value, 'tag', _('Tag'))).rmempty = !1),
			(t = f.option(form.DynamicList, 'selector', _('Selector'))),
			l.render()
		);
	},
});
