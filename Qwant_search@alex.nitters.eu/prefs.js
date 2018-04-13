const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;

const Gettext = imports.gettext

Gettext.textdomain("Qwant_search@alex.nitters.eu");
Gettext.bindtextdomain("Qwant_search@alex.nitters.eu", Me.path + "/locale");

const _ = Gettext.gettext;

let debug = false;

function logDebug() {
  if (debug) {
    log.apply(
      this,
      Array.from(arguments)
    )
  }
}

const PrefWindow = new GObject.Class({
	Name: 'PrefWindow',
	GTypeName: 'PrefWindow',
	Extends: Gtk.Grid,

	_init: function(params) {
		this.parent(params);
		this.margin = 12;
		this.row_spacing = this.column_spacing = 6;

		this._settings = Convenience.getSettings();

		this.set_orientation(Gtk.Orientation.VERTICAL);

		// Add Widgets
		this._widgets = {};

		// Main container
		this._widgets.box = new Gtk.Box({
			orientation: Gtk.Orientation.VERTICAL,
			margin: 20,
			margin_top: 10,
			expand: true,
			spacing: 10,
		});

		// Add widgets
		this._addStyleSelectorWidget();
		this._addTransparencyLevelWidget();
		this._addBtnShadowSwitch();
		this._addBtnShowActivitySwitch();

		// Insert main container
		this.add(this._widgets.box);
	},

	_addStyleSelectorWidget: function() {
		var label = new Gtk.Label({
			label: '<b>'+_("Catégorie de recherche")+'</b>',
			use_markup: true,
			halign: Gtk.Align.START
		});

		var styleList = new Gtk.ListStore();
		styleList.set_column_types([
			GObject.TYPE_STRING
		]);

		styleList.set(
			styleList.append(),
			[0],
			[_("Tous")]
		);

		styleList.set(
			styleList.append(),
			[1],
			[_("Web")]
		);

		styleList.set(
			styleList.append(),
			[2],
			[_("Actualités")]
		);

		styleList.set(
			styleList.append(),
			[3],
			[_("Social")]
		);

		styleList.set(
			styleList.append(),
			[4],
			[_("Images")]
		);

		styleList.set(
			styleList.append(),
			[5],
			[_("Vidéos")]
		);

		styleList.set(
			styleList.append(),
			[6],
			[_("Shopping")]
		);

		styleList.set(
			styleList.append(),
			[7],
			[_("Musique")]
		);

        let rendererText = new Gtk.CellRendererText();

		this._widgets.style = new Gtk.ComboBox({
			model: styleList
		});

        this._widgets.style.pack_start (rendererText, false);
        this._widgets.style.add_attribute (rendererText, "text", 0);

        if(this._settings.get_string('category') == "web")
        	this._widgets.style.set_active(1);
				if(this._settings.get_string('category') == "news")
	        this._widgets.style.set_active(2);
				if(this._settings.get_string('category') == "social")
	        this._widgets.style.set_active(3);
				if(this._settings.get_string('category') == "images")
	       	this._widgets.style.set_active(4);
				if(this._settings.get_string('category') == "videos")
	       	this._widgets.style.set_active(5);
				if(this._settings.get_string('category') == "shopping")
	        this._widgets.style.set_active(6);
				if(this._settings.get_string('category') == "music")
	        this._widgets.style.set_active(7);
        else
        	this._widgets.style.set_active(0);

		let hbox = new Gtk.Box({
			orientation: Gtk.Orientation.HORIZONTAL,
		});

		hbox.pack_start(label, true, true, 0);
		hbox.add(this._widgets.style);

		this._widgets.box.add(hbox);

        this._widgets.style.connect ('changed', Lang.bind (this, this._categoryChanged));
	},

	_addTransparencyLevelWidget: function() {
		var label = new Gtk.Label({
			label: '<b>'+_("Nombre de suggestions")+'</b>',
			use_markup: true,
			halign: Gtk.Align.START
		});

		var adjustment = new Gtk.Adjustment({
			value: this._settings.get_double('suggestions-amount'),
			lower: 0,
			upper: 10,
			step_increment: 1,
			page_increment: 1
		});

		this._widgets.transparencyLevel = new Gtk.SpinButton({
			adjustment: adjustment
		});

		this._widgets.transparencyLevel.set_digits(2);

		let hbox = new Gtk.Box({
			orientation: Gtk.Orientation.HORIZONTAL,
		});

		hbox.pack_start(label, true, true, 0);
		hbox.add(this._widgets.transparencyLevel);

		this._widgets.box.add(hbox);

		this._widgets.transparencyLevel.connect('value-changed', Lang.bind(this, this._suggestionsAmountChanged));
	},

	_addBtnShadowSwitch: function() {
		var label = new Gtk.Label({
			label: '<b>'+_("Bouton Qwant")+'</b>',
			use_markup: true,
			halign: Gtk.Align.START
		});

		this._widgets.btnShadowSwitch = new Gtk.Switch({active: this._settings.get_boolean('panel-button')});

		let hbox = new Gtk.Box({
			orientation: Gtk.Orientation.HORIZONTAL,
		});

		hbox.pack_start(label, true, true, 0);
		hbox.add(this._widgets.btnShadowSwitch);

		this._widgets.box.add(hbox);

		this._widgets.btnShadowSwitch.connect ('notify::active', Lang.bind (this, this._panelButtonUpdate));
	},

	_categoryChanged: function() {
		let selection = this._widgets.style.get_active();
		logDebug('New category selection : ' + selection);
		if(selection == 1)
			this._settings.set_string('category', 'web');
		if(selection == 2)
			this._settings.set_string('category', 'news');
		if(selection == 3)
			this._settings.set_string('category', 'social');
		if(selection == 4)
			this._settings.set_string('category', 'images');
		if(selection == 5)
			this._settings.set_string('category', 'videos');
		if(selection == 6)
			this._settings.set_string('category', 'shopping');
		if(selection == 7)
			this._settings.set_string('category', 'music');
		else
			this._settings.set_string('category', 'all');
	},

	_suggestionsAmountChanged: function() {
		let value = this._widgets.transparencyLevel.get_value();
		logDebug('New suggestions amount: ' + value);
		this._settings.set_value('suggestions-amount', value);
	},

	_panelButtonUpdate: function() {
		let value = this._widgets.btnShadowSwitch.get_active();
		logDebug('New panel icon value: ' + value);
		this._settings.set_boolean('panel-button', value);
	}
});

function init() {
}

function buildPrefsWidget() {
	let prefWindow = new PrefWindow();
	prefWindow.show_all();

	return prefWindow;
}
