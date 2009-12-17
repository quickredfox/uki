include('const.js');
include('uki.js');
include('utils.js');

(function() {
 
uki.dom = {
    createElement: function(tagName, cssText, innerHTML) {
        var e = doc.createElement(tagName);            
        if (cssText) e.style.cssText = cssText;
        if (innerHTML) e.innerHTML = innerHTML;
        e[expando] = guid++;
        return e;
    },
    
    probe: function(div, callback) {
        doc.body.appendChild(div);
        callback(div);
        doc.body.removeChild(div);
    },
    
    layout: function(style, layout, prevLayout) {
        prevLayout = prevLayout || {};
        if (prevLayout.left   != layout.left)   style.left   = layout.left + 'px';
        if (prevLayout.top    != layout.top)    style.top    = layout.top + 'px';
        if (prevLayout.right  != layout.right)  style.right  = layout.right + 'px';
        if (prevLayout.bottom != layout.bottom) style.bottom = layout.bottom + 'px';
        if (prevLayout.width  != layout.width)  style.width  = layout.width + 'px';
        if (prevLayout.height != layout.height) style.height = layout.height + 'px';
        return layout;
    },
    
    computedStyle: function(el) {
        if (doc && doc.defaultView && doc.defaultView.getComputedStyle) {
            return doc.defaultView.getComputedStyle( el, null );
        } else if (el.currentStyle) {
            return el.currentStyle;
        }
    }
};

uki.each(['createElement'], function(i, name) {
    uki[name] = uki.dom[name];
});

})();