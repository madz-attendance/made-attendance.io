import { parseSwipe } from "./defs.mjs";
import readline from 'readline';

const rl =
    readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

function askQuestion(questionText) 
{
    return new Promise((resolve, reject) => 
    {
        rl.question(questionText, (answer) => 
            {resolve(answer);});
    });
}

async function main()
{
    let swipe;
    while(true)
    {
        swipe = await askQuestion('Welcome! Please swipe your ID or type "quit" to end this program\n');
        if(swipe.toLowerCase() === 'quit') 
        {
            rl.close();
            break;
        }
        else if(swipe.startsWith('%B'))
        {
            const {idNum, name} = parseSwipe(swipe)
            console.log(idNum, name, "\n")
        }
        else
            {console.log("Invalid ID swipe. Please try again\n")}
    }
}

main();
