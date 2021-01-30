var data = [{
    "manufacturer": "Porsche",
    "model": "911",
    "price": 135000,
    "wiki": "http://en.wikipedia.org/wiki/Porsche_997",
    "img": "rentals/static/img/2004_Porsche_911_Carrera_type_997.jpg"
}, {
    "manufacturer": "Nissan",
    "model": "GT-R",
    "price": 80000,
    "wiki":  "http://en.wikipedia.org/wiki/Nissan_Gt-r",
    "img": "rentals/static/img/Nissan_GT-R.jpg"
}, {
    "manufacturer": "BMW",
    "model": "M3",
    "price": 60500,
    "wiki":  "http://en.wikipedia.org/wiki/Bmw_m3",
    "img": "rentals/static/img/BMW_M3_E92.jpg"
}, {
    "manufacturer": "Audi",
    "model": "S5",
    "price": 53000,
    "wiki":  "http://en.wikipedia.org/wiki/Audi_S5#Audi_S5",
    "img": "rentals/static/img/Audi_S5.jpg"
}, {
    "manufacturer": "Audi",
    "model": "TT",
    "price": 40000,
    "wiki":  "http://en.wikipedia.org/wiki/Audi_TT",
    "img": "rentals/static/img/Audi_TT_Coupe.jpg"
}];

myFunction(data);

function myFunction(myObject) {
    var out = "";
    var i;
    for (i = 0; i < myObject.length; i++) {
        out += "<p>" + myObject[i].manufacturer + "</p><br><p>" + myObject[i].model + "</p><br> <img style='width:350px;height:250px;' src='" + myObject[i].img + "'>";
        document.getElementById("inventory").innerHTML = out;
    }
}