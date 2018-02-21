// create atom project opener
// view log: journalctl /usr/bin/gnome-session -f -o cat

const Meta = imports.gi.Meta;
const St = imports.gi.St;
const Lang = imports.lang;
const Main = imports.ui.main;
const Shell = imports.gi.Shell;
const Gio = imports.gi.Gio;
const Params = imports.misc.params;
const Me = imports.misc.extensionUtils.getCurrentExtension();
const Soup = imports.gi.Soup;

var qwantSearchProvider = null;

const searchUrl = "https://www.qwant.com/?q=";
const suggestionsUrl =  "https://api.qwant.com/api/suggest";
let _httpSession = new Soup.Session();

var debug = true;

function logDebug() {
  if (debug) {
    log.apply(this, Array.from(arguments))
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

  let launchContext = global.create_app_launch_context(params.timestamp, params.workspace);

  return launchContext;
}

function countProperties(obj) {
  var count = 0;

  for(var prop in obj) {
    if(obj.hasOwnProperty(prop))
    ++count;
  }

  return count;
}

const QwantSearchProvider = new Lang.Class({
  Name: 'QwantSearchProvider',

  _init : function(title, categoryType) {
    this._categoryType = categoryType;
    this._title = title;
    this.id = 'qwant-search-' + title;
    this.appInfo = {
      get_name : function() {return 'Qwant Search';},
      get_icon : function() {return Gio.icon_new_for_string(Me.path + "/icons/qwant_logo.png");},
      get_id : function() {return this.id;}
    };
    this.qwantResults = new Map();
  },

  _getResultSet: function(terms) {
    logDebug("getResultSet");
    var resultIds = Array.from(this.qwantResults.keys())


    logDebug("found " + resultIds.length + " results" );
    return resultIds;
  },

  getResultMetas: function(resultIds, callback) {
    logDebug("result metas for name: "+resultIds.join(" "));
    let _this = this;
    let metas = resultIds.map(function(id) { return _this.getResultMeta(id); });
    logDebug("metas: " + metas.join(" "));
    callback(metas);
  },

  getResultMeta: function(resultId) {
    let result = this.qwantResults.get(resultId);
    let name = result.name;
    let description = result.description;
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
    var joined = terms.join(" ");
    this.qwantResults.set(searchUrl + encodeURIComponent(joined), makeResult("Search \"" + joined + "\" with Qwant", " ", function() {}, searchUrl + encodeURIComponent(joined)));
    logDebug("ProcessTerms: " + joined);
    logDebug("Search with: " + joined);
    this.getSuggestions(terms, callback)
  },

  getSuggestions: function(terms, callback) {

    var suggestions = {};
    let request = Soup.form_request_new_from_hash(
      'GET',
      suggestionsUrl,
      {'q':terms.join(" ")}
    );
    logDebug("getSuggestions: ")

    _httpSession.queue_message(request, Lang.bind(this,
      function (_httpSession, response) {
        if (response.status_code === 200) {

          let json = (JSON.parse(response.response_body.data).data.items);
          logDebug("bodydata", response.response_body.data);
            var suggestions = {0: {}};
            for (var i = 0; i < countProperties(json); i++) {
              logDebug("Adding suggestion: " + json[i].value)
              if (json[i].value == terms.join(" ")) {continue};
              suggestions[i] = {type: "suggestion", name: json[i].value, url: searchUrl + encodeURIComponent(json[i].value)}
            }
        }
        else {
          suggestions[0] = {type: "result", name: "Request failed", description: "Please check your Internet or try again later", url: ""}
        }
        this.displaySuggestions(suggestions, callback, terms);

      })
    );



    /********************TODO: Get results from Qwant********************/

  },

  displaySuggestions: function(suggestions, callback, terms) {
    for (var i = 0; i < countProperties(suggestions); i++) {
      if (suggestions[i].type == "suggestion") {this.qwantResults.set(suggestions[i].url, makeResult(" ", suggestions[i].name, function () {}, suggestions[i].url)); }
      if (suggestions[i].type == "special") {this.qwantResults.set(suggestions[i].url, makeResult(" ", suggestions[i].name, suggestions[i].icon, suggestions[i].url)); }
      if (suggestions[i].type == "result") {this.qwantResults.set(suggestions[i].url, makeResult(suggestions[i].name , suggestions[i].description, function () {}, suggestions[i].url)); }

    }
    logDebug("displaySuggestions");
    callback(this._getResultSet(terms));
  },

  activateResult: function(resultId, terms) {
    var result = this.qwantResults[resultId];
    logDebug("activateResult: " + resultId);
    var url = resultId;
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
    logDebug("getSubSearchResultSet: " + terms.join(" "));
    this.processTerms(terms, callback, cancellable, );
  },


});

function init() {
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
}

function disable() {
  if (qwantSearchProvider) {
    logDebug("disenable Qwant search provider");
    Main.overview.viewSelector._searchResults._unregisterProvider(
      qwantSearchProvider
    );
    qwantSearchProvider = null;
  }
}
