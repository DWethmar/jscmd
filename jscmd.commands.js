
function loadCommands(jscmd){
        
    //help function
    jscmd.registerCommand("help", "Provides Help information for jscmd commands.", function(jscmd, params){

        var maxfunctionNameLenght = 10;
        
        var commands =  jscmd.commandCollection.sort(function(a, b){
            var aName = a.name.toLowerCase();
            var bName = b.name.toLowerCase(); 
            return ((aName < bName) ? -1 : ((aName > bName) ? 1 : 0));
        });
        
        $.each(commands, function( key, value ) {
            var paddingRight = '';
            var name = value.name.substring(0, maxfunctionNameLenght);
            var m = Math.abs(name.length - maxfunctionNameLenght);
            for(var x = 0; x <= m; x++){
                paddingRight += "&nbsp;";
            }
            jscmd.addLogEntry(name.toUpperCase() + paddingRight + value.decription);
        });
     });
     
    //Welcome!
	var commandCdDescription = "Display the name of or changes the current directory.";
    jscmd.registerCommand("cd", commandCdDescription, function(jscmd, params){
        
        var relativePathParts = new Array();
        var currentPathParts = new Array(); 
        
        if(typeof params[0] === "undefined"){
            jscmd.setPath(jscmd.getPath());
        }
        
		if(params.length === 0){
			jscmd.addLogEntry(jscmd.getPath());
			return;
		}else{
			if(params[0].length === 1 && params[0].charAt(0) === "\\"){ //Go to root
				currentPathParts.unshift(jscmd.options.disk + ":");
			}else{
				var relativePathParts = params[0].split('/');
				var currentPathParts = jscmd.options.path.split("\\").filter(function(n){ //No empty part yes please
					return n.length > 0;
				});
				$.each(relativePathParts, function(key, value){
					if(value === ".." && currentPathParts.length > 0){
						currentPathParts.pop();
					}else{
						if(value.charAt(0) !== "."){
							currentPathParts.push(value);
						}
					}
				});
				currentPathParts.unshift(jscmd.options.disk + ":");
			}
		}
        jscmd.setPath(currentPathParts.join("\\"));
    });
	
	var commandTimeDescription = "Display browser time.";
	jscmd.registerCommand("time", commandTimeDescription, function(jscmd, params){
		currentTime = new Date();
		time = currentTime.getTime();
		hours = currentTime.getHours();
		minutes = currentTime.getMinutes();
		seconds = currentTime.getSeconds();
		miliseconds = currentTime.getMilliseconds()
        jscmd.addLogEntry("Current time: " + hours + ":" + minutes + ":" + seconds + ","+miliseconds);
    });
    
    jscmd.registerCommand("hello", "hello world.", function(jscmd, params){
        jscmd.addLogEntry("Hello world!");
        jscmd.addLogEntry("Your params: " + params.join(", "));
    });
	
	jscmd.registerCommand("ver", "Display the JSCMD version", function(jscmd, params){
        jscmd.addLogEntry(jscmd.options.namespace + " [version: " + jscmd.options.version + "]");
    });
    
	jscmd.registerCommand("netwerk", "Display netwerk data", function(jscmd, params){
		var url = 'http://ip-api.com/json';
		$.get(url, function(data){
			jscmd.addLogEntry("Calling " + url);
			$.each(data, function(k, v) {
				if(k !== ''){
					jscmd.addLogEntry(k + ": " + v);
				}				
			});
		}).fail(function() {
			jscmd.addLogEntry("Error while connecting to: " + url);
		}).always(function(){
			jscmd.executionFinished();
		});
		
		return true; //Return true is exiting on own terms
    });
	
    jscmd.registerCommand("rps", "Rock Paper Sciccors!", function(jscmd, params){
        var things = ['Rock', 'Paper', 'Scissor'];
        var computerPick = things[Math.floor(Math.random()*things.length)];

        var userPick = params[0];

        if(typeof userPick === 'undefined'){
            jscmd.addLogEntry("Please choose: Rock, Paper, Scissor");
            jscmd.addLogEntry("Example: rps Rock");
            return;
        }

        var result = 0; // 0 = draw, 1 = win, 2 = lose

        jscmd.addLogEntry('The computer chose: ' + computerPick);
        jscmd.addLogEntry('The player chose: ' + userPick);

        switch(userPick.toLowerCase()) {
            case 'rock':
                    if(computerPick.toLowerCase() === "scissor"){
                        result = 1;
                    }
                    if(computerPick.toLowerCase() === "paper"){
                        result = 2;
                    }
                break;
            case 'paper':
                    if(computerPick.toLowerCase() === "rock"){
                        result = 1;
                    }
                    if(computerPick.toLowerCase() === "scissor"){
                        result = 2;
                    }
                break;
            case 'scissor':
                    if(computerPick.toLowerCase() === "paper"){
                        result = 1;
                    }
                    if(computerPick.toLowerCase() === "rock"){
                        result = 2;
                    }
                break;
            default:
                result = 3;
                jscmd.addLogEntry("?");
        }

        if(result === 0){
            jscmd.addLogEntry("Draw!");
        }else{
            if(result === 1){
                jscmd.addLogEntry("You won!");
            }else if(result === 2){
                jscmd.addLogEntry("Draw!");
            }else{
                jscmd.addLogEntry("Profit!");
            }
        }
    });
}