// BASE SETUP
// =============================================================================

// call the packages we need
var express    = require('express');
var bodyParser = require('body-parser');
var app        = express();
var morgan     = require('morgan');
var userauth = require('./app/modules/userAuth.js');
var employeeauth = require('./app/modules/employeeAuth.js');
var async = require('async');

/*
var NodeRSA = require('node-rsa');
var fs = require('fs');

var key = new NodeRSA(fs.readFileSync('./data/private.pem'));
key.setOptions({signingScheme:'sha1'});


var text = 'Hello RSA!';
var signature = key.sign(text);
console.log('encrypted: ', signature.length);

var verification = key.verify(text,signature);
console.log('result: ', verification)
*/

;


// configure app
app.use(morgan('dev')); // log requests to the console

// configure body parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port     = process.env.PORT || 8080; // set our port

var User     = require('./app/models/user');
var database = require('./app/modules/database.js');

//to change secret also change in jwtAuth
app.set('jwtTokenSecret', 'hastodosecrettosecrettootell');


// GENERAL ROUTING
// =============================================================================

var router = express.Router();

router.use(function(req, res, next) {
	console.log('Request arrived.');
	next();
});


router.get('/', function(req, res) {
	res.json({ result: {message:'Welcome to Train Tickets API!' } });	
});

// USER ROUTING
// =============================================================================

router.route('/register')
	.post(function(req, res) {
		
		var new_user = new User(req.body);
		if (new_user.validate()) {
			database.registeruser(new_user, function (err, result) {

				if (err || result == null) 
					res.status(400).json({result: {error: 'Duplicate username or creditcard id' }})
				else
					res.json({ result: {message: 'Sucess'} })
			})
		}
		else {
			res.json({ result: {error:'Invalid user' } });
		}
		
	})

router.route('/login')
	.post(function(req, res) {
		if (req.body.username != undefined && req.body.username != "" && req.body.password != undefined && req.body.password != "") {
			User.login(req.body.username, req.body.password, res, req.app);
		} else {
			res.status(400).json({
				error: "Invalid request"
			});
		}
})

router.route('/loginemployee')
.post(function(req, res) {
	if (req.body.email != undefined && req.body.email != "" && req.body.password != undefined && req.body.password != "") {
		User.loginemployee(req.body.email, req.body.password, res, req.app);
	} else {
		res.status(400).json({
			error: "Invalid request"
		});
	}
})

app.get("/api/testlogin", [userauth], function (req, res) {
	res.send(req.user);
});

app.get("/api/testemployee", [employeeauth], function (req, res) {
	res.send(req.user);
});

router.route('/teste')
	.get(function(req, res) {

		//database.teste();
		res.json({ result: {message:'Sucess' , tickets:[]} });
})

router.route('/stations')
	.get(function(req, res) {
		// TODO check if req has login enabled
		// TODO return stations from auth user
		database.getStations(function(err, data){
			if (err) {
	            console.log("ERROR : ",err);            
	        } else {            
	            res.json({stations: data});   
	        }  
		});
		//res.json({ result: {message:'Sucess' , tickets:[]} });
})


//return unused tickets of a user
router.route('/tickets')
	.get(function(req, res) {
		//database.teste();
		// TODO check if req has login enabled
		// TODO return tickets from auth user
		var user = req.query.user;

		database.getUnusedTickets(user, function(err, data){
			if (err) {
	            // error handling code goes here
	            console.log("ERROR : ",err);            
	        } else {            
	            // code to execute on data retrieval
	            console.log("result from db is : ", data);
	            res.json(data);   
	        }    
		});
		//res.json({ result: {message:'Sucess' , tickets:[]} });
})

router.route('/route')
	.get(function(req, res) {
		// TODO check if req has login enabled
		// TODO return tickets from auth user
		var from = req.query.from;
		var to = req.query.to;
		var time = req.query.time;
		var date = req.query.date;

		database.getRoute(from, to, time, date, function(err, data){
			if (err) {
	            console.log("ERROR : ",err);            
	        } else {            
	            res.json(data);   
	        }    
		});
		//res.json({ result: {message:'Sucess' , tickets:[]} });
})

