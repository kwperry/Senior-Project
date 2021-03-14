const express = require('express');
const exphbs = require('express-handlebars');
const AWS = require('aws-sdk');
const bcrypt = require('bcrypt');
const fileUpload = require('express-fileupload');
const fetch = require('node-fetch');
var funcs = require('./funcs');
const { dateChecker } = require('./funcs');
const hbs = require('hbs');

var doc = require('aws-sdk');
var dynamodb = new doc.DynamoDB();
const port = process.env.PORT || 3000


// AWS.config.loadFromPath('./config.json');
AWS.config.update({
    "accessKeyId": process.env.accessKeyId ,
    "secretAccessKey": process.env.secretAccessKey ,
    "region": process.env.region
})
//Set AWS Region
//AWS.config.update({region: 'us-east-1'});

const app = express();

//app.use(express.urlencoded({ extended: false }));
app.use(fileUpload());
app.use('/static', express.static('public'));
app.use(express.static('/views/images')); 

hbs.registerPartials(__dirname + '/views/partials');
app.use(express.static(__dirname + '/public'));
app.use(express.urlencoded({extended:true}));

app.engine('handlebars',exphbs());
app.set('view engine','handlebars');

app.get('/', (req,res) => {
    res.render('home.hbs');
});
app.get('/home', (req,res) => {
    res.render('home.hbs');
});

//Update DB entry
app.get('/update', (req, res) => {
    res.render('getupdate.hbs');
})

app.post('/update', (req, res) =>{
    //Use ID to create string to get Car from DB
    var idString = 'car_' + req.body.id;
    console.log(idString);

    var params = {
        Key: {
            "PK":{
                S: idString
            },
            "SK": {
                S: "car"
            }
        },
        TableName: "senior-project-db-test"
    }

    dynamodb = new AWS.DynamoDB;

    dynamodb.getItem(params, function(err,data)
    {
        if(err) console.log(err);
        else {
            
            console.log(typeof(data.Item.mpg));
            res.render('update.hbs', {car: data});
        }
    })
})

//Add Car to DB
app.get('/create',(req,res) => {
    res.render('create.hbs');
});

app.post('/create', async (req,res) => {

    //S3 Upload
    const bucketName = 'senior-project-image-bucket';
    const folderName = '/car-images';
    const s3 = new AWS.S3();   

    const fileContent = Buffer.from(req.files.myFile.data, 'binary');

    
    const s3params = {
        Bucket: bucketName + folderName,
        Key: req.files.myFile.name,
        Body: fileContent
    };

    s3.upload(s3params, function(err,data){
        if(err){
            console.log(err);
        } else{
            console.log('Picture uploaded');
        }
    });

    var s3URL = 'https://' + bucketName + '.s3.amazonaws.com' + folderName + '/' + req.files.image.name;

    //DB Upload
    const docClient = new AWS.DynamoDB.DocumentClient();
    const table = 'senior-project-db-test';

    //Random 3 Digit Number
    const carID = Math.floor(Math.random() * (999 - 100 + 1)) + 100;

    const DBinput = {
        'PK': 'car_' + carID.toString(),
        'SK': 'car',
        'url': s3URL,
        'name': req.body.model + ' ' + req.body.make,
        'mpg': req.body.mpg,
        'type': req.body.type,
        'color': req.body.color,
        'cost': req.body.cost
    };

    const DBparams = {
        TableName: table,
        Item: DBinput
    };

    try{
        docClient.put(DBparams, function(err,data){
            if(err){
                console.log(err);
            }else{
                console.log('DB updated');
                res.render('create.hbs');
            }
        })
    }catch(e){
        console.log(e);
    }
});

