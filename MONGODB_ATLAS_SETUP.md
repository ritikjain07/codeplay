# 🗃️ MongoDB Atlas Setup Guide

## 1. Create Account & Cluster
1. Go to: https://www.mongodb.com/cloud/atlas/register
2. Sign up with your email
3. Choose "Build a database" → "M0 Cluster" (FREE)
4. Choose cloud provider: AWS
5. Region: Choose closest to your location
6. Cluster Name: Keep default or name it "soen-cluster"

## 2. Configure Database Access
1. In Atlas dashboard, go to "Database Access" (left sidebar)
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Username: `admin` (or your choice)
5. Password: Generate secure password (save it!)
6. Database User Privileges: "Read and write to any database"
7. Click "Add User"

## 3. Configure Network Access
1. Go to "Network Access" (left sidebar)
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (0.0.0.0/0)
   - Note: For production, restrict to specific IPs
4. Click "Confirm"

## 4. Get Connection String
1. Go to "Database" (left sidebar)
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Driver: Node.js, Version: 5.5 or later
5. Copy the connection string - it looks like:
   ```
   mongodb+srv://admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

## 5. Update Your .env File
Replace the MONGODB_URI in your .env file with:
```
MONGODB_URI=mongodb+srv://admin:<password>@cluster0.xxxxx.mongodb.net/users?retryWrites=true&w=majority
```

⚠️ Replace:
- `<password>` with your actual password
- `cluster0.xxxxx` with your actual cluster URL
- Add `/users` at the end for the database name

## 6. Test Connection
Run: `npm run test-db` (we'll create this script)

---
💡 **Need help?** Follow along with the steps above, and let me know when you have your connection string!
