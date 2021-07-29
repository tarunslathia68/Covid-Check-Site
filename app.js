const dialogflow = require('@google-cloud/dialogflow');
const uuid = require('uuid');
var express=require('express');
var app=express();
var path=require('path');
var bodyparser=require('body-parser');
var mongoose=require('mongoose');
var passport=require('passport');
var LocalStrategy=require('passport-local');
var User=require('./models/user');
var Hospital=require('./models/hospital.js');
var Patient=require('./models/patient.js');
var nodemailer = require('nodemailer');
const { compile } = require('ejs');
// A unique identifier for the given session
const sessionId = uuid.v4();
require('dotenv').config();
var uri = process.env.MONGODBURI;
var pass = process.env.NODEMAILER;
mongoose.connect(uri, { useNewUrlParser: true , useUnifiedTopology: true })
.then(() => 
console.log("Database is connected!"))


app.use(express.static(path.join(__dirname, '/public')));
//passport config
app.use(require("express-session")({
	secret:"divesh abhishek kheman",
	resave:false,
	saveUninitialized: false
}));

app.use(function (req, res, next) {

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
  });

var transporter = nodemailer.createTransport({
	service: 'gmail',
	auth: {
	  user: 'covidcare96@gmail.com',
	  pass: pass
	}
  });

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()) );
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use(express.json({limit: '50mb'}));
app.use(bodyparser.urlencoded({extended:true,limit: '50mb'}));
var port=process.env.PORT || 3000;
app.listen(port,process.env.IP,function(){
	console.log("server started.");
});

function isAuthenticated(req, res, next){
if(req.body.user)
next();
else
res.redirect('/login');
}

app.get("/",function(req,res){
	res.render("index.ejs",{currentUser:req.user});
});
app.get("/login",function(req,res,next){
	res.render("login.ejs",{currentUser:req.user});
});
app.post('/login',passport.authenticate('local',{failureRedirect:'/login'}),function(req,res){
	res.redirect('/dash');
});
app.get("/reghos",function(req,res,next){
	res.render("reghos.ejs");
});

app.get("/analytics",function(req,res,next){
	Hospital.findOne({_id:req.user.hospitalid},function(err,hospital){
		if(err)
		console.log(err);
		else{
			
			res.render('anal.ejs',{currentUser:req.user,hospital:hospital});
		}
	
		});
	
});

app.get('/bot',function(req,res,next){
	res.render("bot.ejs",{currentUser:req.user});
});
app.post("/reghos",function(req,res){
    var newhosp={name:req.body.name,pattern:req.body.pattern,address:req.body.address,phone:req.body.phone,beds:req.body.beds,ventilators:req.body.ventilators};
   
    Hospital.create(newhosp,function(err,newlycreated){
		if(err)
			console.log(err);
		else{
			console.log(newlycreated);
			res.redirect("/");
            
		}
			
	});
});

app.get("/signup",function(req,res){
    Hospital.find({},function(err,hospitals){
        if(err)
        console.log(err);
        else
        res.render('signup.ejs',{currentUser:req.user,hospitals:hospitals});
    });

});
app.post("/signup",function(req,res){
	
		
	Hospital.findOne({_id:req.body.hospital},function(err,result){
		var p=result.pattern;
		var regex=new RegExp("^[a-zA-Z0-9.!#$%&'*+=?^_`{​​​​|}​​​​~-]+"+p+"*$");
	console.log(regex);
		if(regex.test(req.body.username)){
			var newUser= new User({username:req.body.username,ename:req.body.ename,hospitalid:req.body.hospital});
		User.register(newUser,req.body.password,function(err,user){
			if(err)
				{
					console.log(err);
					res.redirect('/signup');
				}
			else{
				var mailOptions = {
					from: 'covidcare96@gmail.com',
					to:req.body.username ,
					subject: 'Sign Up Confirmation',
					text: "You can now access the portal."
				  };
				  
	 transporter.sendMail(mailOptions, function(error, info){
		if (error) {
		  console.log(error);
		} else {
		  console.log('Email sent: ' + info.response);
		}
	  });
	  
				res.redirect('/login');
			}
		});
	
		}
		else
		res.send("Error in mail id");
	});
});
	app.get("/dash",function(req,res){
		
		Hospital.findOne({_id:req.user.hospitalid},function(err,hospital){
		if(err)
		console.log(err);
		else{
				res.render("dash.ejs",{currentUser:req.user,hospital:hospital});
			};
		
		});
	
	});
	
	


app.get("/addpatient",function(req,res){
	Hospital.findOne({_id:req.user.hospitalid},function(err,hospital){
		if(err)
		console.log(err);
		else{
			
			res.render('patient.ejs',{currentUser:req.user,hospital:hospital});
		}
	
		});
});

