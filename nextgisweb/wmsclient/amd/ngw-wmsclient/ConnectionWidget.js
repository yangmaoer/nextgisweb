define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/_base/array",
    "dijit/layout/ContentPane",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "ngw-resource/serialize",
    // resource
    "dojo/text!./template/ConnectionWidget.html",
    "ngw/settings!wmsclient",
    // template
    "dijit/form/ValidationTextBox",
    "dijit/form/Select",
    "dijit/form/CheckBox",
    "dojox/layout/TableContainer"
], function (
    declare,
    lang,
    array,
    ContentPane,
    _TemplatedMixin,
    _WidgetsInTemplateMixin,
    serialize,
    template,
    settings
) {
    return declare([ContentPane, serialize.Mixin, _TemplatedMixin, _WidgetsInTemplateMixin], {
        templateString: template,
        title: "Соединение WMS",
        serializePrefix: "wmsclient_connection",

        postCreate: function () {
            this.inherited(arguments);

            array.forEach(settings.wms_versions, function (i) {
                this.wVersion.addOption([{value: i, label: i}]);
            }, this);

            if (this.value) {
                this.wVersion.set("value", this.value.version);
            }
        },

        serializeInMixin: function (data) {
            var value = this.wCapCache.get("value");
            if (value !== "") {
                lang.setObject(this.serializePrefix + ".capcache", value, data);
            }
        }

    });
});