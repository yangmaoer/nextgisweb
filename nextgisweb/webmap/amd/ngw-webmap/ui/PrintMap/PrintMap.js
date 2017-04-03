define([
    'dojo/_base/declare',
    'dojo/query',
    'dojo/aspect',
    'dojo/_base/window',
    'dojo/dom-style',
    'dojo/dom-class',
    'dojo/dom-construct',
    'dojo/_base/array',
    'dojo/_base/lang',
    'dojo/_base/html',
    'dijit/_Widget',
    'dijit/_TemplatedMixin',
    'dijit/_WidgetsInTemplateMixin',
    'dijit/Dialog',
    'dojo/on',
    'dojox/layout/TableContainer',
    'dijit/form/TextBox',
    'dijit/form/NumberTextBox',
    'ngw/openlayers/Map',
    'openlayers/ol',
    'dojo/text!./PrintMap.html',
    'xstyle/css!./PrintMap.css'
], function (declare, query, aspect, win, domStyle, domClass, domConstruct,
             array, lang, html, _Widget, _TemplatedMixin, _WidgetsInTemplateMixin,
             Dialog, on, TableContainer, TextBox, NumberTextBox, Map, ol, template) {

    var PrintMapDialog = declare([Dialog], {
        id: 'printMapDialog',
        contentId: 'printMapContent',
        title: 'Печать карты',
        isDestroyedAfterHiding: true,
        isClosedAfterButtonClick: true,
        template: template,
        printElementId: 'printMap',
        printElement: null,
        printElementMap: null,
        printMap: null,
        style: 'width: 100%; height: 100%;',
        printCssElement: null,

        constructor: function (settings) {
            lang.mixin(this, settings);

            var contentWidget = new (declare([_Widget, _TemplatedMixin, _WidgetsInTemplateMixin], {
                id: this.contentId,
                templateString: template,
                message: this.message,
                buttonOk: this.buttonOk,
                buttonCancel: this.buttonCancel,
                style: 'width: 100%; height: 100%;'
            }));

            contentWidget.startup();
            this.content = contentWidget;

            this.hide = this._hideDialog;
        },

        postCreate: function () {
            this.inherited(arguments);

            this.set('draggable', false);

            on(this.content.okButton, 'click', lang.hitch(this, function () {
                window.print();
            }));

            on(this.content.cancelButton, 'click', lang.hitch(this, function () {
                this.hide();
            }));

            on(this.content.sizesSelect, 'change', lang.hitch(this, function () {
                var sizeValues = this.content.sizesSelect.get('value'),
                    parsedSizeValues, height, width;
                if (sizeValues === 'custom') {

                } else {
                    parsedSizeValues = sizeValues.split('_');
                    width = parsedSizeValues[0];
                    height = parsedSizeValues[1];
                    this.content.heightInput.set('value', height);
                    this.content.widthInput.set('value', width);
                    this._resizeMapContainer(width, height);
                }
            }));
        },

        _onResizeWindowSubscriber: null,
        show: function () {
            this.inherited(arguments);

            this._onResizeWindow();
            this._onResizeWindowSubscriber = on(win.global, 'resize', lang.hitch(this, this._onResizeWindow));

            this._buildPrintElement();
            this._buildMap();
            this._buildPrintStyle();
            this.content.sizesSelect.attr('value', '210_297');
        },

        _onResizeWindow: function () {
            var bodyStyle = domStyle.getComputedStyle(document.body),
                w = parseInt(bodyStyle.width, 10),
                h = parseInt(bodyStyle.height, 10);
            this.resize({w: w, h: h, l: 0, t: 0});
        },

        _hideDialog: function () {
            this.printMap.olMap.setTarget(null);
            this.printMap.olMap = null;
            domClass.add(this.printElement, 'inactive');
            this._removePageStyle();
            if (this._onResizeWindowSubscriber) {
                this._onResizeWindowSubscriber.remove();
                this._onResizeWindowSubscriber = null;
            }
            this.destroyRecursive();
            domConstruct.destroy(this.printCssElement);
        },

        _buildPrintElement: function () {
            var printElement = document.getElementById(this.printElementId);
            if (printElement === null) {
                var node = domConstruct.toDom('<div id="' + this.printElementId + '"><div class="map-container map"></div></div>');
                this.printElement = domConstruct.place(node, document.body, 'last');
                this.printElementMap = query('div.map-container', this.printElement)[0];
            } else {
                domConstruct.empty(query('div.map-container', this.printElement)[0]);
                domClass.remove(printElement, 'inactive');
                this.printElement = printElement;
            }
        },

        _buildMap: function () {
            var mapContainer = query('div.map-container', this.printElement)[0];

            this.printMap = new Map({
                target: mapContainer,
                controls: [],
                interactions: ol.interaction.defaults({
                    doubleClickZoom: false,
                    dragAndDrop: false,
                    keyboardPan: false,
                    keyboardZoom: false,
                    mouseWheelZoom: false,
                    pointer: false,
                    select: false
                }),
                view: this.map.getView()
            });

            aspect.after(mapContainer, 'resize', lang.hitch(this, function () {
                this.printMap.olMap.updateSize();
            }));

            array.forEach(this.map.getLayers().getArray(), function (layer) {
                this.printMap.olMap.addLayer(layer);
            }, this);

            this._setPrintMapExtent();
        },

        _setPrintMapExtent: function () {
            var extent = this.map.getView().calculateExtent(this.map.getSize());
            this.printMap.olMap.getView().fit(extent, this.printMap.olMap.getSize());
        },

        _buildPrintStyle: function () {
            if (!printConfig || !printConfig.printMapCssUrl) return false;

            var cssUrl = printConfig.printMapCssUrl,
                linkElement, head;
            linkElement = domConstruct.toDom('<link href="' + cssUrl + '" rel="stylesheet" type="text/css" media="print"/>');
            head = document.getElementsByTagName('head')[0];
            this.printCssElement = domConstruct.place(linkElement, head);
        },

        _resizeMapContainer: function (width, height) {
            var mapContainer = query('div.map-container', this.printElement)[0],
                margin = this.content.marginInput.get('value');

            domStyle.set(mapContainer, {
                height: height + 'mm',
                width: width + 'mm'
            });

            domStyle.set(this.printElement, {
                width: width + 'mm'
            });

            this.printMap.olMap.updateSize();
            this._setPrintMapExtent();
            this._buildPageStyle(width, height, margin);
        },

        _buildPageStyle: function (width, height, margin) {
            var style = this._getPageStyle();
            if (style.sheet.cssRules.length > 0) {
                style.sheet.deleteRule(0);
            }
            style.sheet.insertRule('@page {size:' + width + 'mm ' + height + 'mm; margin: ' + margin + 'mm;}', 0);
        },

        _pageStyle: null,
        _getPageStyle: function () {
            if (this._pageStyle) {
                return this._pageStyle;
            }
            var style = document.createElement('style');
            style.appendChild(document.createTextNode(''));
            document.head.appendChild(style);
            this._pageStyle = style;
            return style;
        },

        _removePageStyle: function () {
            if (this._pageStyle) {
                domConstruct.destroy(this._pageStyle);
            }
        }
    });

    return {
        run: function (olMap) {
            var printMapDialog = new PrintMapDialog({
                map: olMap
            });
            printMapDialog.show();
        }
    }
});