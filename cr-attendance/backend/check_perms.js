const mongoose = require('mongoose');
const Permission = require('./models/Permission');
const Class = require('./models/Class');

const MONGO_URI = 'mongodb+srv://anuramvarma233_db_user:Anuram123456@cluster0.gv5jvjy.mongodb.net/cr_attendance_v1?retryWrites=true&w=majority';

async function run() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB');

        const todayUTC = new Date().toISOString().split('T')[0];
        console.log('Today:', todayUTC);

        const classes = await Class.find();

        for (const cls of classes) {
            const name = `${cls.yearOfStudy}-${cls.dept}-${cls.section}`;
            if (name === '3-CSE-C') {
                console.log(`\n=== CLASS ${name} (${cls._id}) ===`);

                const perms = await Permission.find({ classId: cls._id });
                console.log(`Total Permissions in DB: ${perms.length}`);

                if (perms.length > 0) {
                    perms.forEach(p => {
                        const matches = p.startDate <= todayUTC && p.endDate >= todayUTC;
                        console.log(` > Perm: ${p.startDate} to ${p.endDate} | Active? ${matches}`);
                    });
                }

                const count = await Permission.countDocuments({
                    classId: cls._id,
                    startDate: { $lte: todayUTC },
                    endDate: { $gte: todayUTC }
                });
                console.log(`> COUNT QUERY RESULT: ${count}`);
                console.log('============================\n');
            }
        }

    } catch (e) { console.error(e); }
    finally { await mongoose.disconnect(); }
}

run();
