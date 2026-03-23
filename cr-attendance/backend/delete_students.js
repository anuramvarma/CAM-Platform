const mongoose = require('mongoose');
const Student = require('./models/Student');

//const MONGO_URI = 'mongodb+srv:Anura=true&w=majority';

async function run() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB');

        const result = await Student.deleteMany({
            classId: new mongoose.Types.ObjectId("695f6913220b811467e92562")
        });

        console.log(`Students deleted successfully. Count: ${result.deletedCount}`);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from DB');
    }
}

run();
