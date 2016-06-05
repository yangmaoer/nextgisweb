define([
    "dojo/_base/declare",
    "dijit/Editor",
    "dijit/_editor/plugins/LinkDialog",
    "ngw-resource/serialize",
    "ngw-pyramid/i18n!resource"
], function (
    declare,
    Editor,
    LinkDialog,
    serialize,
    i18n
) {
    return declare("ngw.resource.DescriptionWidget", [Editor, serialize.Mixin], {
        title: i18n.gettext("Description"),
        extraPlugins: ["|", "createLink", "unlink"],

        constructor: function () {
            this.value = "";
            this.contentPostFilters.push(function(value) {
                return (value === "") ? null : value;
            });
        },

        postCreate: function () {
            this.inherited(arguments);
            this.serattrmap.push({key: "resource.description", widget: this});
        },

        _setValueAttr: function (value) {
            if (value !== null && value !== undefined) {
                this.inherited(arguments);
            } else {
                this.set("value", "");
            }
        }
    });
});
