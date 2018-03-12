// create atom project opener
// view log: journalctl /usr/bin/gnome-session -f -o cat

const Meta = imports.gi.Meta;
const St = imports.gi.St;
const Lang = imports.lang;
const Main = imports.ui.main;
const Shell = imports.gi.Shell;
const Gio = imports.gi.Gio;
const Tweener = imports.ui.tweener;
const Params = imports.misc.params;
const Me = imports.misc.extensionUtils.getCurrentExtension();
const Soup = imports.gi.Soup;

const Gettext = imports.gettext;

Gettext.textdomain("Qwant_search@alex.nitters.eu");
Gettext.bindtextdomain("Qwant_search@alex.nitters.eu", Me.path + "/locale");

const _ = Gettext.gettext;

let qwantSearchProvider = null;

const searchUrl = "https://www.qwant.com/?q=";
const suggestionsUrl = "https://api.qwant.com/api/suggest";
const qwantLocale = _("fr");
const _httpSession = new Soup.Session();

let button;
let baseGIcon;
let hoverGIcon;
let buttonIcon;

let previousRequest = "";

let debug = true;

function logDebug() {
  if (debug) {
    log.apply(
      this,
      Array.from(arguments)
    )
  }
}

function makeResult(name, description, icon, id) {
  return {
    'id': id,
    'name': name,
    'description': description,
    'icon': icon
  }
}

function makeLaunchContext(params) {
  params = Params.parse(params, {
    workspace: -1,
    timestamp: global.display.get_current_time_roundtrip()
  });

  const launchContext = global.create_app_launch_context(
    params.timestamp,
    params.workspace
  );

  return launchContext;
}

const QwantSearchProvider = new Lang.Class({
  Name: 'QwantSearchProvider',

  _init : function(title, categoryType) {
    this._categoryType = categoryType;
    this._title = title;
    this.id = 'qwant-search-' + title;
    this.appInfo = {
      get_name : function() {
        return _("Recherche Qwant");
      },
      get_icon : function() {
        return Gio.icon_new_for_string(
          Me.path + "/icons/qwant_logo.png"
        );
      },
      get_id : function() {
        return this.id;
      }
    };
    this.qwantResults = new Map();
  },

  _getResultSet: function(terms) {
    logDebug("getResultSet");
    const resultIds = Array.from(this.qwantResults.keys())


    logDebug("found " + resultIds.length + " results" );
    return resultIds;
  },

  getResultMetas: function(resultIds, callback) {
    logDebug("result metas for name: "+resultIds.join(" "));
    const metas = resultIds.map(id => this.getResultMeta(id));
    logDebug("metas: " + metas.join(" "));
    callback(metas);
  },

  getResultMeta: function(resultId) {
    const result = this.qwantResults.get(resultId);
    const name = result.name;
    const description = result.description;
    logDebug("result meta for name: "+result.name);
    logDebug("result meta: ", resultId);
    return {
      'id': resultId,
      'name': name,
      'description': description,
      'createIcon' : function(size) {}
    }
  },

  processTerms: function(terms, callback, cancellable) {
    this.qwantResults.clear();
    const joined = terms.join(" ");
    this.qwantResults.set(
      searchUrl + encodeURIComponent(joined) + "#",
      makeResult(_("Rechercher \"{terms}\" avec Qwant").replace("{terms}", joined),
      " ",
      function() {},
      searchUrl + encodeURIComponent(joined) + "#")
    );
    logDebug("ProcessTerms: " + joined);
    logDebug("Search with: " + joined);
    this.getSuggestions(terms, callback)
  },

  getSuggestions: function(terms, callback) {
    const joined = terms.join(" ");
    let suggestions = {};
    const request = Soup.form_request_new_from_hash(
      'GET',
      suggestionsUrl,
      {'q':joined, 'lang': qwantLocale}
    );
    logDebug("getSuggestions: ")
    previousRequest = request;

    _httpSession.queue_message(request, Lang.bind(this,
      function (_httpSession, response) {
        logDebug("Statuscode: " + response.status_code);
        if (response.status_code === 200) {
          const json = JSON.parse(response.response_body.data);
          const jsonItems = json.data.items;
          const jsonSpecial = json.data.special;
          logDebug("bodydata", response.response_body.data);
          const parsedItems = jsonItems
          .filter(suggestion => suggestion.value != joined)
          .map(suggestion => {
            if (suggestion.value.startsWith("&")) {
              return {
                type: "special",
                name: suggestion.value,
                description: suggestion.site_name, url:
                searchUrl + encodeURIComponent(suggestion.value)
              };
            }
            else {
              return {
                type: "suggestion",
                name: suggestion.value,
                url: searchUrl + encodeURIComponent(suggestion.value)
              };
            }
          });
          const parsedSpecial = jsonSpecial
          .filter(suggestion => suggestion.value != joined)
          .map(suggestion => (
            {
              type: "special",
              name: (suggestion.name + " (" + suggestion.type +")"),
              description: suggestion.description,
              url: searchUrl + encodeURIComponent(suggestion.name)
            }
          ));
          suggestions = parsedSpecial.concat(parsedItems);
          logDebug("Array: " + JSON.stringify(suggestions));
        }
        else if (response.status_code === 1) {
          logDebug("Request canceled, user getSubsearchResult was called again");
        }
        else {
          logDebug("No internet or request failed, cannot get suggestions");
          suggestions = [{
            type: "special",
            name: _("Erreur"),
            description: _("Veuillez vérifier votre connexion Internet ou réessayer plus tard"),
            url: " "
          }];
          logDebug("Array: " + JSON.stringify(suggestions));
        }
        this.displaySuggestions(suggestions, callback, terms);

      })
    );



    /********************TODO: Get results from Qwant********************/

  },

  displaySuggestions: function(suggestions, callback, terms) {
    suggestions.forEach(suggestion => {
      if (suggestion.type == "suggestion") {
        this.qwantResults.set(
          suggestion.url,
          makeResult(
            " ",
            suggestion.name,
            function () {},
            suggestion.url
          )
        );
      }
      if (suggestion.type == "special") {
        this.qwantResults.set(
          suggestion.url,
          makeResult(
            suggestion.name,
            suggestion.description,
            function () {},
            suggestion.url
          )
        );
      }
    });
    callback(this._getResultSet(terms));
  },

  activateResult: function(resultId, terms) {
    const result = this.qwantResults[resultId];
    logDebug("activateResult: " + resultId);
    const url = resultId;
    logDebug("url: " + url)
    Gio.app_info_launch_default_for_uri(
      url,
      makeLaunchContext({})
    );
  },

  launchSearch: function(result) {
    logDebug("launchSearch: " + result.name);
    Gio.app_info_launch_default_for_uri(
      "https://www.qwant.com/",
      makeLaunchContext({})
    );
  },

  getInitialResultSet: function(terms, callback, cancellable) {
    _httpSession.abort(previousRequest);
    logDebug("SuggestionId: " + this.suggestionId);
    logDebug("getInitialResultSet: " + terms.join(" "));
    this.processTerms(terms, callback, cancellable);
  },

  filterResults: function(results, maxResults) {
    logDebug("filterResults", results, maxResults);
    return results.slice(0, maxResults);
    //return results;
  },

  getSubsearchResultSet: function(previousResults, terms, callback, cancellable) {
    _httpSession.abort(previousRequest);
    logDebug("getSubSearchResultSet: " + terms.join(" "));
    this.processTerms(terms, callback, cancellable, );
  },


});

