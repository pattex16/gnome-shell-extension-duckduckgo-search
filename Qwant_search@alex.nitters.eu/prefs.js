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

//Original by web_search_dialog@awamper.gmail.com

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Gio = imports.gi.Gio;
const Lang = imports.lang;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;

const Gettext = imports.gettext

Gettext.textdomain("Qwant_search@alex.nitters.eu");
Gettext.bindtextdomain("Qwant_search@alex.nitters.eu", Me.path + "/locale");

const _ = Gettext.gettext;

let settings = null;

let debug = true;

function logDebug() {
  if (debug) {
    log.apply(
      this,
      Array.from(arguments)
    )
  }
}


const QwantSearchSettingsWidget = new GObject.Class({
    Name: 'Qwantsearch.Prefs.QwantsearchSettingsWidget',
    GTypeName: 'QwantsearchSettingsWidget',
    Extends: Gtk.Grid,

    _init : function(params) {
        this.parent(params);
        this.orientation = Gtk.Orientation.VERTICAL;
        this.expand = true;
        this.column_homogeneous = true;
        this._rownum = 0;

        this.set_margin_left(5);
        this.set_margin_right(5);
        this.set_row_spacing(2);

        // Bool Settings

        this._createBoolSetting(
          _("Bouton Qwant dans la barre système"),
          'panel-button'
          );

        // Combo Settings
        let options = [
          {title: _("Tous"), value: 'all'},
          {title: _("Web"), value: 'web'},
          {title: _("Actualités"), value: 'news'},
          {title: _("Social"), value: 'social'},
          {title: _("Images"), value: 'images'},
          {title: _("Vidéos"), value: 'videos'},
          {title: _("Shopping"), value: 'shopping'},
          {title: _("Musique"), value: 'music'}
        ];
        this._createComboSetting(
          _("Catégorie de recherche"),
          'category',
          options,
          'string'
        );
        this.createSeparator();
        this._createLabel(_("Gnome-shell doit-être redémarré (déconnexion/reconnexion) pour que ces paramètres soient changés"));

    },


    /*
     * Create Combo Widget
    */
    _createComboSetting : function(text, key, list, type) {
      let item = new Gtk.ComboBoxText();

              for(let i = 0; i < list.length; i++) {
                  let title = list[i].title.trim();
                  let id = list[i].value.toString();
                  item.insert(-1, id, title);
              }

              if(type === 'string') {
                  item.set_active_id(settings.get_string(key));
              }
              else {
                  item.set_active_id(settings.get_int(key).toString());
              }

              item.connect('changed', Lang.bind(this, function(combo) {
                  let value = combo.get_active_id();

                  if(type === 'string') {
                      if(settings.get_string(key) !== value) {
                          settings.set_string(key, value);
                      }
                  }
                  else {
                      value = parseInt(value, 10);

                      if(settings.get_int(key) !== value) {
                          settings.set_int(key, value);
                      }
                  }
              }));

              return this.add_row(text, item);
    },

    add_item: function(widget, col, colspan, rowspan) {
        this.attach(
            widget,
            col || 0,
            this._rownum,
            colspan || 2,
            rowspan || 1
        );
        this._rownum++;

        return widget;
    },

    add_row: function(text, widget, wrap) {
        let label = new Gtk.Label({
            label: text,
            hexpand: true,
            halign: Gtk.Align.START
        });
        label.set_line_wrap(wrap || false);

        this.attach(label, 0, this._rownum, 1, 1); // col, row, colspan, rowspan
        this.attach(widget, 1, this._rownum, 1, 1);
        this._rownum++;

        return widget;
    },

    _createLabel: function(text, markup=null) {
    let label = new Gtk.Label({
        hexpand: true,
        halign: Gtk.Align.START
    });
    label.set_line_wrap(true);

    if(markup) label.set_markup(markup);
    else label.set_text(text);

    return this.add_item(label);
},

createSeparator: function() {
    let separator = new Gtk.Separator({
        orientation: Gtk.Orientation.HORIZONTAL
    });

    this.add_item(separator, 0, 2, 1);
},

    /*
     * Create Boolean Button Widget
    */
    _createBoolSetting : function(text, key) {
      let item = new Gtk.Switch({
          active: settings.get_boolean(key)
      });
      settings.bind(key, item, 'active', Gio.SettingsBindFlags.DEFAULT);

      return this.add_row(text, item);
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
