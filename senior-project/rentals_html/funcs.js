module.exports = {
    dateChecker: function(reservation,startDate,endDate)
    {
        //Boolean to determine if can can be added to list of available cars
        var isAvailable = false;

        //Get dates from reservation
        var resStart = new Date(reservation.pickup);
        var resEnd = new Date(reservation.dropoff);

        //Compare start dates
        // if((startDate < resStart || startDate > resEnd) && 
        // (endDate < resStart || endDate > resEnd))
        if(startDate < resStart && endDate < resStart)
        {   
            isAvailable = true;
        }

        //return boolean
        return isAvailable;
    },

    //Uploads a reservation to the DB
    makeReservation: function(plocation,dlocation,car,pickupDate,pickupTime,dropoffDate,dropoffTime,user)
    {
        //Client for DB upload
        const docClient = new AWS.DynamoDB.DocumentClient();

        //Table to upload to
        const table = 'senior-project-db-test';

        //Random unique id for reservation
        const resID = Math.floor(Math.random() * (999 - 100 + 1)) + 100;

        //Make date string for pickup and dropoff
        var pickupDS = pickupDate + ' ' + pickupTime;
        var dropoffDS = dropoffDate + ' ' + dropoffTime;

        //Input record
        const DBinput = {
            'PK': user,
            'SK': 'res_' + resID.toString(),
            'GSI1': car,
            'pickup-location': plocation,
            'pickup': pickupDS,
            'dropoff-location': dlocation,
            'dropoff': dropoffDS
        };

        //DB params
        const DBParams = {
            TableName: table,
            Item: DBinput
        };

        //try to insert record into db
        try{
            docClient.put(DBParams, function(err,data){
                if(err)
                {
                    console.log(err);
                    return false;
                }else
                {
                    console.log('db updated');
                    return true;
                }
            })
        }catch(e){
            console.log(e);
            return false;
        }
    }
}