const PI = "3.14159265358979323846264338327950288419716939937510" +
         "582097494459230781640628620899862803482534211706798";
var gameMode = 15;
var auto = false;
welcomeMessage();

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
    // type no matter what
    if (key <= '\u007e' && key >= '\u0020'){
        typed+= key;
        update(typed);
    }
    // check
    if (typed.length >= gameMode + 2 && !isNaN(startTime)){
        var time = Date.now() - startTime;
        if (check(typed, gameMode)){
            console.log(`You finished in ${time/1000}s \n`);
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
