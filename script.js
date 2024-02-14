// script.js

class Card {
    static ranks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
    static suits = ['c', 'd', 'h', 's'];
    constructor(rank, suit) {
        this.rank = rank;
        this.suit = suit;
    }
    ordinalRank() {
        return Card.ranks.findIndex(r => r == this.rank);
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
    straightMask = 0;
    static handRanks = ["Nothing", "Low Pair", "Mid Pair", "High Pair", "Two Pairs", "Three-of-a-Kind",
                        "Straight", "Flush", "Full House", "Four-of-a-Kind", "Straight Flush", "Royal Flush"];
    static isLow(r) {
        return (r == '2') || (r == '3') || (r == '4') || (r == '5');
    }
    static isHigh(r) {
        return (r == 'A') || (r == 'K') || (r == 'Q') || (r == 'J');
    }
    isStraight() {
        for (let i=0; i<10; i++) {
            if (((this.straightMask>>i)&0x1f) == 0x1f) return true;
        }
        return false;
    }
    isStraightDraw() {
        for (let i=0; i<10; i++) {
            let masked = (this.straightMask>>i)&0x1f;
            let n=0;
            for (let j=0; j<5; j++) {
                n += (masked>>j)&1;
            }
            if (n == 4) return true;
        }
        return false;
    }
    isSuited() {
        if (this.length == 0) return false;
        for (let card of this) {
            if (card.suit != this[0].suit) return false;
        }
        return true;
    }
    setStraightMask() {
        this.straightMask = 0;
        for (let card of this) {
            this.straightMask |= (1<<card.ordinalRank());
        }
        this.straightMask = (this.straightMask<<1) | ((this.straightMask>>12)&1);  // wrap Ace around
    }
    eval() {
        this.setStraightMask();
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
        if (isFlush && this.isStraight()) {
            this.rank = ((this.rankCnt['A'] && this.rankCnt['K']) ? 'Royal Flush' : 'Straight Flush');
        } else if (quads) {
            this.rank = "Four-of-a-Kind";
        } else if (trips && pairs) {
            this.rank = "Full House";
        } else if (isFlush) {
            this.rank = "Flush";
        } else if (this.isStraight()) {
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
        let all = new Array(...player, ...community);
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
let gameOver = false;
let ev = [], evDealt=0;
let costs=0, expected=0;
let showHints=false;

function setStrategyHint(hand, outs) {
    let hint = "";
    let suited = hand.isSuited();
    if (MSStud.getPayout(hand) >= 0) {
        hint = "3x no can lose";
    } else if (hand.rank == "Low Pair") {
        hint = "low pair: 3x on 2nd/3rd St with all outs, fold on 2nd St if double-copied, else 1x";
    } else if (community.length == 0) {
        if (suited) {
            switch(outs["high"]) {
                case 6: hint = "3x 6 high suited outs"; break;
                case 5: hint = "3x 5 high suited outs w/ SF possibility, else 1x"; break;
                case 4: hint = "1x 3 high outs or better"; break;
                case 3: switch(outs["mid"]) {
                    case 3: hint = "3x suited uncopied high and mid if possible SF"; break;
                    case 2: hint = "1x 3 high outs or better"; break;
                    case 1: case 0: hint = "1x 3 high outs or better"; break;
                }
                case 2:
                    if (outs["mid"]) hint = "1x suited 2 high with any mid outs";
                    else if (outs["low"] == 3) hint = "1x suited 2 high and 3 low outs";
                    else hint = "Only 1x suited 2/0/- with possible SF, or reaches AND 12+ pay cards left";
                    break;
                case 1:
                    if (outs["mid"] == 3) hint = "1x suited 1 high and 3 mid outs";
                    else if (outs["mid"] == 2) hint = "Only 1x suited 1/2/- with possible SF, or reaches AND 12+ pay cards left";
                    else hint = "fold suited 1 suited high out without at least 2 mid outs";
                    break;
                case 0: switch (outs["mid"]) {
                    case 6: case 5: case 4:
                        hint = "1x suited with at least 4 mid outs"; break;
                    case 3:
                        if (outs["low"] == 3) hint = "1x suited mid and low with no copies";
                        else if (outs["low"] == 2) hint = "Only 1x suited 3 mid and 2 low outs if no-gap OR possible SF";
                        else hint = "Only 1x suited 3 mid outs if possible SF";
                        break;
                    default: hint = "Fold suited with < 2 mid outs"; break;
                }
            }
        } else {
            // offsuit
            switch (outs["high"]) {
                case 6: hint = "3x 6 high outs -> never fold"; break;
                case 5: case 4: case 3: hint = "1x any 3 high outs"; break;
                case 2: switch (outs["mid"]) {
                    case 3: case 2: hint = "1x 2 high and 2 mid outs or better"; break;
                    case 1: hint = "Only 1x 2 high and 1 mid out IF reaches"; break;
                    case 0:
                        if (outs["low"] == 3) hint = "Only 1x 2 high and 3 low outs if 12+ pay cards left, etc.";
                        else hint = "Fold 2 high and 2 low outs or worse";
                        break;
                }
                case 1:
                    if (outs["mid"] == 3) hint = "Only 1x 1 high and 3 mid outs IF reaches";
                    else hint = "Fold 1 high and 2 or less mid outs";
                    break;
                case 0: switch (outs["mid"]) {
                    case 6: case 5: hint = "1x 5 or 6 mids outs"; break;
                    case 4: hint = "Fold 4 mid outs"; break;
                    case 3:
                        if (outs["low"] == 3) hint = "Only 1x 3 mid and 3 low outs IF reaches";
                        else hint = "Fold 3 mid and copied low";
                        break;
                    case 2: case 1: hint = "Must fold with just 2 mid outs"; break;
                    case 0: hint = "Must fold with only low outs"; break;
                }
            }
        }
    } else if (community.length == 1) {
        if (suited) {

        } else {
            if (outs["high"] >= 4) hint = "1x any 4 high outs or better";
            else if ((outs["high"] == 3) && (outs["mid"] >= 2)) hint = "1x 3 high and 2 mid outs or better";
            else if ((outs["high"] == 3) && (outs["low"] >= 5)) hint = "1x 3 high and 5 low outs or better";
            else if (outs["high"] == 3) hint = "1x 3 high and <2 mid outs IF reaches";
            else if ((outs["high"] == 2) && (outs["low"] >= 4)) hint = "1x 2 high and 4 mid outs or better";
            else if ((outs["high"] == 2) && (outs["mid"] == 3)) switch (outs["low"]) {
                case 3: case 2: hint = "1x 2/3/2 or better"; break;
                case 1: hint = "Only 1x 2/3/1 if 12+ pay cards left"; break;
                case 0: hint = "Only 1x 2/3/0 IF reaches"; break;
            } else if ((outs["high"] == 2) && (outs["mid"] >= 1)) hint = "Only 1x 2 high and 1 mid out IF reaches";
            else if (outs["high"] == 1) switch (outs["mid"]) {

            } else if (outs["high"] == 0) switch (outs["mid"]) {
                case 9: case 8: case 7: hint = "1x 7 or more mid outs"; break;
                case 6:
                    if (outs["low"] == 3) hint = "1x all 6 mid and 3 low outs";
                    else hint = "Only 1x 6 mid outs IF reaches";
                    break;
                case 5: switch (outs["low"]) {
                    case 3: case 2: hint = "Only 1x 5 mid and 2+ low outs IF reaches"; break;
                    case 1: case 0: hint = "Only 1x 5 mid and <2 low outs if no-gap or one-gap"; break;
                }
                default:
                    hint = "Fold unless no-gap and any mid outs or all 9 low outs, or one-gap with 3+ mid outs";
                    break;
            }
        }
    } else if (community.length == 2) {
        if (suited) {

        } else {
            if (outs["high"] >= 5) hint = "1x with 5 high outs or better";
            else if (outs["high"] == 4) hint = "1x with 4 high and 2 mid outs or better";
            else if (outs["high"] == 3) hint = "1x with 3 high and 4 mid outs or better";
            else if (outs["high"] == 2) hint = "1x with 2 high and 6 mid outs or better";
            else if (outs["high"] == 1) hint = "1x with 1 high and 8 mid outs or better";
            else if (outs["high"] == 0) hint = "1x with 10 mid outs or better";
        }
    }
    document.getElementById('strategy').textContent = hint;
}

function displayEVHints() {
    button3x.title = (showHints ? `EV: ${ev[3] >= 0 ? "+" : ""}${ev[3].toFixed(4)}` : "");
    button1x.title = (showHints ? `EV: ${ev[1] >= 0 ? "+" : ""}${ev[1].toFixed(4)}` : "");
    foldButton.title = `EV: ${ev[0].toFixed(0)}`;
}

function updateHints() {
    let hand = new Hand(...player, ...community);
    hand.eval();
    outs = MSStud.countOuts(player, community, remaining);
    ev[3] = MSStud.calcEV(3, player, community, remaining, wagered);
    ev[1] = MSStud.calcEV(1, player, community, remaining, wagered);
    ev[0] = MSStud.calcEV(0, player, community, remaining, wagered);
    if (community.length == 0) evDealt = Math.max(ev[3], ev[1], ev[0]);
    displayEVHints();
    setStrategyHint(hand, outs);
    if (hand.rank == "Nothing") {
        document.getElementById('outs').textContent = `${outs["high"]}/${outs["mid"]}/${outs["low"]}`;
    } else {
        document.getElementById('outs').textContent = ``;

    }
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
    let combined = [...player, ...community];
    displayCards('playerCards', combined);
    if (community.length <= 2) updateHints();
    displayWagered();
    if (community.length == 3) resolveWagers();
}

function displayWagered() {
    message.innerHTML = `this hand: ${wagered} units, total: ${net > 0 ? "+" : ""}${net};  theoretical: ${expected > 0 ? "+" : ""}${expected.toFixed(1)} <span style="color: red;">(${costs.toFixed(2)})</span>`;
}

function resolveWagers() {
    gameOver = true;
    dimButtons();
    hand = new Hand(...player, ...community);
    hand.eval();
    outcome = wagered*MSStud.getPayout(hand);
    net += outcome;
    expected += evDealt;
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

document.getElementById('toggleCheckbox').addEventListener('change', function() {
    showHints = this.checked;
    document.getElementById('strategy').style.display = (this.checked ? 'block' : 'none');
    displayEVHints();
});
