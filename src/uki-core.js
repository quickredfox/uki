var uki        = require('./uki-core/uki'),
    utils      = require('./uki-core/utils'),
    fun        = require('./uki-core/function'),
    dom        = require('./uki-core/dom'),
    evt        = require('./uki-core/event'),
    gesture    = require('./uki-core/gesture'),
    builder    = require('./uki-core/builder'),
    selector   = require('./uki-core/selector'),
    after      = require('./uki-core/after'),
    observable = require('./uki-core/observable'),
    binding    = require('./uki-core/binding'),
    attachment = require('./uki-core/attachment'),
    collection = require('./uki-core/collection'),
    mustache   = require('./uki-core/mustache');

// push everything into core namespace
utils.forEach([
    utils, fun, dom, evt, gesture, builder, selector, 
    after, observable, binding, attachment, collection,
    mustache
], function(mod) {
    utils.extend(uki, mod);
});

var view      = require('./uki-core/view'),
    base      = require('./uki-core/view/base'),
    container = require('./uki-core/view/container');

// add view as uki.view namespace
uki.view = view;

// register view as default search path for views
builder.viewNamespaces.unshift(view);

// copy views from default view namespaces into view
utils.forEach([base, container], function(mod) {
    utils.extend(view, mod);
});

// export uki
module.exports = uki;
