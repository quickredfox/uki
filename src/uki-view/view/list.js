include('scrollPane.js');

uki.view.list = {};
uki.view.declare('uki.view.List', uki.view.Base, uki.view.Focusable, function(Base, Focusable) {
    
    this._throttle = 5; // do not try to render more often than every 5ms
    this._visibleRectExt = 300; // extend visible rect by 300 px overflow
    this._defaultBackground = 'theme(list)';
    
    this._setup = function() {
        Base._setup.call(this);
        uki.extend(this, {
            _rowHeight: 30,
            _render: new uki.view.list.Render(),
            _data: [],
            _selectedIndex: -1
        });
    };
    
    this.defaultBackground = function() {
        return uki.theme.background('list', this._rowHeight);
    };
    
    uki.addProps(this, ['render', 'packSize', 'visibleRectExt', 'throttle']);
    
    this.rowHeight = uki.newProp('_rowHeight', function(val) {
        this._rowHeight = val;
        if (this._background) this._background.detach();
        this._background = null;
        if (this.background()) this.background().attachTo(this);
    });
    
    this.data = function(d) {
        if (d === undefined) return this._data;
        this.clearSelection();
        this._data = d;
        this._packs[0].itemFrom = this._packs[0].itemTo = this._packs[1].itemFrom = this._packs[1].itemTo = 0;
        this._updateRectOnDataChnage();
        this._relayoutParent();
        return this;
    };
    
    this.addRow = function(position, data) {
        this.clearSelection();
        this._data.splice(position, 0, data);
        this.data(this._data);
    };
    
    this.removeRow = function(position, data) {
        this.clearSelection();
        this._data.splice(position, 1);
        this.data(this._data);
    };
    
    this.selectedIndex = function(position) {
        if (position === undefined) return this._selectedIndex;
        var nextIndex = MAX(0, MIN((this._data || []).length - 1, position));
        if (this._selectedIndex > -1) this._setSelected(this._selectedIndex, false);
        if (nextIndex == position) this._setSelected(this._selectedIndex = nextIndex, true);
        this._scrollToPosition(position);
        return this;
    };
    
    this.clearSelection = function() {
        if (this._selectedIndex > -1) this._setSelected(this._selectedIndex, false);
        this._selectedIndex = -1;
    };
    
    this.layout = function() {
        this._layoutDom(this._rect);
        this._needsLayout = false;
        // send visibleRect with layout
        this.trigger('layout', { rect: this._rect, source: this, visibleRect: this._visibleRect });
        this._firstLayout = false;
    };
    
    this._scrollableParentScroll = function() {
        if (this._throttle) {
            if (this._throttleStarted) return;
            this._throttleStarted = true;
            setTimeout(uki.proxy(function() {
                this._throttleStarted = false;
                this.layout();
            }, this), this._throttle);
        } else {
            this.layout();
        }
    };
    
    this._relayoutParent = function() {
        if (!this._scrollableParent) return;
        var c = this;
        while ( c && c != this._scrollableParent) {
            c._needsLayout = true;
            c = c.parent();
        }
        c.layout();
    };
    
    
    this._updateRectOnDataChnage = function() {
        this.rect(this._parentRect);
    };
    
    this.keyPressEvent = function() {
        var useKeyPress = /mozilla/i.test( ua ) && !(/(compatible|webkit)/i).test( ua );
        return useKeyPress ? 'keypress' : 'keydown';
    };
    
    this._bindSelectionEvents = function() {
        this.bind('mousedown', this._mousedown);
        this.bind(this.keyPressEvent(), this._keypress);
    };
    
    this._mousedown = function(e) {
        var o = uki.dom.offset(this._dom),
            y = e.pageY - o.y,
            p = FLOOR(y / this._rowHeight);
        this.selectedIndex(p);
    };
    
    this._keypress = function(e) {
        if (e.which == 38 || e.keyCode == 38) { // UP
            this.selectedIndex(MAX(0, this.selectedIndex() - 1));
            e.preventDefault();
        } else if (e.which == 40 || e.keyCode == 40) { // DOWN
            this.selectedIndex(MIN(this._data.length-1, this.selectedIndex() + 1));
            e.preventDefault();
        }
    };
    
    this._createDom = function() {
        this._dom = uki.createElement('div', this.defaultCss + 'overflow:hidden');
        
        var packDom = uki.createElement('div', 'position:absolute;left:0;top:0px;width:100%;overflow:hidden');
        this._packs = [
            {
                dom: packDom,
                itemTo: 0,
                itemFrom: 0
            },
            {
                dom: packDom.cloneNode(false),
                itemTo: 0,
                itemFrom: 0
            }
        ];
        this._dom.appendChild(this._packs[0].dom);
        this._dom.appendChild(this._packs[1].dom);
        
        this._initFocusable();
        this._bindSelectionEvents();
    };
    
    this._setSelected = function(position, state) {
        var item = this._itemAt(position);
        if (!item) return;
        this._render.setSelected(item, this._data[position], state, this.hasFocus());
    };
    
    this._scrollToPosition = function(position) {
        if (!this._visibleRect) return;
        var maxY, minY;
        maxY = (position+1)*this._rowHeight;
        minY = position*this._rowHeight;
        if (maxY >= this._visibleRect.maxY()) {
            this._scrollableParent.scroll(0, maxY - this._visibleRect.maxY());
        } else if (minY < this._visibleRect.y) {
            this._scrollableParent.scroll(0, minY - this._visibleRect.y);
        }
        this.layout();
    };
    
    this._itemAt = function(position) {
        if (position < this._packs[1].itemTo && position >= this._packs[1].itemFrom) {
            return this._packs[1].dom.childNodes[position - this._packs[1].itemFrom];
        } else if (position < this._packs[0].itemTo && position >= this._packs[0].itemFrom) {
            return this._packs[0].dom.childNodes[position - this._packs[0].itemFrom];
        }
        return null;
    };
    
    this._focus = function() {
        this._selectedIndex = this._selectedIndex > -1 ? this._selectedIndex : 0;
        this._setSelected(this._selectedIndex, true);
    };
    
    this._blur = function() {
        if (this._selectedIndex > -1) { this._setSelected(this._selectedIndex, true); }
    };
    
    this._rowTemplate = new uki.theme.Template('<div style="width:100%;height:${height}px;overflow:hidden">${text}</div>')
    
    this._renderPack = function(pack, itemFrom, itemTo) {
        var html = [], position,
            rect = new Rect(0, itemFrom*this._rowHeight, this.rect().width, this._rowHeight);
        for (i=itemFrom; i < itemTo; i++) {
            html[html.length] = this._rowTemplate.render({ 
                height: this._rowHeight, 
                text: this._render.render(this._data[i], rect, i) 
            });
            rect.y += this._rowHeight;
        };
        pack.dom.innerHTML = html.join('');
        pack.itemFrom = itemFrom;
        pack.itemTo   = itemTo;
        pack.dom.style.top = itemFrom*this._rowHeight + 'px';
        this._restorePackSelection(pack, itemFrom, itemTo);
    };
    
    this._restorePackSelection = function(pack) {
        if (this._selectedIndex >= pack.itemFrom && this._selectedIndex < pack.itemTo) {
            this._render.setSelected(this._itemAt(this._selectedIndex), this._data[this._selectedIndex - pack.itemFrom], true, this.hasFocus());
        }
    };
    
    this._swapPacks = function() {
        var tmp = this._packs[0];
        this._packs[0] = this._packs[1];
        this._packs[1] = tmp;
    };
    
    this._normalizeRect = function(rect) {
        rect = Base._normalizeRect.call(this, rect);
        // if (rect.height != this._rowHeight * this._data.length) {
        //     rect = new Rect(rect.x, rect.y, rect.width, this._rowHeight * this._data.length);
        // }
        if (rect.height < this._rowHeight * this._data.length) {
            rect = new Rect(rect.x, rect.y, rect.width, this._rowHeight * this._data.length);
        }
        return rect;
    };
    
    this._layoutDom = function(rect) {
        if (!this._scrollableParent) {
            this._scrollableParent = uki.view.scrollableParent(this);
            this._scrollableParent.bind('scroll', uki.proxy(this._scrollableParentScroll, this));
        }
        
        var totalHeight = this._rowHeight * this._data.length,
            scrollableParent = this._scrollableParent;

        this._visibleRect = uki.view.visibleRect(this, scrollableParent);
        
        var prefferedPackSize = CEIL((this._visibleRect.height + this._visibleRectExt*2) / this._rowHeight),
        
            minVisibleY  = MAX(0, this._visibleRect.y - this._visibleRectExt),
            maxVisibleY  = MIN(totalHeight, this._visibleRect.maxY() + this._visibleRectExt),
            minRenderedY = this._packs[0].itemFrom * this._rowHeight,
            maxRenderedY = this._packs[1].itemTo * this._rowHeight,
            
            itemFrom, itemTo, startAt;

        Base._layoutDom.call(this, rect);
        
        if (
            maxVisibleY <= minRenderedY || minVisibleY >= maxRenderedY || // both packs below/above visible area
            (maxVisibleY > maxRenderedY && this._packs[1].itemFrom * this._rowHeight > this._visibleRect.y && this._packs[1].itemTo > this._packs[1].itemFrom) || // need to render below, and pack 2 is not enough to cover
            (minVisibleY < minRenderedY && this._packs[0].itemTo * this._rowHeight < this._visibleRect.maxY()) // need to render above, and pack 1 is not enough to cover the area
            // || prefferedPackSize is not enough to cover the area above/below, can this actually happen?
        ) { 
            // this happens a) on first render b) on scroll jumps c) on container resize
            // render both packs, move them to be at the center of visible area
            // startAt = minVisibleY + (maxVisibleY - minVisibleY - prefferedPackSize*this._rowHeight*2) / 2;
            startAt = minVisibleY - this._visibleRectExt / 2;
            itemFrom = MAX(0, Math.round(startAt / this._rowHeight));
            itemTo = MIN(this._data.length, itemFrom + prefferedPackSize);
            
            this._renderPack(this._packs[0], itemFrom, itemTo);
            this._renderPack(this._packs[1], itemTo, itemTo);
            // this._renderPack(this._packs[1], itemTo, MIN(this._data.length, itemTo + prefferedPackSize));
        } else if (maxVisibleY > maxRenderedY && this._packs[1].itemTo > this._packs[1].itemFrom) { // we need to render below current area
            // this happens on normal scroll down
            // re-render bottom, swap
            itemFrom = this._packs[1].itemTo;
            itemTo   = MIN(this._data.length, this._packs[1].itemTo + prefferedPackSize);
            
            this._renderPack(this._packs[0], itemFrom, itemTo);
            this._swapPacks();
        } else if (maxVisibleY > maxRenderedY) { // we need to render below current area
            itemFrom = this._packs[0].itemTo;
            itemTo   = MIN(this._data.length, this._packs[1].itemTo + prefferedPackSize);
            
            this._renderPack(this._packs[1], itemFrom, itemTo);
        } else if (minVisibleY < minRenderedY) { // we need to render above current area
            // this happens on normal scroll up
            // re-render top, swap
            itemFrom = MAX(this._packs[0].itemFrom - prefferedPackSize, 0);
            itemTo   = this._packs[0].itemFrom;
            
            this._renderPack(this._packs[1], itemFrom, itemTo);
            this._swapPacks();
        }
        
        if (this._focusableInput) this._focusableInput.style.top = this._visibleRect.y + 'px'; // move to reduce on focus jump
            
    };
    
    this._bindToDom = function(name) {
        return Focusable._bindToDom.call(this, name) || Base._bindToDom.call(this, name);
    };
});

uki.Collection.addAttrs(['data','selectedIndex']);

uki.view.declare('uki.view.ScrollableList', uki.view.ScrollPane, function(Base) {

    this._createDom = function() {
        Base._createDom.call(this);
        this._list = uki({ view: 'List', rect: this.rect().clone().normalize(), anchors: 'left top right bottom' })[0];
        this.appendChild(this._list);
    };
    
    uki.each('data,rowHeight,render,packSize,visibleRectExt,throttle,focusable,selectedIndexes,selectedIndex'.split(','), 
        function(i, name) {
            uki.delegateProp(this, name, '_list');
        }, this);
    
});

include('list/render.js');
