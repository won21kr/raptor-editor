/**
 * @fileOverview Contains the save JSON plugin code.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen <david@panmedia.co.nz>
 * @author Michael Robinson <michael@panmedia.co.nz>
 * @author Melissa Richards <melissa@panmedia.co.nz>
 */

/**
 * The save JSON class.
 *
 * @constructor
 * @param {String} name
 * @param {Object} overrides
 */
function SaveJsonPlugin(name, overrides) {
    RaptorPlugin.call(this, name || 'saveJson', overrides);
    this.size = null;
}

SaveJsonPlugin.prototype = Object.create(RaptorPlugin.prototype);

Raptor.registerPlugin(new SaveJsonPlugin());

// <strict>
SaveJsonPlugin.prototype.init = function() {
    if (typeof this.options.url !== 'string' && !$.isFunction(this.options.url)) {
        handleError('Expected save JSON URL option to be a string or a function.');
    }
    if (!$.isFunction(this.options.id)) {
        handleError('Expected save JSON id option to be a function.');
    }
    if (!typeIsString(this.options.postName)) {
        handleError('Expected save JSON postName option to be a string.');
    }
};
// </strict>

/**
 * Save Raptor content.
 */
SaveJsonPlugin.prototype.save = function(saveSections) {
    // Hack save sections
    if (typeof RaptorSection !== 'undefined' && saveSections !== false) {
        RaptorSection.save(false);
    }
    var data = {};
    this.raptor.unify(function(raptor) {
        if (raptor.isDirty()) {
            raptor.clean();
            var plugin = raptor.getPlugin('saveJson');
            var id = plugin.options.id.call(plugin);
            var html = raptor.getHtml();
            data[id] = html;
        }
    }.bind(this));
    var post = {};
    this.size = Object.keys(data).length;
    post[this.options.postName] = JSON.stringify(data);
    $.ajax({
            type: this.options.type || 'post',
            dataType: this.options.dataType || 'json',
            url: this.options.url,
            data: post
        })
        .done(this.done.bind(this))
        .fail(this.fail.bind(this));
};

/**
 * Done handler.
 *
 * @param {Object} data
 * @param {Integer} status
 * @param {Object} xhr
 */
SaveJsonPlugin.prototype.done = function(data, status, xhr) {
    this.raptor.unify(function(raptor) {
        if (raptor.isDirty()) {
            raptor.saved([data, status, xhr]);
        }
    });
    var message = tr('saveJsonSaved', {
        saved: this.size
    });
    if ($.isFunction(this.options.formatResponse)) {
        message = this.options.formatResponse(data);
    }
    aNotify({
        text: message,
        type: 'success'
    });
    this.raptor.unify(function(raptor) {
        raptor.disableEditing();
    });
};

/**
 * Fail handler.
 *
 * @param {Object} xhr
 */
SaveJsonPlugin.prototype.fail = function(xhr) {
    aNotify({
        text: tr('saveJsonFail', {
            failed: this.size
        }),
        type: 'error'
    });
};
