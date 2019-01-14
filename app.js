const express = require('express');
var admin = require('firebase-admin');
var serviceAccount = require('./calcium-subject-228218-3662f2b8c06c.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://calcium-subject-228218.firebaseio.com/'
});

var datab = admin.database();

const app = express();
const port = 3000
app.listen(port, function(){
    console.log("Marketplace app listening on port",port)
})

function Product(name, inventoryCount, price){
    this.name = name;
    this.inventoryCount = inventoryCount;
    this.price = price;
}


function findProduct(name){
    let result = undefined
    datab.ref("Market/"+name).once("value", function(data){
        result= data.val()
    }).then((data)=>{
        return result
    })
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
    findProduct(name).then((product) =>{
    if(product != undefined)
        return false;
    let product = new Product(name, inventoryCount, price)
    updateItem().then((result)=>{
        if(updateItem(product))
            return true
        else
            return false
        })
     })

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
    let market = findProduct("")
    if(market  !== undefined)
        res.status(200).send(market)
    else
        res.status(400).send("Couldn't fetch market")
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
    res.send("item succesfully removed")
    else{
        res.status(400).send("Something went wrong")
        return
    }
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

app.post('/changeInventory',function(req,res){ //update the number of items in inventory
    if(!req.query.name){
        res.status(400).send("Name not in query")
        return
    }
    if(!req.query.inventoryCount){
        res.status(400).send("No new inventory count specified")
        return
    }
    let product = findProduct(req.query.name)
    if(product == undefined){
        res.status(400).send("Product not found")
        return
    }
    product.inventoryCount = req.query.inventoryCount
    updateItem(product)
    res.status(200).send("Item inventory changed succefully")
})


