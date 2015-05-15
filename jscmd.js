//     ___  _____  _____ ___  _________ 
//    |_  |/  ___|/  __ \|  \/  ||  _  \
//      | |\ `--. | /  \/| .  . || | | |
//      | | `--. \| |    | |\/| || | | |
//  /\__/ //\__/ /| \__/\| |  | || |/ / 
//  \____/ \____/  \____/\_|  |_/|___/  
//                                      
/*
 *  Project: jscmd
 *  Description: Command prompt in javascript and jQuery
 *  Author: Dennis Wethmar
 *  License: MIT
 */

// the semi-colon before function invocation is a safety net against concatenated
// scripts and/or other plugins which may not be closed properly.
;
(function($, window, document, undefined) {

    var pluginName = "jscmd",
	// key using in $.data()
	dataKey = "plugin_" + pluginName;
        
    function Plugin(element, options) {
        
        element.append($(document.createElement("div")));
        this.element = element.find("div");

        this.options = {
            version: "1.1.0",
            namespace: "jscmd",
            disk: "J",
            path: "\\"
        };

        this.elements = {
            inputField: undefined,
            inputMirror: undefined,
            form: undefined,
            prompt: undefined
        };
        
        this.programmeCollection = new Array();
		
        this.commandHistory = new Array();
        this.commandPlaybackIndex = 0;
		
		this.commandQueue = new Array(); //Commands to be excecuted
		this.currentCommand;
		this.inputCallback;
		
        $.extend(this.options, options);

        this.init(this.options);
    };

    // initialize options
    Plugin.prototype.init = function(options) {

        this.element.empty();
        this.element.parent().addClass(options.namespace + "-container");
        this.element.addClass(options.namespace);

        var logClass = options.namespace + "-log";
        this.elements.log = $(document.createElement("div")).attr({
            class: logClass
        });

        var CommandInputFieldClass = options.namespace + "-inputField";
        this.elements.CommandInputField = $(document.createElement("input")).attr({
            class: CommandInputFieldClass,
            name: options.namespace + "-inputField",
            type: "text",
            autocomplete: "off",
            unselectable : "off",
            onselectstart: "return false;",
            onmousedown: "return false;",
			style: "pointer-events: auto !important"
        }).css({
            "-moz-user-select": "none",
            "-webkit-user-select": "none",
            "-ms-user-select": "none",
            "user-select": "none",
        });
        
        this.elements.form = $(document.createElement("form")).attr({
            method: "GET"
        }).css({
            position: "relative",
            left: "-9999px",
        }).append(this.elements.CommandInputField);

        var promptClass = options.namespace + "-prompt";
        this.elements.prompt = $(document.createElement("label")).attr({
            class: promptClass,
            for : CommandInputFieldClass
        }).html(this.getPath());

        var inputMirrorClass = options.namespace + "-inputMirror";
        this.elements.inputMirror = $(document.createElement("span")).attr({
            class: inputMirrorClass
        });
				
        $(this.elements.CommandInputField).bind("keyup keydown init", {plugin: this}, function(event) { //Handle keyboard input
            var plugin = event.data.plugin;
            var input = plugin.elements.CommandInputField;
            var inputValue = input.val();
            var inputPosition = input[0].selectionStart;

            var mirrorInput = "";
            for (var i = 0; i < inputValue.length; i++)
            {
                if (inputValue.charAt(i) === " ") {
                    mirrorInput += "<span>&nbsp;</span>";
                } else {
                    mirrorInput += "<span>" + inputValue.charAt(i) + "</span>";
                }
            }
            
            plugin.elements.inputMirror.html(mirrorInput);
            if (inputPosition <= inputValue.length) {
                plugin.elements.inputMirror.append($("<span>&nbsp;</span>"));
                plugin.elements.inputMirror.find("span:eq(" + inputPosition + ")").addClass("input-position");
            }
        });

        $(this.elements.form).bind("submit", {plugin: this}, function(event) { //New input by user!
            event.preventDefault();
            var plugin = event.data.plugin;
            var input = plugin.elements.CommandInputField.val();
            plugin.elements.CommandInputField.val("");
            plugin.elements.inputMirror.empty();

            if(input !== "" && input !== plugin.commandHistory[0]){
                plugin.commandHistory.unshift(input); //Add new entry to the history
            }

            var path = $("<div>").append( //Put the path in a span so we can style it
                $("<span>").addClass("prompt").html(plugin.getPath())
            ).html();

            plugin.queueCommand(input);
            plugin.scrollDown();
        });
		
        $(this.elements.CommandInputField).bind("keydown", {plugin: this}, function(event) { //Command playback listener

                var plugin = event.data.plugin;
                var historyLenght = plugin.commandHistory.length;
                var currentIndex = plugin.commandPlaybackIndex;

                switch(event.which) {
                    case 38: // up
                            plugin.commandPlaybackIndex++;
                            if(plugin.commandPlaybackIndex >= historyLenght){
                                    plugin.commandPlaybackIndex = historyLenght - 1;
                            }
                    break;
                    case 40: // down
                            plugin.commandPlaybackIndex--;
                            if(plugin.commandPlaybackIndex < 0){
                                    plugin.commandPlaybackIndex = 0;
                            }
                    break;
                    case 13: // enter
                            plugin.commandPlaybackIndex = 0;
                            return;
                    break;
                    default: return; // exit this handler for other keys
                }

                plugin.elements.CommandInputField.val(plugin.commandHistory[currentIndex]);
                event.preventDefault(); // prevent the default action (scroll / move caret)
        });
        
        $(this.element).bind("click", {plugin: this}, function(event) {
            var plugin = event.data.plugin;
			var selection = window.getSelection().toString();
            if(selection !== ""){ //Prevent focusing when selecting text
                return;
            }
            var y = plugin.element[0].scrollTop; //prevent auto-scrolling 
            
			var input = plugin.elements.CommandInputField;
			input.focus();
            plugin.element[0].scrollTop = y;
        });
        
        $(this.elements.CommandInputField).bind("focus", {plugin: this}, function(event) { //Toggle focus class on the plug-in container (used for the fancy blinking indicator)
                var plugin = event.data.plugin;
                plugin.element.addClass("focus");
        }).bind("blur", {plugin: this}, function(event) {
                var plugin = event.data.plugin;
                plugin.element.removeClass("focus");
        });
		
        //To make that thingy blink
        $(this.elements.CommandInputField).trigger("init");
        this.element.append(this.elements.log, this.elements.prompt, this.elements.inputMirror, this.elements.form);
        
        this.addLogEntry(this.options.namespace + " [version " + this.options.version + "]");
        this.addLogEntry("Noperight (c) 2015 Dennis Wethmar. All your base. &#9812;");
        this.addEmptyLogEntry()
    };
	
    Plugin.prototype.addLogEntry = function(log, id) {

		var e = $(document.createElement("div"));
		
		if (typeof variable !== 'undefined') {
			e.addClass("log-entry-"+id);
		}
		e.addClass("log-entry");
		
		this.elements.log.append(e.html(log));
        return e;
    };
	
	Plugin.prototype.addEmptyLogEntry = function() {
        return this.addLogEntry('', null).addClass('empty-log-entry');
    };
    
	Plugin.prototype.scrollDown = function() {
        this.element[0].scrollTop = this.element[0].scrollHeight;
    };
	
    Plugin.prototype.registerProgramme = function(name, description, logic) {
        this.programmeCollection.push(new Programme(name, description, logic));
    };
    
    Plugin.prototype.getPath = function(){
        return this.options.disk + ":" + ( this.options.path === "" ? "\\" : this.options.path) + ">";
    };
    
    Plugin.prototype.setPath = function(path){
        this.elements.prompt.html(path);
    };
	
    Plugin.prototype.resetPath = function(){
        this.elements.prompt.html(this.getPath());
    };
	
    Plugin.prototype.showPrompt = function(enable){

        if(enable === true){
                this.elements.inputMirror.show();
                this.elements.prompt.show();
        }else{
                this.elements.inputMirror.hide();
                this.elements.prompt.hide();
        }
    }
    
    Plugin.prototype.queueCommand = function(fullCommand) {

        if(typeof function () {} === typeof this.inputCallback){ //First check if theres a progrmme eaiting for input
                this.inputCallback(getParametersFromString(fullCommand));
        }else{
                this.commandQueue.push(fullCommand);
                if(typeof this.currentCommand === "undefined" ){
                        execute.call(this);
                }
        }
    };
	
	function getParametersFromString(command){
		var parameters = command.match(/(".*?"|[^"\s]+)+(?=\s*|\s*$)/g); //Separated by a space or between "
        if(parameters === null || parameters.length === 0){
            parameters = new Array(); //No parameters found
        }
		return parameters;
	}
	
	function execute(){
		
		if(this.commandQueue.length == 0){
			return;
		}
		
		var fullCommand = this.commandQueue.shift();
		this.addLogEntry(this.getPath() + fullCommand);
		var parameters = getParametersFromString(fullCommand);
		
        var programmeName = parameters.shift(); // Remove The command name from the parameters array
        if(typeof programmeName === "undefined"){ //Empty command!
            //this.executionFinished();
			return;
        }

		$.each( parameters, function( key, value ) { // remove outer quotes of parameters
			if (value.charAt(0) === "\"" && value.charAt(value.length -1) === "\"")
			{
				parameters[key] = value.substr(1,value.length -2);
			}
		});
		
        var programmeSearchResult = $.grep(this.programmeCollection, function(e){ //Find the command in the programmeCollection
            return e.name.toLowerCase() === programmeName.toLowerCase(); 
        });
        
        if(programmeSearchResult.length > 0){
            var programme = programmeSearchResult[0];
			this.currentCommand = new Command(parameters, programme);
        }else{
            this.addLogEntry("'" + programmeName + "' is not recognized as an internal or external command.");
			this.addEmptyLogEntry();
			this.executionFinished();
			return;
        }
		
		this.showPrompt(false);
		
		var keepFocus = false;
		if(typeof this.currentCommand !== "undefined"){
		
			var params = this.currentCommand.params;
			var programme = this.currentCommand.Programme;
			
			try{
				keepFocus = programme.logic(this, params);
			}catch(e){
				var stack = e.stack.split("\n");
				for(var i = 0; i < stack.length; i++){
					this.addLogEntry(stack[i]);
				}
				keepFocus = false;
			}finally{
				if(typeof keepFocus === "undefined"){ //If keepFocus true then don't finish but let the function finish itself
					this.addEmptyLogEntry();
					this.executionFinished();
				}
			}
		}
	}

    Plugin.prototype.executionFinished = function(){
		
		//Check if previous log is empty:
		if(!$( ".log-entry" ).last().hasClass('empty-log-entry')){
			this.addEmptyLogEntry();
		}
		
		this.scrollDown();
		
		delete this.currentCommand;
		delete this.inputCallback;
		
		execute.call(this);

		this.scrollDown();//Auto scroll to inputmirror
		this.resetPath();
		this.showPrompt(true);
    };
	
		
	Plugin.prototype.waitForInput = function(prompt, callback) {
		
		this.setPath(prompt);
		if(typeof function () {} === typeof callback){
			this.showPrompt(true);
			this.inputCallback = callback;
		}else{
			this.executionFinished();
		}
	}
    
	
	//Classes
	function Command(params, Programme){
		this.Deferred = $.Deferred();
        this.params = params;
        this.Programme = Programme;
    }
	
    function Programme(name, decription, logic){
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
            if (typeof options !== "undefined") {
                plugin.init(options);
            }
        } else {
            plugin = new Plugin(this, options);
            this.data(dataKey, plugin);
        }

        return plugin;
    };

}(jQuery, window, document));