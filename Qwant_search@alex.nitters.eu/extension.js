// create atom project opener
// view log: journalctl /usr/bin/gnome-session -f -o cat

const Meta = imports.gi.Meta;
const St = imports.gi.St;
const Lang = imports.lang;
const Main = imports.ui.main;
const Shell = imports.gi.Shell;
const Gio = imports.gi.Gio;

var qwantSearchProvider = null;

var debug = true;

function logDebug() {
  if (debug) {
    log.apply(this, Array.from(arguments))
  }
}

function makeResult(qwantResult, id) {
  return {
      'id': id,
      'name': qwantResult
    }
}

const QwantSearchProvider = new Lang.Class({
  Name: 'QwantSearchProvider',

_init : function(title, categoryType) {
        this._categoryType = categoryType;
        this._title = title;
        this.id = 'qwant-search-' + title;
        this.appInfo = {get_name : function() {return 'Qwant Search';},
                        get_icon : function() {return Gio.icon_new_for_string("/usr/share/icons/gnome/256x256/actions/system-search.png");},
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
    logDebug("result meta for name: "+result.name);
    logDebug("result meta: ", resultId);
    return {
      'id': resultId,
      'name': name,
      'description': name,
      'createIcon' : function(size) {
                let xicon = Gio.icon_new_for_string("/usr/share/icons/gnome/256x256/actions/system-search.png");
                            return new St.Icon({icon_size: size,
                                                gicon: xicon});
            }
    }
  },

  activateResult: function(resultId, terms) {
    var result = this.qwantResults[resultId];
    logDebug("activateResult: " + result);
  },

  launchSearch: function(result) {
     logDebug("launchSearch: " + result.name);
  },

  getInitialResultSet: function(terms, callback, cancellable) {
   logDebug("getInitialResultSet: " + terms.join(" "));
   this.qwantResults.set('0', makeResult("hello", '0'));
   this.qwantResults.set('1', makeResult("hello world", '1'));
   logDebug(this.qwantResults)


   logDebug("getInitialResultSet: ");
   callback(this._getResultSet(terms));
 },

  filterResults: function(results, maxResults) {
    logDebug("filterResults", results, maxResults);
    return results.slice(0, maxResults);
    //return results;
  },

  getSubsearchResultSet: function(previousResults, terms, callback, cancellable) {
    logDebug("getSubSearchResultSet: " + terms.join(" "));
    this.getInitialResultSet(terms, callback, cancellable);
  },


});

function init() {
}

function enable() {
  logDebug("enable Qwant search provider");
  if (!qwantSearchProvider) {
    logDebug("enable Qwant search provider");
    qwantSearchProvider = new QwantSearchProvider();
    //Main.overview.addSearchProvider(qwantSearchProvider);
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
