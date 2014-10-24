/*
 *  Project:
 *  Description:
 *  Author:
 *  License:
 */

// the semi-colon before function invocation is a safety net against concatenated
// scripts and/or other plugins which may not be closed properly.
;
(function($, window, document, undefined) {

    // undefined is used here as the undefined global variable in ECMAScript 3 is
    // mutable (ie. it can be changed by someone else). undefined isn't really being
    // passed in so we can ensure the value of it is truly undefined. In ES5, undefined
    // can no longer be modified.

    // window is passed through as local variable rather than global
    // as this (slightly) quickens the resolution process and can be more efficiently
    // minified (especially when both are regularly referenced in your plugin).

    var // plugin name
            pluginName = "jscmd",
            // key using in $.data()
            dataKey = "plugin_" + pluginName;

    var privateMethod = function() {
        // ...
        alert('Private function');
    };
        
    function Plugin(element, options) {
        
        element.append($(document.createElement('div')));
        this.element = element.find('div');

        this.defaults = {
            version: '1.0.0',
            namespace: 'jscmd',
			location: 'J:\\>'
        };

        this.elements = {
            inputField: '',
            form: '',
            location: '',
            inputMirror: ''
        };
        
        this.commandCollection = new Array();
        
        $.extend(this.defaults, options);

        this.init(this.defaults);
    };

    // initialize options
    Plugin.prototype.init = function(options) {

        this.element.empty();
        /*
         * Update plugin for options
         */
        this.element.parent().addClass(options.namespace + '-container');
        this.element.addClass(options.namespace);

        var logClass = options.namespace + '-log';
        this.elements.log = $(document.createElement('div')).attr({
            class: logClass
        });

        var CommandInputFieldClass = options.namespace + '-inputField';
        this.elements.CommandInputField = $(document.createElement('input')).attr({
            class: CommandInputFieldClass,
            name: options.namespace + '-inputField',
            type: 'text',
            autocomplete: 'off',
            unselectable : "off",
            onselectstart: 'return false;',
            onmousedown: 'return false;',
			style: 'pointer-events: auto !important'
        }).css({
            '-moz-user-select': 'none',
            '-webkit-user-select': 'none',
            '-ms-user-select': 'none',
            'user-select': 'none',
        });
        
        this.elements.CommandInputField.onfocus = function () {
            window.scrollTo(0, 0);
            document.body.scrollTop = 0;
        }

        this.elements.form = $(document.createElement('form')).attr({
            method: 'GET'
        }).css({
            position: 'relative',
            left: '-9999px',
        }).append(this.elements.CommandInputField);

        var locationClass = options.namespace + '-label';
        this.elements.location = $(document.createElement('label')).attr({
            class: locationClass,
            for : CommandInputFieldClass
        }).html(options.location);

        var inputMirrorClass = options.namespace + '-inputMirror';
        this.elements.inputMirror = $(document.createElement('span')).attr({
            class: inputMirrorClass
        });

        $(this.elements.CommandInputField).bind('keyup keydown init', {plugin: this}, function(event) {
            var plugin = event.data.plugin;

            var input = plugin.elements.CommandInputField;
            var inputValue = input.val();
            var inputPosition = input[0].selectionStart;

            var mirrorInput = '';
            for (var i = 0; i < inputValue.length; i++)
            {
                if (inputValue.charAt(i) === ' ') {
                    mirrorInput += '<span>&nbsp;</span>';
                } else {
                    mirrorInput += '<span>' + inputValue.charAt(i) + '</span>';
                }
            }
            
            plugin.elements.inputMirror.html(mirrorInput);
            if (inputPosition <= inputValue.length) {
                plugin.elements.inputMirror.append($('<span>&nbsp;</span>'));
                plugin.elements.inputMirror.find("span:eq(" + inputPosition + ")").addClass('input-position');
            } else {
                plugin.elements.inputMirror.find("span:eq(" + inputPosition - 1 + ")").addClass('input-position');
            }
        });

        $(this.elements.form).bind('submit', {plugin: this}, function(event) {
            event.preventDefault();
            var plugin = event.data.plugin;
            var input = plugin.elements.CommandInputField.val();
            plugin.elements.CommandInputField.val('');
            plugin.elements.inputMirror.empty();
            var location = plugin.elements.location.html();
            plugin.addLogEntry(location + input);
            plugin.execute(input);
            
            //Auto scroll
            plugin.element[0].scrollTop = plugin.element[0].scrollHeight;
        });
        
        $(this.element).bind('click', {plugin: this}, function(event) {
            
            var plugin = event.data.plugin;
            var input = plugin.elements.CommandInputField;
			var selection = window.getSelection().toString();
            if(selection !== ""){ //Prevent focusing when selecting text
                return;
            }

            var y = plugin.element[0].scrollTop; //prevent autoscrolling 
            input.focus();
            plugin.element[0].scrollTop = y;
        });
        
        //To make that thingy blink
        $(this.elements.CommandInputField).trigger('init');
        this.element.append(this.elements.log, this.elements.location, this.elements.inputMirror, this.elements.form);
        
        //help function
        this.registerCommand("help", "Overview of available commands", function(jscmd, params){

            var maxfunctionNameLenght = 20;
            $.each( jscmd.commandCollection, function( key, value ) {
                
                var paddingRight = '';
                var name = value.name.substring(0, maxfunctionNameLenght);
                var m = Math.abs(name.length - maxfunctionNameLenght);
                for(var x = 0; x <= m; x++){
                    paddingRight += "&nbsp;";
                }
                jscmd.addLogEntry(name + paddingRight + value.decription);
            });    
            return true;
         });
        
        //Welcome text
        //this.addLogEntry('&#9617;&#9608;&#9733; JSCMD &#9733;&#9608;&#9617;');
        this.addLogEntry('JSCMD [Version: ' + options.version + ']');
        this.addLogEntry('(c) 2014 Dennis Wethmar. &#9733;');
        this.addLogEntry("&nbsp;");
    };

    Plugin.prototype.addLogEntry = function(t) {
        this.elements.log.append($(document.createElement('div')).attr({class: 'log'}).html(t));
    };
    
    Plugin.prototype.registerCommand = function(name, description, logic) {
        this.commandCollection.push(new Command(name, description, logic));
    };
    
    Plugin.prototype.execute = function(c) {
        
        var params = c.match(/(".*?"|[^"\s]+)+(?=\s*|\s*$)/g);
        if(params === null || params.length === 0){
            params = new Array();
        }
        var commandName = params.shift();
        
        if(typeof commandName === 'undefined'){
            return;
        }
        
		$.each( params, function( key, value ) { // remove outer qoutes of params
			if (value.charAt(0) === '"' && value.charAt(value.length -1) === '"')
			{
				params[key] = value.substr(1,value.length -2);
			}
		});
		
        var result = $.grep(this.commandCollection, function(e){ 
            return e.name.toLowerCase() === commandName; 
        });
        
        if(result.length > 0){
            var command = result[0];
            var done = command.logic(this, params);
            if(typeof done !== 'undefined' && done === true){ 
                 this.executionFinished();
            }
        }else{
            this.addLogEntry("'" + commandName + "' is not recognized as an internal or external command");
            this.addLogEntry("&nbsp;");
        }
    };
    
    Plugin.prototype.executionFinished = function(){
        this.addLogEntry("&nbsp;");
    };
    
    function Command(name, decription, logic){
        this.name = name;
        this.decription = decription;
        this.logic = logic;
    }
    
    /*
     * Plugin wrapper, preventing against multiple instantiations and
     * return plugin instance.
     */
    $.fn[pluginName] = function(options) {

        var plugin = this.data(dataKey);

        // has plugin instantiated ?
        if (plugin instanceof Plugin) {
            // if have options arguments, call plugin.init() again
            if (typeof options !== 'undefined') {
                plugin.init(options);
            }
        } else {
            plugin = new Plugin(this, options);
            this.data(dataKey, plugin);
        }

        return plugin;
    };

}(jQuery, window, document));