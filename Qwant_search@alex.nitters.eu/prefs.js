// -*- mode: js; js-indent-level: 4; indent-tabs-mode: nil -*-
//
//
//   This library is free software; you can redistribute it and/or
//   modify it under the terms of the GNU Library General Public
//   License as published by the Free Software Foundation; either
//   version 2 of the License, or (at your option) any later version.
//
//   This library is distributed in the hope that it will be useful,
//   but WITHOUT ANY WARRANTY; without even the implied warranty of
//   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
//   Library General Public License for more details.
//
//   You should have received a copy of the GNU Library General Public
//   License along with this library; if not, write to the Free Software
//   Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA

//Original ny websearch@ciancio.net

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const ExtensionUtils = imports.misc.extensionUtils;

const Lang = imports.lang;
const Gettext = imports.gettext.domain('gnome-shell-websearch');
const _ = Gettext.gettext;

const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;

let settings = null;


const QwantSearchSettingsWidget = new GObject.Class({
    Name: 'WebSearchWindow.Prefs.WebsearchWindowSettingsWidget',
    GTypeName: 'WebsearchtWindowSettingsWidget',
    Extends: Gtk.Grid,

    _init : function(params) {
        this.parent(params);
        this.orientation = Gtk.Orientation.VERTICAL;
        this.expand = true;
        this.column_homogeneous = true;

        this.set_margin_left(5);
        this.set_margin_right(5);
        this.set_row_spacing(2);

        // Bool Settings

        this._createBoolSetting("Bouton Qwant",
            "Montrer le bouton pour accéder à Qwant depuis la barre du sytème",
            'panel-button');

        // Combo Settings
        this._createComboSetting("Catégorie de recherche",
            "Choissisez la catégorie utilisée lorsque vous cliquez sur une suggestion.",
            'category', ["all", "web", "news", "social", "images", "videos", "shopping", "music"]);

    },


    /*
     * Create Combo Widget
    */
    _createComboSetting : function(label, tooltip, setting, values) {

        let labelwidget = new Gtk.Label({
            halign: Gtk.Align.START,
            label: label,
            tooltip_text: tooltip,
        });
        this.add(labelwidget);

        this._model = new Gtk.ListStore();
        this._model.set_column_types([GObject.TYPE_STRING, GObject.TYPE_STRING]);

        let myCombo = new Gtk.ComboBox({ model: this._model, halign: Gtk.Align.END});

        let currentValue = settings.get_int(setting, 0);

        let selectMe = null;
        for (let i=0; i< values.length; i++) {
          let iter = this._model.append();
          this._model.set(iter, [0, 1], [values[i][0],values[i][1]]);
          if (values[i][0] == currentValue) {
            selectMe = iter;
          }
        }

        if (selectMe != null) {
          myCombo.set_active_iter(selectMe);
        }

        let renderer = new Gtk.CellRendererText();
        myCombo.pack_start(renderer, true);
        myCombo.add_attribute(renderer, 'text', 1);
        myCombo.connect("changed", Lang.bind(this,
          function(obj) {
            let[success, iter] = obj.get_active_iter();
            if (!success) {
              return;
            }
            settings.set_int(setting, this._model.get_value(iter, 0));
          })
        );

        this.attach_next_to(myCombo, labelwidget, Gtk.PositionType.RIGHT, 1, 1);
    },

    /*
     * Create Boolean Button Widget
    */
    _createBoolSetting : function(label, tooltip, setting) {

        let labelwidget = new Gtk.Label({
            halign: Gtk.Align.START,
            label: label,
            tooltip_text: tooltip,
        });
        this.add(labelwidget);

        let mySwitch = new Gtk.Switch({
            active: settings.get_boolean(setting),
            sensitive: true,
            halign: Gtk.Align.END });
        mySwitch.connect('notify::active', function(button) {
            settings.set_boolean(setting, button.active);
        });

        this.attach_next_to(mySwitch, labelwidget, Gtk.PositionType.RIGHT, 1, 1);
    },
})



function init() {
    settings = Convenience.getSettings();
}

function buildPrefsWidget() {

    let widget = new QwantSearchSettingsWidget();
    widget.show_all();

    return widget;
};
