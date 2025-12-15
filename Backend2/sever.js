let express = require("express");
let cors = require("cors");
let {MongoClient , ObjectId} = require("mongodb");

let multer = require("multer");

let path = require("path");
let fs = require("fs");

let cloudinary=require("cloudinary").v2;
let {CloudinaryStorage}=require("multer-storage-cloudinary");

const { error } = require("console");
const url = "mongodb://0.0.0.0:27017";


// let url="mongodb+srv://sakshichavan61116:ZhMYrr3rOO6DzNRr@cluster0.86yrmn2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

let app = express();
app.use(cors());
app.use(express.json());

// app.use('/uploads',express.static('uploads'));


cloudinary.config({
  cloud_name: "dzywjhdjo",
  api_key: "495924855242887",
  api_secret: "x_bRiuh9GM6r0sAn7FJowBvD3-E"
});

let storage= new CloudinaryStorage({cloudinary});
let recep=multer({storage});

app.post("/upload",recep.single("file"),
(req ,res)=>{
    let client = new MongoClient(url);
    client.connect();
    let db = client.db("tinder");
    let collec = db.collection("photos");

    let obj ={
        username : req.body.username,
        caption : req.body.caption,
        file_url :req.file.path,
        file_name : req.file.filename,
        upload_time :new Date()
    }
    collec.insertOne(obj)
    .then((result) =>{res.send(result)})
    .catch((error)=>res.send(error));
}
);

app.get("/files",

(req ,res)=>{
    let client = new MongoClient(url);

    client.connect();
    let db = client.db("tinder");
    let collec = db.collection("photos");

    let username=req.query.username;
    obj=username?{username}:{};

    collec.find(obj).toArray()
    .then((result) =>{res.send(result)})
    .catch((error)=>res.send(error));
}
);

app.delete("/delete/:id",

(req ,res)=>{
    let client = new MongoClient(url);

    client.connect();
    let db = client.db("tinder");
    let collec = db.collection("photos");

    let id=req.params.id;
    let _id=new ObjectId(id);
    // datatype must be same
    collec.findOne({_id})
    .then((obj)=>{
        cloudinary.uploader.destroy(obj.file_name);
        return collec.deleteOne({_id});
    })
    .then((result)=>res.send(result))
    .catch((error)=>res.send(error));
}
);
// promise 

// req.query.anything when ?is there
// req.body.anything  when ? is not there, in obj 

app.listen(3000,()=>{console.log("")})