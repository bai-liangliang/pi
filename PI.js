const MongoClient = require('mongodb').MongoClient;
require('dotenv').config();

let client;
let scores;
let isConnected = false;
async function main() {
    const uri = process.env.MONGODB_URI;

    client = new MongoClient(uri, { useNewUrlParser: true, 
                                          useUnifiedTopology: true });

    try {
        await client.connect();
        console.log("\nConnected to MongoDB Atlas\n\n");
        isConnected = true;
        const db = client.db("piTypingGame");
        scores = db.collection("scores");
        setTimeout(() => {
            welcomeMessage();
        }, 340);
    } catch (err) {
        console.error("Error connecting to MongoDB Atlas:", err);
        welcomeMessage();
    }
}
main().catch(console.error);



const PI = "3.14159265358979323846264338327950288419716939937510" +
         "582097494459230781640628620899862803482534211706798";
var gameMode = 15;
var auto = true;

function selectGame(input){
    if (input == "15"){
        gameMode = 15;
    } else if (input == "25"){
        gameMode = 25;
    } else if (input == "50"){
        gameMode = 50;
    } 
    else if (input == "auto"){
        auto = !auto;
        if (auto){
            console.log(`Automatically reset after ${gameMode} digits on.\n`);
        } else {
            console.log(`Automatically reset after ${gameMode} digits off.\n`);
        }
        return;
    }
    else if (input == "high"){
        highscores(false);
        return;
    }
    else if (input == "recent high"){
        highscores(true);
        return;
    }
    else {
        return;
    }
    console.log(`You are playing ${gameMode} digits.`);
}

function welcomeMessage(){
    var s1 = "Welcome! "
    var s2 = `The current gamemode is typing ${gameMode} decimals of pi. `;
    var s3 = "You may type 15, 25, or 50 at any point to change the game mode";
    console.log(s1 + s2 + "\n" + s3 + "\n");
}
const clearLastLines = (count) => {
  process.stdout.moveCursor(0, -count)
  process.stdout.clearScreenDown()
}
function update(n){
    clearLastLines(1);
    console.log(n);
}
// parent process? 
var stdin = process.stdin;
stdin.setRawMode( true );
stdin.resume();
stdin.setEncoding( 'utf8' );


let LOW15 = NaN; 
let startTime = NaN
var typed = "";

// on any data into stdin
stdin.on( 'data', function( key ){
    if ( key === '\u0003' ) {
        process.exit();
    }
    //enter
    else if (key === '\u000d'){
        selectGame(typed);
        typed = "";
        startTime = NaN;
        console.log("");
    }
    //delete
    else if (key === '\u007f' && typed.length){
       typed = typed.substring(0, typed.length -1); 
       update(typed);
       if (typed === ""){
            startTime = NaN;
       }
    }
    // start timer if 3
    if (key === '3' && isNaN(startTime) && typed ===""){
        let lastKeystrokeTime = Date.now();
        startTime = lastKeystrokeTime;
    }
    else if (key === 'a' && isNaN(startTime) && typed ===""){
        let lastKeystrokeTime = Date.now();
        startTime = lastKeystrokeTime;
    }
    // type no matter what
    if (key <= '\u007e' && key >= '\u0020'){
        typed+= key;
        update(typed);
    }
    // check
    if (typed.length >= gameMode + 2 && !isNaN(startTime)){
        var time = Date.now() - startTime;
        var now = new Date();
        if (check(typed, gameMode)){
            console.log(`You finished in ${time/1000}s \n`);
            if (isConnected){
                const result = {
                    mode: gameMode,
                    timeTakenMs: time,
                    timestamp: time + startTime,
                    date: now.toDateString().substring(4),
                    time: now.toTimeString().substring(0, 8),
                }; 
                insertScore(result);
            }
            typed = "";
            startTime = NaN;
        } else if (auto){
            console.log(`(Almost a ${time/1000}s finish) \n`);
            typed = "";
            startTime = NaN;
        }
    }
});

function check(input, mode){
    let i = 0;
    while (i < input.length){
        if (input[i]!= PI[i]){
            return false;
        }
        i++; 
    }
    if (i >= mode + 1){
        return true;
    }
    return false;
}

async function insertScore(res){
    try {
        const insertionResult = await scores.insertOne(res);
        console.log(`Score saved with ID: ` +
                    `${insertionResult.insertedId}`);
        findScore(insertionResult.insertedId, gameMode);
    } catch (err){
        console.log("Error inserting score:", err);
    }
}

async function findScore(id, m){
    try{
        const pipeline = [
          { $match: { mode: m } },
          {
            $addFields: {
              averagecpms: {
                $round: [
                  {
                    $divide: [
                      '$timeTakenMs',
                      { $add: ['$mode', 2] }
                    ]
                  },
                  2
                ]
              }
            }
          },
          { $sort: { averagecpms: 1 } },
          {
            $group: {
              _id: null,
              docs: { $push: '$$ROOT' }
            }
          },
          {
            $unwind: {
              path: '$docs',
              includeArrayIndex: 'rowNumber'
            }
          },
          {
            $project: {
              rowNumber: { $add: ['$rowNumber', 1] },
             // _id: {$toString: '$docs._id'},
              _id : '$docs._id',
             /* milliseconds: '$docs.timeTakenMs',
              averagecpm: '$docs.averagecpms',
              time: '$docs.time',
              date: '$docs.date'*/
            }
          }
        ];
        const aggregationResult = await scores.aggregate(pipeline, {
            maxTimeMS: 60000,
            allowDiskUse: true
        }).toArray();
        const matchingDocument = aggregationResult.filter((doc) =>
                                 doc._id.toString() === id.toString());
        if (matchingDocument && matchingDocument.length > 0) {
            console.log("Ranking:", matchingDocument[0].rowNumber, "\n");
            return;
        } else {
            console.log("No matching document found in the aggregation result.");
        }
    } catch (err) {
        console.log("Error", err);
    }
}
async function highscores(recent){
    var twodays = 2 * 24 * 60 * 60 * 1000;
    twodays = twodays/8;
    try{
        let pipeline = [];
        if (recent){
            pipeline.push({
                $match: {
                    timestamp: {
                        $gte: Date.now() - twodays
                    }
                }
            });
        }
        pipeline.push({ 
            
                  $project: {
                    timeTakenMs: 1,
                    mode: 1,
                    _id: 0
                  }
                },
                { $match: { mode: { $in: [15, 25, 50] } } },
                { $sort: { timeTakenMs: 1 } },
                {
                  $facet: {
                    mode_15: [
                      { $match: { mode: 15 } },
                      { $limit: 50 }
                    ],
                    mode_25: [
                      { $match: { mode: 25 } },
                      { $limit: 20 }
                    ],
                    mode_50: [
                      { $match: { mode: 50 } },
                      { $limit: 20 }
                    ]
                  }
                },
                {
                  $project: {
                    mode_15_scores: {
                      $map: {
                        input: '$mode_15',
                        as: 'item',
                        in: '$$item.timeTakenMs'
                      }
                    },
                    mode_25_scores: {
                      $map: {
                        input: '$mode_25',
                        as: 'item',
                        in: '$$item.timeTakenMs'
                      }
                    },
                    mode_50_scores: {
                      $map: {
                        input: '$mode_50',
                        as: 'item',
                        in: '$$item.timeTakenMs'
                      }
                    }
                  }
                }
          );
        let res = await scores.aggregate(pipeline, 
        { maxTimeMS: 60000, allowDiskUse: true }).toArray();
        console.log(res, "\n");
        }
    catch (err){
        console.log("error", err);
    }
}