function _openQwant() {
  logDebug("Lauched Qwant from button");
  Gio.app_info_launch_default_for_uri(
    "https://www.qwant.com/",
    makeLaunchContext({})
  );
}

function init(extensionMeta) {
  button = new St.Bin({style_class: 'panel-button',
  reactive: true,
  can_focus: true,
  x_fill: true,
  y_fill: false,
  track_hover: true});
  baseGIcon = Gio.icon_new_for_string(
    Me.path + "/icons/system_status_icon.png"
  );
  hoverGIcon = Gio.icon_new_for_string(
    Me.path + "/icons/qwant_logo.png"
  );
  buttonIcon = new St.Icon({
    'gicon': Gio.icon_new_for_string(
      Me.path + "/icons/system_status_icon.png"
    ),
    'style_class': 'system-status-icon'
  });

  button.set_child(buttonIcon);
  button.connect(
    'button-press-event',
    Lang.bind(this, _openQwant)
  );
  button.connect(
    'enter-event',
    function() {
      _SetButtonIcon('hover');
    }
  );
  button.connect(
    'leave-event',
    function(){
      _SetButtonIcon('base');
    }
  );
}

function enable() {
  logDebug("enable Qwant search provider");
  if (!qwantSearchProvider) {
    logDebug("enable Qwant search provider");
    qwantSearchProvider = new QwantSearchProvider();
    Main.overview.viewSelector._searchResults._registerProvider(
      qwantSearchProvider
    );
  }
  Main.panel._rightBox.insert_child_at_index(button, 0);
}

function disable() {
  if (qwantSearchProvider) {
    logDebug("disenable Qwant search provider");
    Main.overview.viewSelector._searchResults._unregisterProvider(
      qwantSearchProvider
    );
    qwantSearchProvider = null;
  }
  Main.panel._rightBox.remove_child(button);
}

function _SetButtonIcon(mode) {
  if (mode === 'hover') {
    buttonIcon.set_gicon(hoverGIcon);
  } else {
    buttonIcon.set_gicon(baseGIcon);
  }
}