//returns the distance, price and starting times, given a starting and ending station
router.route('/routes')
	.get(function(req,res) {
		var from = req.query.from;
		var to = req.query.to;
		var date = req.query.date; //needed to check if tickets are sold_out
		/*
		database.teste(function(err, data){
			if (err) {
	            // error handling code goes here
	            console.log("ERROR : ",err);            
	        } else {            
	            // code to execute on data retrieval
	            console.log("result from db is : ",data);   
	        }    
		});*/

		database.getTrainTimes(from, to, function(err, data){
			if (err) {
	            // error handling code goes here
	            console.log("ERROR : ",err);            
	        } else {            
	            // code to execute on data retrieval
	            res.status(200);
	            console.log("result from db is : ",data);   
	            //res.json({ result: {message:'Sucess' , tickets:[]} });
	            res.json(data);
	            /*
	            async.forEachOf(data.trips, function(value, key, callback){
	            	database.checkTrainCapacity(from, to, value.times[0], value.train, key, function(data){

						console.log("AAAAAA");
	            		console.log(JSON.stringify(data));
	            		//data.trips[key]['sold_out'] = data['result'];
	            		
	            	})
	            	callback();
            	},
	            function(err){

	            	res.json({ result: {message:'Sucess' , tickets:[]} });
	            } 
            	);
				*/
	            /*
	            for(var i = 0; i < data.trips.length; i++){
	              checkTrainCapacity(from, to, data.trips[i].times[0], data.trips[i].train, function(data){
	                //result.trips[i]['sold_out'] = data;
	                console.log("SAME SHIT");
	              });    
	              
	              console.log("JA FOSTE");

	            }*/

	            
	        }    
		});		
})

// EMPLOYEE ROUTING
// =============================================================================

router.route('/loginemployee')
.post(function(req, res) {
	if (req.body.email != undefined && req.body.email != "" && req.body.password != undefined && req.body.password != "") {
		User.loginemployee(req.body.email, req.body.password, res, req.app);
	} else {
		res.status(400).json({
			error: "Invalid request"
		});
	}
})

app.get("/api/testemployee", [employeeauth], function (req, res) {
	res.send(req.user);
});

router.route('/simpletrains')
.get(function(req, res) {
	database.getSimpleTrains(function(err, data){
		if (err) {
            console.log("ERROR : ",err);            
        } else {            
            res.json({trains: data});   
        }  
	});
	//res.json({ result: {message:'Sucess' , tickets:[]} });
})

router.route('/downloadtickets')
	.get(function(req, res) {
		var from = req.query.from;
		var to = req.query.to;
		var time = req.query.time;
		var date = req.query.date;

		if (from == undefined || !from  || from == "" ||
			to == undefined || !to  || to == "" ||
			time == undefined || !time  || time == "" ||
			date == undefined || !date  || date == "") res.status(400).json({error: 'Missing request parameters'});
		else {
			database.getAllTickets(from, to, time, date, function(err, data){
				if (err) {
		           res.status(400).json({error: err});              
		        } else {            
		        	console.log(data);
		            res.json(data);   
		        }    
			});
		}
		
})


/*
	Employee app workflow:
	/api/simpletrains
	screen 1 -> screen 2
*/

// TRAIN ROUTING
// =============================================================================	

router.route('/schedule')
.get(function(req, res) {
	// TODO check if req has station 1 and 2 data
	res.json({ result: {message:'Sucess' , data:[]} });
})


//may not be needed, /schedule can send all the info?

router.route('/schedule/detail')
.get(function(req, res) {
	// TODO check if req has station 1 and 2 data
	res.json({ result: {message:'Sucess' , data:[]} });
})

// OPERATIONAL ROUTING
// =============================================================================	

router.route('/tickets/purchase')
	.post([userauth], function(req, res) {
		var user_id = req.user.id;
		var from = req.body.from;
		var to = req.body.to;
		var date = req.body.date;
		var time = req.body.time;
		
		//if multiple tickets, do transaction
		database.buyTickets(user_id, from, to, date, time, function(err, data){
			if(err){
				res.status(400);
				res.json({error: err});
			}else{
				res.json(data);
			}
		});
})


router.route('/tickets/validate')
	.post(function(req, res) {
		// TODO check if req has login enabled
		// TODO check if ticket data is present
		res.json({ result: {message:'Sucess'} });
})


router.route('/tickets/listing')
	.post(function(req, res) {
		// TODO check if req has employee AUTH
		// TODO check if req has trip detail (like the purchase?)
		res.json({ result: {message:'Sucess'} });
})

router.route('/ping')
.get(function(req, res) {
	res.status(200).json({ result: {message:'Sucess'} });
	//res.json({ result: {message:'Sucess'} });
})


// REGISTER OUR ROUTES -------------------------------
app.use('/api', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Listening on port ' + port);
