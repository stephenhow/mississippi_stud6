// script.js

class Card {
    static ranks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
    static suits = ['c', 'd', 'h', 's'];
    constructor(rank, suit) {
        this.rank = rank;
        this.suit = suit;
    }
    ordinalRank() {
        return ranks.findIndex(r => r == this.rank);
    }
    isHigher(other) {
        return (this.ordinalRank() > other.ordinalRank());
    }
    isLower(other) {
        return (this.ordinalRank() < other.ordinalRank());
    }
    isIdentical(other) {
        return (this.rank == other.rank) && (this.suit == other.suit);
    }
}

class Deck extends Array {
    constructor() {
        super();
        for (let rank of Card.ranks) {
            for (let suit of Card.suits) {
                this.push(new Card(rank, suit));
            }
        }
    }
}

class Hand extends Array {
    constructor(...elements) {
        super(...elements);
    }
    rankCnt = {};
    suitCnt = {};
    static handRanks = ["Nothing", "Low Pair", "Mid Pair", "High Pair", "Two Pairs", "Three-of-a-Kind",
                        "Straight", "Flush", "Full House", "Four-of-a-Kind", "Straight Flush", "Royal Flush"];
    static isLow(r) {
        return (r == '2') || (r == '3') || (r == '4') || (r == '5');
    }
    static isHigh(r) {
        return (r == 'A') || (r == 'K') || (r == 'Q') || (r == 'J');
    }
    isStraight(rcnt) {
        if (rcnt['A'] && rcnt['K'] && rcnt['Q'] && rcnt['J'] && rcnt['T']) return true;
        else if (rcnt['K'] && rcnt['Q'] && rcnt['J'] && rcnt['T'] && rcnt['9']) return true;
        else if (rcnt['Q'] && rcnt['J'] && rcnt['T'] && rcnt['9'] && rcnt['8']) return true;
        else if (rcnt['J'] && rcnt['T'] && rcnt['9'] && rcnt['8'] && rcnt['7']) return true;
        else if (rcnt['T'] && rcnt['9'] && rcnt['8'] && rcnt['7'] && rcnt['6']) return true;
        else if (rcnt['9'] && rcnt['8'] && rcnt['7'] && rcnt['6'] && rcnt['5']) return true;
        else if (rcnt['8'] && rcnt['7'] && rcnt['6'] && rcnt['5'] && rcnt['4']) return true;
        else if (rcnt['7'] && rcnt['6'] && rcnt['5'] && rcnt['4'] && rcnt['3']) return true;
        else if (rcnt['6'] && rcnt['5'] && rcnt['4'] && rcnt['3'] && rcnt['2']) return true;
        else if (rcnt['5'] && rcnt['4'] && rcnt['3'] && rcnt['2'] && rcnt['A']) return true;
        else return false;
    }
    eval() {
        this.rank = "Nothing";
        this.rankCnt = {};
        for (let rank of Card.ranks) {
            this.rankCnt[rank] = 0;
        }
        this.suitCnt = {};
        for (let suit of Card.suits) {
            this.suitCnt[suit] = 0;
        }
        let isFlush=false;
        for (let card of this) {
            this.rankCnt[card.rank]++;
            this.suitCnt[card.suit]++;
            if (this.suitCnt[card.suit] == 5) isFlush=true;
        }
        let pairs=0, trips=0, quads=0;
        for (let r of Card.ranks) {
            if (this.rankCnt[r] == 2) {
                pairs++;
                if (Hand.isLow(r)) this.rank = "Low Pair";
                else if (Hand.isHigh(r)) this.rank = "High Pair";
                else this.rank = "Mid Pair";
            } else if (this.rankCnt[r] == 3) {
                trips++;
            } else if (this.rankCnt[r] == 4) {
                quads++;
            }
        }
        if (isFlush && this.isStraight(this.rankCnt)) {
            this.rank = ((this.rankCnt['A'] && this.rankCnt['K']) ? 'Royal Flush' : 'Straight Flush');
        } else if (quads) {
            this.rank = "Four-of-a-Kind";
        } else if (trips && pairs) {
            this.rank = "Full House";
        } else if (isFlush) {
            this.rank = "Flush";
        } else if (this.isStraight(this.rankCnt)) {
            this.rank = "Straight";
        } else if (trips) {
            this.rank = "Three-of-a-Kind";
        } else if (pairs >= 2) {
            this.rank = "Two Pairs";
        }
        return this.rank;
    }

}

