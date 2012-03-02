// Just a basic server setup for this site
var Stack = require('stack'),
    Creationix = require('creationix'),
    Http = require('http'),
    ChildProcess = require('child_process'),
    ConfigParams = require('./config-params'),
	logger = require('nlogger').logger(module);


var port = process.env.port || ConfigParams.port || 1337;
var gitRepoPath = process.env.gitrepoblogpath || ConfigParams.repositoryPath || __dirname;
var gitBinDir = ConfigParams.gitBinDir || process.env.ProgramFiles ? process.env.ProgramFiles + "/Git/bin/" : "";

require('git-fs').setBinaryDir(gitBinDir);
	
Http.createServer(Stack(
  Creationix.log(),
  handleGitHook,
  require('wheat')(gitRepoPath, {preProcessMarkdown: preProcessMarkdown})
  )).listen(port);

logger.info('running on port:' + port);
logger.info('git repo path:' + gitRepoPath);

function handleGitHook(req, res, next) {
	if (req.method == 'POST' && req.url == '/hook') {
  		gitExec(['--git-dir=' + gitRepoPath, 'fetch'], 'utf8', function (err, text) {
    		if (err) {
    			logger.error("Error while serving page: {}", err);
    			res.writeHead(500);
   				res.end(err);
    		} else {
    			console.info(text);
    			res.writeHead(200);
   				res.end('OK');	
    		}
  		});
   }
   else {
		next();   	
   }	
}

function preProcessMarkdown(props) {
	var markdown = props.markdown;
	
	var mainMatches = markdown.match(/(#+)\s*Info[ ]*([\r\n][\r\n]?[ \t]*(\w+):\s*(.*))+/g)
	mainMatches && mainMatches.forEach(function(mainMatch){
		var head = mainMatch.match(/(#+)\s*Info[ ]*[\r\n][\r\n]?/)[0].trim();
	
		var info = mainMatch.split(/[\r\n]+/).reduce(function(info, line){
			if (line) {
				var match = line.trim().match(/^(\w+):\s*(.*)$/);
				if (match) {
					info.push({k: match[1], v: match[2].split(/ \/ /)});
				}
			}			
			return info;
		}, []);
		
		var body = info.map(function(entry){
			var s = "<dt>" + entry.k + "</dt>";
			entry.v.forEach(function(v){
				s += "<dd>" + v + "</dd>";
			});
			return s;
		}).join('\n');
		
		var full = head + '\n\n<dl class="info">\n' + body + '\n</dl>\n';
		markdown = markdown.replace(mainMatch, full);
	});
	
	props.markdown = markdown;
}

/*
function gitExec(commands, encoding, callback) {
  var child = ChildProcess.spawn("git", commands);
  var stdout = [], stderr = [];
  child.stdout.addListener('data', function (text) {
    stdout[stdout.length] = text;
  });
  child.stderr.addListener('data', function (text) {
    stderr[stderr.length] = text;
  });
  child.addListener('exit', function (code) {
    if (code > 0) {
      console.log('stderr' + stderr);
      callback(stderr);
      return;
    }
    callback(null, stdout);
  });
  child.stdin.end();
}
*/