app.post("/addpatient",function(req,res){

		var data={name:req.body.name,location:req.body.location,symptoms:req.body.symptoms,contact:req.body.contact,status:req.body.status,bg:req.body.bg,bedno:req.body.bedno,vent:req.body.vent,remarks:req.body.remarks,admdate:req.body.admdate,hospitalid:req.body.hospitalid};
	   
		if(req.body.vent=='true')
	   {
		Hospital.findById(req.body.hospitalid,function(err,x){
			if(err)
			console.log(err)
			else
			Hospital.findByIdAndUpdate(x._id,{ventilators:x.ventilators-1},function(err){
				if (err) console.log(err);
			});
		});
		
	
	   }
	   else
	   {
		Hospital.findById(req.body.hospitalid,function(err,x){
			if(err)
			console.log(err)
			else
			Hospital.findByIdAndUpdate(x._id,{beds:x.beds-1},function(err){
				if (err) console.log(err);
			});
		});
	
	   }

		Patient.create(data,function(err,newpatient){
		   if(err)
		   console.log(err);
		   else
		   {
			
			res.redirect('/dash');
			
		   }
		   
	   });
	});
	  
	   


	app.get("/viewall",function(req,res){
		Patient.find({hospitalid:req.user.hospitalid},function(err,patient){
			if(err)
			console.log(err);
			else
			res.render("view.ejs",{currentUser:req.body.user,patient:patient});
 
		});
	});

	app.get("/viewpat/:id",function(req,res){
		Patient.findOne({_id:req.params.id},function(err,result){
			if(err)
			console.log(err)
			else
			res.render("viewpat.ejs",{currentUser:req.body.user,patient:result});
		});
	});

	app.get("/modify",function(req,res){
		Patient.find({hospitalid:req.user.hospitalid},function(err,patient){
			if(err)
			console.log(err);
			else
			res.render("modifyall.ejs",{currentUser:req.body.user,patient:patient});
 
		});
	});

	
	app.get("/modify/:id",function(req,res){
		Patient.findOne({_id:req.params.id},function(err,result){
			if(err)
			console.log(err)
			else
			res.render("modify.ejs",{currentUser:req.body.user,patient:result});
		});
	});

	app.get('/modify/:id/deleted',function(req,res){
		
		
		 
	 

		Patient.deleteOne({_id:req.params.id},function(err,result){
			res.redirect('/dash');
		});
		
		
	});

	app.get('/logout',function(req,res){
		req.logOut();
		res.redirect('/');
	});
	
	app.post("/modify/:id",function(req,res){

		var data={name:req.body.name,location:req.body.location,symptoms:req.body.symptoms,contact:req.body.contact,status:req.body.status,bg:req.body.bg,bedno:req.body.bedno,vent:req.body.vent,remarks:req.body.remarks};
	   
		Patient.findOneAndUpdate({_id:req.params.id},data,function(err){
			if (err) console.log(err);
			else res.redirect('/dash');

		})
	});


	app.post("/view/search",function(req,res){
		var name=req.body.name;
		
		Patient.find({name:name},function(err,patients){
			if(err)
			console.log(err);
			else
			{

					res.render('view.ejs',{currentUser:req.body.user,patient:patients});

			}
			
		})
	});
	
	app.post("/modifyall/searchall",function(req,res){
		var name=req.body.name;
		console.log(name);
		Patient.find({name:name},function(err,patients){
			if(err)
			console.log(err);
			else
			{

					res.render('modifyall.ejs',{currentUser:req.body.user,patient:patients});

			}
			
		})
	});

	app.post("/send-msg",(req,resp)=>{
		runSample(req.body.MSG).then(data=>{
			resp.send({Reply : data});
		})
	});
	
	/**
 * Send a query to the dialogflow agent, and return the query result.
 * @param {string} projectId The project to be used
 */
async function runSample(msg,projectId = 'covi-bot-jdiu') {
  

	// Create a new session
	const sessionClient = new dialogflow.SessionsClient({
		keyFilename:"covi-bot-jdiu-8131c217fd56.json"
	});
	const sessionPath = sessionClient.projectAgentSessionPath(projectId, sessionId);
  
	// The text query request.
	const request = {
	  session: sessionPath,
	  queryInput: {
		text: {
		  // The query to send to the dialogflow agent
		  text: msg,
		  // The language used by the client (en-US)
		  languageCode: 'en-US',
		},
	  },
	};
  
	// Send request and log result
	const responses = await sessionClient.detectIntent(request);
	console.log('Detected intent');
	const result = responses[0].queryResult;
	console.log(`  Query: ${result.queryText}`);
	console.log(`  Response: ${result.fulfillmentText}`);
	if (result.intent) {
	  console.log(`  Intent: ${result.intent.displayName}`);
	} else {
	  console.log(`  No intent matched.`);
	}
  
	return result.fulfillmentText ;
  }