class MSStud {
    static calcEV(play, hole, community, unseen, wagered) {
        if (play == 0) return -1*wagered;
        let ev=0;
        let draws=0;
        if (community.length == 2) {
            // 5th St (resolve hand)
            let player = new Hand();
            player.push(...hole);
            player.push(...community);
            for (let river of unseen) {
                if (!river.isIdentical(community[0]) && !river.isIdentical(community[1])) {
                    draws++;
                    player.push(river);
                    player.eval();
                    ev += (play+wagered)*MSStud.getPayout(player);
                    player.pop();
                }
            }
            ev /= draws;
        } else {
            let ev0x = -1*(play+wagered);
            for (let card of unseen) {
                if ((community.length == 0) || !card.isIdentical(community[0])) {
                    draws++;
                    community.push(card);
                    let ev3x = MSStud.calcEV(3, hole, community, unseen, play+wagered);
                    let ev1x = MSStud.calcEV(1, hole, community, unseen, play+wagered);
                    ev += Math.max(ev0x, ev1x, ev3x);
                    community.pop();
                }
            }
            ev /= draws;
        }
        return ev;
    }

    static countOuts(player, community, unseen) {
        let outs = {low: 0, mid: 0, high: 0};
        let remaining = new Hand(...unseen);
        remaining.eval();
        let all = new Hand(...player, ...community);
        all.eval();
        if (all.rank == 'Nothing') {
            for (let c of all) {
                let n = remaining.rankCnt[c.rank];
                if (Hand.isHigh(c.rank)) {
                    outs["high"] += n;
                } else if (Hand.isLow(c.rank)) {
                    outs["low"] += n;
                } else {
                    outs["mid"] += n;
                }
            }
        } else {
            outs["high"] = "-";
            outs["mid"] = "-";
            outs["low"] = "-";
        }
        return outs;
    }

