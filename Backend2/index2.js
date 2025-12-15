let express = require("express");
let cors = require("cors");
let { MongoClient, ObjectId } = require("mongodb");
let multer = require("multer");
let path = require("path");
let fs = require("fs");
require('dotenv').config(); // Load environment variables

let app = express(); // ✅ Added missing app declaration

// 1. DYNAMIC CONFIGURATION
// Use the Environment variable from Render, or fallback to your string
const MONGO_URL = process.env.MONGO_URL || "mongodb+srv://sakshichavan61116_db_user:fVqjKMmy6Iz9tlCY@cluster0.ic5mpum.mongodb.net/InstaVibe?appName=Cluster0";
const PORT = process.env.PORT || 3000; // ✅ Render needs dynamic port

app.use(cors());
app.use(express.json());
// Serve the uploads folder publicly
app.use('/uploads', express.static('uploads')); 

// 2. DATABASE CONNECTION (Connect ONCE, not in every route)
let db;
let collec;

// Connect to DB immediately when server starts
(async function connectDB() {
    try {
        let client = new MongoClient(MONGO_URL);
        await client.connect();
        db = client.db("InstaVibe"); // ✅ Changed "tinder" to "InstaVibe" to match your URL
        collec = db.collection("photos");
        console.log("✅ Connected to MongoDB (InstaVibe)");
    } catch (err) {
        console.error("❌ DB Connection Error:", err);
    }
})();

// 3. MULTER SETUP
// Ensure 'uploads' folder exists to prevent crashes
if (!fs.existsSync('uploads')){
    fs.mkdirSync('uploads');
}

let storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
let recep = multer({ storage });

// 4. ROUTES

// ➤ UPLOAD
app.post("/upload", recep.single("file"), async (req, res) => {
    try {
        // ✅ CRITICAL FIX: Generate the dynamic Cloud URL, not localhost
        // If hosted, it uses the server's domain. If local, it uses localhost.
        const protocol = req.protocol;
        const host = req.get('host'); 
        const fullUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

        let obj = {
            username: req.body.username,
            caption: req.body.caption,
            file_url: fullUrl, // ✅ Saves "https://instavibe.onrender.com/uploads/..."
            file_name: req.file.filename,
            upload_time: new Date()
        };

        const result = await collec.insertOne(obj);
        res.send(result);
    } catch (error) {
        console.error("Upload Error:", error);
        res.status(500).send(error.message);
    }
});

// ➤ GET FILES
app.get("/files", async (req, res) => {
    try {
        let username = req.query.username;
        let query = username ? { username } : {};

        // Sort by newest first (-1)
        const result = await collec.find(query).sort({ upload_time: -1 }).toArray();
        res.send(result);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// ➤ DELETE FILE
app.delete("/delete/:id", async (req, res) => {
    try {
        let id = req.params.id;
        let _id = new ObjectId(id);

        const obj = await collec.findOne({ _id });
        
        if (obj) {
            // Try to delete file from folder (Optional catch if file missing)
            const filePath = `uploads/${obj.file_name}`;
            if (fs.existsSync(filePath)) {
                await fs.promises.unlink(filePath);
            }
            
            const result = await collec.deleteOne({ _id });
            res.send(result);
        } else {
            res.status(404).send("Post not found");
        }
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// 5. START SERVER
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});