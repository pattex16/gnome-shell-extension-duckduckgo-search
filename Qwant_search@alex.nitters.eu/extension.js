const Meta = imports.gi.Meta;
const St = imports.gi.St;
const Lang = imports.lang;
const Main = imports.ui.main;
const Shell = imports.gi.Shell;
const Gio = imports.gi.Gio;
const Tweener = imports.ui.tweener;
const Params = imports.misc.params;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Soup = imports.gi.Soup;
const Convenience = Me.imports.convenience;
const Gettext = imports.gettext;

Gettext.textdomain("Qwant_search@alex.nitters.eu");
Gettext.bindtextdomain("Qwant_search@alex.nitters.eu", Me.path + "/locale");
const _ = Gettext.gettext;

const preferences = Convenience.getSettings();

let qwantSearchProvider = null;

let debug = true;

let url = {
  // Url to open in browser
  search:
    {
      "qwant": "https://www.qwant.com/?t={category}&q=",
      "junior": "https://www.qwantjunior.com/?t={category}&q=",
      "edu": "https://www.edu.qwantjunior.com/?t={category}&q=",
      "lite": "https://www.lite.qwant.com/?t={category}&q="
    },

  // Api url for suggestions
  suggestions:
    {
      "qwant": "https://api.qwant.com/api/suggest",
      "junior": "https://api.qwant.com/api/suggest",
      "edu": "https://api.qwant.com/api/suggest",
      "lite": "https://api.qwant.com/api/suggest"
    },

  // Api for results
  results:
    {
      "qwant": "https://api.qwant.com/api/suggest",
      "junior": "https://api.qwant.com/api/suggest",
      "edu": "https://api.qwant.com/api/suggest",
      "lite": "https://api.qwant.com/api/suggest"
    }
};

function logDebug() {
  if (debug) {
    log.apply(
      this,
      Array.from(arguments)
    );
  }
}