    static getPayout(hand) {
        switch (hand.rank) {
            case 'Royal Flush': return 500;
            case 'Straight Flush': return 100;
            case 'Four-of-a-Kind': return 40;
            case 'Full House': return 10;
            case 'Flush': return 6;
            case 'Straight': return 5;
            case 'Three-of-a-Kind': return 3;
            case 'Two Pairs': return 2;
            case 'High Pair': return 1;
            case 'Mid Pair': return 0;
            case 'Low Pair': return -1;
            case 'Nothing': return -1;
            default: return -1;
        }
    }
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    // Generate a random index from 0 to i
    const j = Math.floor(Math.random() * (i + 1));
    // Swap elements at indices i and j
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function displayCards(id, cards) {
    const container = document.getElementById(id);
    container.innerHTML = ''; // Clear previous cards
    for (let card of cards) {
        const cardElement = document.createElement('div');
        cardElement.classList.add('card');
        // Here you'd set the background to the card image
        // For example, assuming you have images named "{value}_of_{suit}.png":
        cardElement.style.backgroundImage = `url('IndividualColorCards/PNG/${card.rank}${card.suit}.png')`;
        container.appendChild(cardElement);
    }
}

let deck = new Deck();
let player = [];
let community = [];
let others = [];
let remaining = [];
let wagered = 1;
let net = 0;
let button3x = document.getElementById('play3x');
let button1x = document.getElementById('play1x');
let foldButton = document.getElementById('fold');
let message = document.getElementById('message');
let totalCost = document.getElementById('costs');
let hint = document.getElementById('hint');
let gameOver = false;
let ev = [];
let costs=0;

function updateHints() {
    outs = MSStud.countOuts(player, community, remaining);
    ev[3] = MSStud.calcEV(3, player, community, remaining, wagered);
    ev[1] = MSStud.calcEV(1, player, community, remaining, wagered);
    ev[0] = MSStud.calcEV(0, player, community, remaining, wagered);
    button3x.title = `EV: ${ev[3] >= 0 ? "+" : ""}${ev[3].toFixed(4)}`;
    let foldMessage="";
    button1x.title = `EV: ${ev[1] >= 0 ? "+" : ""}${ev[1].toFixed(4)} ${foldMessage}`;
    foldButton.title = `EV: ${ev[0].toFixed(0)}`;
    hint.textContent = `${outs["high"]}/${outs["mid"]}/${outs["low"]}`;
}

function updateErrors(cost) {
    costs += cost;
    displayWagered();
}

function drawCard(play) {
    wagered += play;
    let cost = (ev[play] - Math.max(ev[3], ev[1], ev[0]));
    if (cost != 0) updateErrors(cost);
    community.push(remaining.pop());
    let combined = [];
    combined.push(...player);
    combined.push(...community);
    displayCards('playerCards', combined);
    if (community.length <= 2) updateHints();
    displayWagered();
    if (community.length == 3) resolveWagers();
}

function displayWagered() {
    message.innerHTML = `this hand: ${wagered} units, total: ${net > 0 ? "+" : ""}${net} <span style="color: red;">(${costs.toFixed(4)})</span>`;
}

function resolveWagers() {
    gameOver = true;
    dimButtons();
    hand = new Hand();
    hand.push(...player);
    hand.push(...community);
    hand.eval();
    outcome = wagered*MSStud.getPayout(hand);
    net += outcome;
    message.textContent = `${hand.length == 5 ? hand.rank : "FOLD"}, outcome: ${outcome > 0 ? "+" : ""}${outcome}, net: ${net}`;
}

function dimButtons() {
    button3x.classList.add("grayed-out");
    button1x.classList.add("grayed-out");
    foldButton.classList.add("grayed-out");
}

function undimButtons() {
    button3x.classList.remove("grayed-out");
    button1x.classList.remove("grayed-out");
    foldButton.classList.remove("grayed-out");
}

function shuffleAndDeal() {
    gameOver = false;
    shuffleArray(deck); // Shuffle again before dealing
    message.textContent = "";
    others = deck.slice(0, 10);
    player = deck.slice(10, 12);
    remaining = deck.slice(12, 52);
    community = [];
    wagered = 1;
    undimButtons();
    displayCards('otherCards', others);
    displayCards('playerCards', player);
    updateHints();
    displayWagered();
}

function toggleMenu() {
    var content = document.querySelector('.content');
    var toggle = document.querySelector('.toggle');
    if (content.style.display === "none") {
        content.style.display = "block";
        toggle.innerHTML = 'v'; // Change to down arrow when expanded
    } else {
        content.style.display = "none";
        toggle.innerHTML = '>'; // Change to right arrow when collapsed
    }
}

document.getElementById('shuffle').addEventListener('click', function() {
    shuffleAndDeal();
});

button3x.addEventListener('click', function() {
    if (gameOver) {
        shuffleAndDeal();
    } else {
        drawCard(3);
    }
});

button1x.addEventListener('click', function() {
    if (gameOver) {
        shuffleAndDeal();
    } else {
        drawCard(1);
    }
});

foldButton.addEventListener('click', function() {
    if (gameOver) {
        shuffleAndDeal();
    } else {
        let cost = (ev[0] - Math.max(ev[3], ev[1], ev[0]));
        if (cost != 0) updateErrors(cost);
        resolveWagers();
    }
});
