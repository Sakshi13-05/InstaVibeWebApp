let express = require("express");
let cors = require("cors");
let {MongoClient , ObjectId} = require("mongodb");

let multer = require("multer");
let path = require("path");
let fs = require("fs");
const { error } = require("console");
const url = "mongodb+srv://sakshichavan61116_db_user:fVqjKMmy6Iz9tlCY@cluster0.ic5mpum.mongodb.net/InstaVibe?appName=Cluster0";
app.use(cors());
app.use(express.json());
app.use('/uploads',express.static('uploads'));

let storage = multer.diskStorage(
    {
        destination : (req,file,cb)=>cb(null,"uploads/"),
        filename :(req,file,cb)=>cb(null,Date.now() + path.extname(file.originalname))
    }
);
let recep = multer({storage});
app.post("/upload",recep.single("file"),
(req ,res)=>{
    let client = new MongoClient(url);
    client.connect();
    let db = client.db("tinder");
    let collec = db.collection("photos");

    let obj ={
        username : req.body.username,
        caption : req.body.caption,
        file_url :`http://localhost:3000/uploads/${req.file.filename}`,
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
        fs.promises.unlink(`uploads/${obj.file_name}`)
        return collec.deleteOne({_id});
    })
    .then((result)=>res.send(result))
    .catch((error)=>res.send(error));
}
);
// promise 

// req.query.anything when ?is there
// req.body.anything  when ? is not there, in obj 

app.listen(3000,()=>{console.log("express running on 3000")});