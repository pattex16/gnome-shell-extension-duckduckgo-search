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

var qwantSearchProvider = null;

var searchUrl = "https://www.qwant.com/?q=";

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

  getSuggestions: function(terms) {
    var suggestions = {
      0: {type: "suggestion", name: "hello world", url: searchUrl + encodeURIComponent("hello world")},
      1: {type: "suggestion", name: "hello bank", url: searchUrl + encodeURIComponent("hello bank")},
      2: {type: "result", name: "Hello World - Wikipedia", description: "https://fr.wikipedia.org/wiki/Hello_world", url:"https://fr.wikipedia.org/wiki/Hello_world"},
      3: {type: "result", name: "Hello World, A Merkle Company", description: "https://www.hellowold.com", url:"https://www.hellowold.com"}
    };
    return suggestions;

    /********************TODO: Get suggestions and results from Qwant********************/

  },

  processTerms: function(terms, callback, cancellable) {
    this.qwantResults.clear();
    this.qwantResults.set(searchUrl + encodeURIComponent(terms.join(" ")), makeResult("Search \"" + terms.join(" ") + "\" with Qwant", " ", function() {}, searchUrl + encodeURIComponent(terms.join(" "))));

    //var suggestions = ["hello", "hello world", "hello kitty"];
    var suggestions = this.getSuggestions(terms)
    for (var i = 0; i < countProperties(suggestions); i++) {
      logDebug("type:" + suggestions[i].type);
      if (suggestions[i].type == "suggestion") {this.qwantResults.set(suggestions[i].url, makeResult(" ", suggestions[i].name, function () {}, suggestions[i].url)); }
      if (suggestions[i].type == "special") {this.qwantResults.set(suggestions[i].url, makeResult(" ", suggestions[i].name, suggestions[i].icon, suggestions[i].url)); }
      if (suggestions[i].type == "result") {this.qwantResults.set(suggestions[i].url, makeResult(suggestions[i].name , suggestions[i].description, function () {}, suggestions[i].url)); }
      //this.qwantResults.set(suggestions[i]., makeResult(suggestions[i], '1'));
    }
    logDebug("ProcessTerms");
    callback(this._getResultSet(terms));
  },

  activateResult: function(resultId, terms) {
    var result = this.qwantResults[resultId];
    logDebug("activateResult: " + resultId);
    //if (result.type == "suggestion") {var url = searchUrl + encodeURIComponent(result.name)}
    //if (result.type == "result") {var url = encodeURIComponent(result.url)}
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
