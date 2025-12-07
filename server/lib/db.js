import mongoose from "mongoose";

// Function to connect to MongoDB
export const connectDB = async () => {
    try {
        mongoose.connection.on('connected', () => {
            console.log('Mongoose connected to DB');
            try {
                console.log('DB name:', mongoose.connection.name);
                console.log('DB host(s):', mongoose.connection.host);
            } catch (e) {
                // ignore
            }
        });

        // Connect using the URI. Modern mongoose / mongodb drivers enable
        // the required behavior by default, so no extra options are necessary.
        await mongoose.connect(process.env.MONGODB_URI);
    } catch (error) {
        console.error("MongoDB connection error:", error);
        process.exit(1); // Exit process with failure
    }

}