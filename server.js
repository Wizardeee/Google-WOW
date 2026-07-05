const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const admin = require('firebase-admin');

// 1. Initialize Express App
const app = express();
app.use(cors());
app.use(express.json()); // Essential for reading JSON from POST requests

// 2. Initialize Firebase Admin SDK
// Make sure your serviceAccountKey.json is in the same folder!
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// ==========================================
// ROUTE 1: Secure Login Verification (POST)
// ==========================================
app.post('/api/login', async (req, res) => {
    try {
        // Frontend ONLY sends username and password. No roles.
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ success: false, message: "Username and password are required." });
        }

        console.log(`[AUTH] Login attempt received for user: ${username}`);

        // Search the Firestore 'users' collection for the matching username
        const usersRef = db.collection('users');
        const snapshot = await usersRef.where('username', '==', username).get();

        if (snapshot.empty) {
            console.log(`[AUTH] Login failed: User '${username}' not found.`);
            return res.status(401).json({ success: false, message: "User not found." });
        }

        let verifiedUser = null;
        let isMatch = false;

        // Verify the password against the stored hash
        for (const doc of snapshot.docs) {
            const dbUser = doc.data();
            
            // Securely compare incoming text password with database hash string
            isMatch = await bcrypt.compare(password, dbUser.password);
            
            if (isMatch) {
                verifiedUser = {
                    username: dbUser.username,
                    role: dbUser.role // Role extracted securely on the backend
                };
                break;
            }
        }

        if (isMatch && verifiedUser) {
            console.log(`[AUTH] Login SUCCESS: '${username}' authenticated as role [${verifiedUser.role}].`);
            res.status(200).json({ success: true, user: verifiedUser });
        } else {
            console.log(`[AUTH] Login failed: Invalid password for user '${username}'.`);
            res.status(401).json({ success: false, message: "Wrong password." });
        }

    } catch (error) {
        console.error("[ERROR] Secure Login Failure:", error);
        res.status(500).json({ success: false, message: "Server error during authentication." });
    }
});

// ==========================================
// ROUTE 2: Fetch Raw Complaints Data (GET)
// ==========================================
app.get('/api/complaints', async (req, res) => {
    try {
        console.log("[DATA] Fetching complaints from Firestore...");
        const complaintsRef = db.collection('complaints');
        
        // Adjust the limit if you want to pull fewer rows during quick local tests
        const snapshot = await complaintsRef.limit(100).get(); 
        
        if (snapshot.empty) {
            return res.status(200).json([]);
        }

        const complaintsData = [];
        snapshot.forEach(doc => {
            complaintsData.push({ id: doc.id, ...doc.data() });
        });

        console.log(`[DATA] Successfully sent ${complaintsData.length} complaint records.`);
        res.status(200).json(complaintsData);

    } catch (error) {
        console.error("[ERROR] Failed to fetch complaints:", error);
        res.status(500).json({ error: "Failed to fetch data records." });
    }
});

// 3. Start Server Host
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`=================================================`);
    console.log(` CFIS Backend Engine Online at http://localhost:${PORT}`);
    console.log(` Time Check: Backend running strong at 02:30 AM!`);
    console.log(`=================================================`);
});