//Show Inventory
app.post('/inventory', async (req,res) => {

    console.log(req.body);
    //Get Form Data and create a date string
    var startDS = req.body.pickupDate + ' ' + req.body.pickupTime;
    var endDS = req.body.dropoffDate + ' ' + req.body.dropoffTime;

    //Load date string into Date Object
    var startDate = new Date(startDS);
    var endDate = new Date(endDS);

    var availableCars = [];
    var carData = [];

    const docClient = new AWS.DynamoDB.DocumentClient();

    //Params to get all objects in db with SortKey = car
    let params = {
        TableName: 'senior-project-db-test',
        ProjectionExpression: 'PK, SK',
        FilterExpression: 'SK = :sk_filter',
        ExpressionAttributeValues: {
            ':sk_filter': 'car'
        }
    };

    //Scan document with those params
    docClient.scan(params).promise()
    .then(data => {

        //Loop through the data object that was returned
        data.Items.forEach(carInDB => {

            //Search each car that was returned on the GSI to see if it has a reservation in the DB
            let gsiParams = {
                TableName: 'senior-project-db-test',
                IndexName: 'GSI1-SK-index',
                ProjectionExpression: 'pickup, dropoff',
                KeyConditionExpression: 'GSI1 = :gsi1',
                ExpressionAttributeValues: {
                    ":gsi1": carInDB.PK
                }
            };

            //Query table
            docClient.query(gsiParams).promise()
            .then(gsiData => {

                //Check if Car is rented, if it is not rented push it to available car
                if (gsiData.Count == 0) {
                    var car = carInDB.PK;
                    availableCars.push(car);
                } 
                else if (gsiData.Count > 0) 
                {
                    gsiData.Items.forEach(reservation => {
                        var isAvailable = dateChecker(reservation, startDate, endDate);
                        
                        if(isAvailable)
                        {
                            var car = carInDB.PK;
                            console.log(car);
                            availableCars.push(car);
                        }
                    });
                }
                availableCars.forEach(car => {
                    let carParams = {
                        TableName: 'senior-project-db-test',
                        Key: {
                            'PK': car,
                            'SK': 'car'
                        }
                    }
                
                    docClient.get(carParams).promise() 
                    .then(availableCarsData => {
                       carData.push(availableCarsData);
                    });
                });
            });
        })
        return res.render('./inventory.hbs', {cars: carData});
    });
});

//Reservation
app.get('/reservation', (req,res) => {
    res.render('reservation.hbs');
})

//Register
app.get('/register', (req,res) => {
    res.render('register.hbs');
});

app.post('/signup', (req,res) => {
    
    //Get Form Data
    var password = req.body.password;

    var doc = require('aws-sdk');
    var dynamodb = new doc.DynamoDB();

    //Dynamo DB Object
    var docClient = new AWS.DynamoDB.DocumentClient();
    var table = 'senior-project-db-test';

    bcrypt.hash(password, 3, function(err,hash){
        try {
            var input = {
                'PK': req.body.email,
                'SK': 'profile',
                'password': hash,
                'name': req.body.name,
                'address':req.body.streetaddress,
                'zipcode':req.body.zipcode,
                'city':req.body.city,
                'state':req.body.state,
                'phone': req.body.phone
            };

            //Params
            var params = {
                TableName: table,
                Item: input
            };

            docClient.put(params, function(err, data){
                if(err){
                    console.log(err);
                } else {
                    console.log('success');
        
                    res.render('login.hbs',{loginStatus: 'Account Created! Please Login!'})
                }
            });
        } catch(e){

            console.log(e);
        }
    });
});

//Login
app.get('/adminslogin', (req,res) => {
    res.render('adminslogin.hbs');
})

app.post('/adminscheck', (req,res) => {

    //Get Form Data
    var user = req.body.email;
    var pass = req.body.password;

    //DynamoDB Object
    var docClient = new AWS.DynamoDB.DocumentClient();
    var table = 'senior-project-db-test';

    docClient.get({
        TableName: table,
        Key:{
            'PK': user,
            'SK': 'admin'
        }
    }).promise()
    .then(data => {
        if(Object.entries(data).length === 0)
        {
            res.render('adminslogin.hbs', {loginStatus: 'Incorrect Username/Password'});
        }else{
            
            bcrypt.compare(password,data.Item.password, function(err, response){
                if(response)
                {
                    res.redirect('/adminsinventory.hbs');
                }else{
                    res.render('adminslogin.hbs', {loginStatus: 'Incorrect Username/Password'});
                }
            })
        }
    })
});

app.get('/login', (req,res) => {
    res.render('login.hbs');
})

app.post('/loginCheck', (req,res) => {

    //Get Form Data
    var username = req.body.username;
    var password = req.body.password;

    //Dynamo DB Object
    var docClient = new AWS.DynamoDB.DocumentClient();
    var table = 'senior-project-db-test';

    docClient.get({
        TableName: table,
        Key:{
            'PK': username,
            'SK': 'profile'
        }

    }).promise()
    .then(data => {

        //Check if object is empty
        if(Object.entries(data).length === 0){
            res.render('login.hbs', {loginStatus: 'Incorrect Username/Password'});
        }else{

            //Compare password to hashed password
            bcrypt.compare(password,data.Item.password,function(err,response){
                if(response)
                {
                    res.redirect('/');
                }else{
                    res.render('login.hbs', {loginStatus: 'Incorrect Username/Password'});
                }
            })
        }
    }).catch(console.error);
});

app.listen(port, () => {
    console.log('Listening on port 3000!');
    console.log('http://localhost:3000/home');
});