const QwantSearchProvider = new Lang.Class({
  Name: "QwantSearchProvider",

  // Info for search provider
  _init : () => {
    this.id = "qwant-search";
    this.appInfo = {
      get_name : () => {
        return _("Recherche Qwant");
      },
      get_icon : () => {
        return Gio.icon_new_for_string(
          Me.path + "/icons/qwant_logo.png"
        );
      },
      get_id : () => {
        return this.id;
      }
    };
    this.qwantResults = new Map();
    this.currentRequest = null;
  },



  /* SEND REQUEST TO QWANT */
  makeRequest: (type, category, terms, callback) => {
    logDebug("Sending request (makeRequest)");

    let request = null;
    let parseFunc = null;
    if (type == "search") {
      // Send request to search api
      logDebug("Preparing search request");
      let request = Soup.form_request_new_from_hash(
        "GET",
        url.search.replace("{category}", category),
        {"q": joined, "lang": qwantLocale, "t": category, "uiv": "4"}
      );
    } else {
      // Send request to suggestions api
      logDebug("Preparing suggestions request");
      let request = Soup.form_request_new_from_hash(
        "GET",
        url.suggestions,
        {"q": terms.join(" "), "lang": qwantLocale}
      );
    }

    /*Because Gnome Shell only accepts one callback,
      we cancel requests that have not yet finished
      so that the callback can be used for this one*/
    if (this.currentRequest != null) {
      logDebug("Canceling previous request");
      _httpSession.cancel_message(this.currentRequest, 600);
    }
    this.currentRequest = request;

    _httpSession.queue_message(
      request,
      Lang.bind(
        this,
        this.parseResult(response, type, category, callback)
      )
    );
  },



  /* PARSE RESULTS */
  parseResult: (response, type, category, callback) => {
    logDebug("Response received, executing callback");
    logDebug("Statuscode: " + response.status_code);
    // Request has finished
    currentRequest = null;
    if (response.status_code == 200) {
      if (JSON.parse(response.response_body.status == "success")) {
        const json = JSON.parse(response.response_body.data);
        if (type == "search") {
          this.parseSearch(json, category, callback);
          return;
        } else {
          this.parseSugestions(json, callback);
          return;
        }
      }
    }
    // Error handling
    // 600 means request was cancelled because another one started
    if (response.status_code != 600) {
      logDebug("Request has failed");
      suggestions = [{
        type: "special",
        name: _("Erreur"),
        description: _("Veuillez vérifier votre connexion Internet ou réessayer plus tard"),
        url: " "
      }];
      this.mapSuggestions(suggestions, callback);
    } else {
      logDebug("Request cancelled, another one started");
      return;
    }
  },

  // Parse suggstions response
  parseSuggestions: (json, callback) => {

  },

  // Parse search response
  parseSearch: (json, category, callback) => {

  },



  /* MAPPING SUGGESTIONS */
  mapSuggestions: (suggestions, callback) => {

  },



  /* KEYWORD CHECK */
  checkKeywords: (terms, callback) => {
    logDebug("Testing for shortcuts (checkKeywords)");

    // Check for category keywords
    if (
      !preferences.get_boolean("disable-shortcuts")
    ) {
      let shortcuts = ["web-shortcut", "news-shortcut", "social-shortcut", "images-shortcut", "shopping-shortcut", "videos-shortcut", "music-shortcut"];
      let categories = ["web", "news", "social", "images", "shopping", "videos", "music"];
      for (i in shortcuts) {
        let shortcut = preferences.get_string(shortcuts[i]);
        let firstTerm = terms.slice(0, shortcut.split(" ").length);
        let otherTerms = terms.slice((shortcut.split(" ").length), terms.length);
        logDebug("Testing shortcut : '" + shortcut);
        if (
          shortcut != ""
          && shortcut == firstTerm
          && otherTerms != ""
        ) {
          category = categories[i];
          logDebug("Shortcut for " + category + " matched : " + shortcut);
          this.makeRequest("search", category, terms, callback);
          return;
        }
      }
    }

    // Check for suggest keyword or show if enabled
    let shortcut = preferences.get_string("suggest-shortcut");
    let otherTerms = terms.slice((shortcut.split(" ").length), terms.length);
    if (
      shortcut != ""
      && preferences.get_boolean("activate-suggestions")
      && (shortcut == firstTerm || shortcut == "")
      && otherTerms != ""
    ) {
      logDebug("Shortcut for suggestions matched : " + shortcut);
      this.makeRequest("suggestions", null, terms, callback);
      return;
    }
  },



  /* GNOME API FUNCTIONS */
  // Upon initial search
  getInitialResultSet: (terms, callback, cancellable) => {
    logDebug("Search started (getInitialResultSet)");

    qwantSearchProvider.checkKeywords(terms, callback);
  },

  // Upon search terms update - same as getInitialResultSet
  getSubsearchResultSet: (previousResults, terms, callback, cancellable) => {
    logDebug("Search terms updated (getSubsearchResultSet)");

    qwantSearchProvider.checkKeywords(terms, callback);
  },

  // Get information about a result
  getResultMetas: (resultIds, callback) => {
    logDebug("Getting result info (getResultMetas)");

  },

  // When result is clicked
  activateResult: (resultId, terms) => {
    logDebug("Launching result in browser (activateResult)");

  },

  // When icon is clicked
  launchSearch: (result) => {
    logDebug("Launching settings (launchSearch)");

  }

});

function init() {
  button = new St.Bin({style_class: "panel-button",
    reactive: true,
    can_focus: true,
    x_fill: true,
    y_fill: false,
    track_hover: true
  });
  baseGIcon = Gio.icon_new_for_string(
    Me.path + "/icons/system_status_icon.png"
  );
  hoverGIcon = Gio.icon_new_for_string(
    Me.path + "/icons/qwant_logo.png"
  );
  buttonIcon = new St.Icon({
    "gicon": Gio.icon_new_for_string(
      Me.path + "/icons/system_status_icon.png"
    ),
    "style_class": "system-status-icon"
  });

  button.set_child(buttonIcon);
  button.connect(
    "button-release-event",
    Lang.bind(this, _openQwant)
  );
  button.connect(
    "enter-event",
    () => {
      _SetButtonIcon("hover");
    }
  );
  button.connect(
    "leave-event",
    function(){
      _SetButtonIcon("base");
    }
  );
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

function _openQwant() {
  logDebug("Lauched Qwant from button");
  Gio.app_info_launch_default_for_uri(
    "https://www.qwant.com/",
    makeLaunchContext({})
  );
}

function _SetButtonIcon(mode) {
  if (mode === "hover") {
    buttonIcon.set_gicon(hoverGIcon);
  } else {
    buttonIcon.set_gicon(baseGIcon);
  }
}

function enable() {
  if (!qwantSearchProvider) {
    logDebug("enable Qwant search provider");
    qwantSearchProvider = new QwantSearchProvider();
    Main.overview.viewSelector._searchResults._registerProvider(
      qwantSearchProvider
    );
  }
  if (preferences.get_boolean("panel-button"))
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
