const crypto = require('crypto');
const readline = require('readline');

class MainGame {
    constructor(moves, hmac) {
        this.moves = moves;
        this.hmac = hmac;
    }

    computerMove() {
        const randomIndex = Math.floor(Math.random() * this.moves.length);
        return this.moves[randomIndex];
    }

    printHelp() {
        console.log('Available moves:');
        this.moves.forEach((move, i) => {
            console.log(`${i + 1} - ${move}`);
        });
        console.log('0 - exit');
        console.log('? - help');
    }

    play(userMove) {
        const computerMove = this.computerMove();
        const result = this.checkWin(userMove, computerMove)
        console.log(`Your move: ${userMove}`);
        console.log(`Computer move: ${computerMove}`);
        result === 'draw'?console.log('It\'s a draw!'):console.log(`You ${result}!`)
        console.log('HMAC key:', this.hmac.key);
    }

    checkWin(move1, move2) {
        const index1 = this.moves.indexOf(move1);
        const index2 = this.moves.indexOf(move2);
        const length = this.moves.length;
        return  index1===index2?'draw':(index2 - index1 + length) % length <= Math.floor(length / 2)?'win':'lose'
    }
}

class HMAC {
    constructor(key) {
        this.key = key;
    }

    calculate(message) {
        const hmac = crypto.createHmac('sha256', this.key);
        hmac.update(message);
        return hmac.digest('hex');
    }
}

class HelpTable extends MainGame{
    constructor(moves) {
        super()
        this.moves = moves;
    }

    generateTable() {
        const table = [['Moves', ...this.moves]];
        this.moves.forEach((move1) => {
            const row = [move1];
            this.moves.forEach((move2) => {
                const result = this.checkWin(move1, move2);
                row.push(result);
            });
            table.push(row);
        });
        return table;
    }

    renderTable() {
        const table = this.generateTable();
        console.log('Win/Lose/Draw Table:');
        console.log(this.formatTable(table));
    }

    formatTable(table) {
        const columnWidths = table[0].map((_, columnIndex) =>
            table.reduce((maxLength, row) =>
                Math.max(maxLength, String(row[columnIndex]).length), 0));

        return table.map(row =>
            row.map((cell, columnIndex) =>
                String(cell).padEnd(columnWidths[columnIndex], ' '))
                .join(' '))
            .join(' \n');
    }
}

class Game {
    constructor(moves) {
        this.moves = moves;
        this.hmac = new HMAC(crypto.randomBytes(32).toString('hex'));
        this.rules = new HelpTable(this.moves);
        this.game = new MainGame(this.moves, this.hmac);
    }

    start() {
        console.log('Welcome to the Rock-Paper-Scissors game!');
        console.log('Type "?" for help.');

        const hmac = this.hmac.calculate(this.game.computerMove());

        console.log('HMAC:', hmac);
        this.game.printHelp();

        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        rl.question('Enter your move: ', (input) => {
            const moveIndex = Number(input) - 1;
            const isValidMove = moveIndex >= 0 && moveIndex < this.game.moves.length;

            input ==='0'?rl.close():input==='?'?
                this.rules.renderTable()
            : isValidMove
                ? (this.game.play(this.game.moves[moveIndex]))
                : console.log('Invalid move. Try again.');

        });

        rl.on('close', () => {
            console.log('Goodbye!');
            process.exit(0);
        });
    }
}
const args = process.argv.slice(2);

if (args.length % 2 === 0 || args.length < 3) {
    console.log('Invalid arguments. Please provide an odd number of distinct strings.');
    console.log('Example: node game.js rock paper scissors');
} else {
    const moves = args.filter((move, index) => args.indexOf(move) === index);
    const rockPaperScissors = new Game(moves);
    rockPaperScissors.start();
}
