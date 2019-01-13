const express = require('express');
var admin = require('firebase-admin');
var serviceAccount = require('./calcium-subject-228218-3662f2b8c06c.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://calcium-subject-228218.firebaseio.com/'
});

var marketSpace = []
var datab = admin.database();
datab.ref("Market/").once("value").then((result) => {
    marketSpace = result.val()
}).then(function(val){
    app.listen(port, function(){
        console.log("Marketplace app listening on port",port)
    })
}).catch((error)=>{
    throw new Error("Unable to access database please try again later \n",error);
})

const app = express();
const port = 3000

function Product(name, inventoryCount, price){
    this.name = name;
    this.inventoryCount = inventoryCount;
    this.price = price;
}


function findProduct(name){
    return marketSpace[name]
}

function updateItem(product, name = product.name){
    return datab.ref("Market/"+name).set(product).then((value)=>{
        console.log("writing to the server was a success")
        return true
    }).catch((value)=>{
        console.log("the writing to the server failed", value)
        return false
    })
}

function addToMarket(name, inventoryCount, price){
    if(findProduct(name) != undefined)
        return false;
    let product = new Product(name, inventoryCount, price)
    if(updateItem(product))
        marketSpace[product.name] = product
    else
        return false
    

    return true;
}

app.post('/add',function(req,res){ //add a product to the marketspace

    if(!req.query.name || !req.query.inventoryCount || !req.query.price){
        res.status(400).send("wrong number of keys")
        return
    }
    if(req.query.inventoryCount<0 || req.query.price<0){
        res.status(400).send("Incorrect value(s) for inventory count and/or price")
        return
    }
    if(!addToMarket(req.query.name, req.query.inventoryCount, req.query.price)){
        res.status(400).send("Something went wrong. The Item might already exist")
        return
    }
    res.status(200).send("Product created.")
})

app.post('/list', function(req,res){  //list all products
    res.status(200).send(marketSpace)
})

app.post('/find', function(req,res){ //find a specific product
    if(!req.query.name){
        res.status(400).send("Name not in query");
        return
    }
    var product = findProduct(req.query.name)
    if(product == undefined){
        res.status(400).send("product doesn't exist")
        return
    }
    res.status(200).send(product)
})

app.post('/delete', function(req,res){ //deletes a specific product
    if(!req.query.name){
        res.status(400).send("Name not in query");
        return
    }
    let item = findProduct(req.query.name)
    if(item == undefined){
        res.status(400).send("Product doesn't exist")
        return
    }
    if(updateItem(null, item.name))
        marketSpace[item.name] = undefined;
    else{
        res.status(400).send("Something went wrong")
        return
    }
    res.send("item succesfully removed")
})

app.post('/orderItem', function(req,res){ // orders an item
    if(!req.query.name){
        res.status(400).send("Name not in query")
        return
    }
    let product = findProduct(req.query.name)
    if(product == undefined){
        res.status(400).send("Product not found")
        return
    }
    if(product.inventoryCount<1){
        res.status(400).send("item out of stock")
        return
    }
    product.inventoryCount--;
    updateItem(product)
    res.status(200).send("Item purchased succefully")
})


