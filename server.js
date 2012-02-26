// Just a basic server setup for this site
var Stack = require('stack'),
    Creationix = require('creationix'),
    Http = require('http'),
    ChildProcess = require('child_process');
    ConfigParams = require('./config-params');


var port = process.env.port || ConfigParams.port || 1337;
var gitRepoPath = process.env.gitrepoblogpath || ConfigParams.repositoryPath || __dirname;
var gitBinDir = ConfigParams.gitBinDir || process.env.ProgramFiles ? process.env.ProgramFiles + "/Git/bin/" : "";

require('git-fs').setBinaryDir(gitBinDir);
	
Http.createServer(Stack(
  Creationix.log(),
  handleGitHook,
  require('wheat')(gitRepoPath)
  )).listen(port);

console.log('running on port:' + port);
console.log('git repo path:' + gitRepoPath);

function handleGitHook(req, res, next) {
	if (req.method == 'POST' && req.url == '/hook') {
  		gitExec(['--git-dir=' + gitRepoPath, 'fetch'], 'utf8', function (err, text) {
    		if (err) {
    			console.log(err);
    			res.writeHead(500);
   				res.end(err);
    		} else {
    			console.log(text);
    			res.writeHead(200);
   				res.end('OK');	
    		}
  		});
   }
   else {
		next();   	
   }	
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