// bankroll.js

const math = require('mathjs');

const MSStudOutcomes = {"-10": 2.36763636e-04, "-8": 5.49741818e-03, "-6": 3.01273636e-02, "-5": 3.46909091e-05, "-4": 1.90693036e-01, "-3": 7.42218727e-02, "-2": 8.60724909e-02, "-1": 3.77424636e-01, 0: 8.87380000e-02, 4: 2.51216545e-02, 6: 2.91422182e-02, 8: 2.71235091e-02, 10: 1.57834727e-02, 12: 1.07456909e-02, 16: 1.17086727e-02, 18: 3.51765455e-03, 20: 8.80127273e-03, 24: 5.65620000e-03, 30: 6.43245455e-03, 36: 1.10114545e-03, 40: 1.28309091e-04, 48: 1.93363636e-04, 50: 2.28909091e-05, 60: 1.18418182e-04, 80: 5.94636364e-04, 100: 5.36218182e-04, 240: 2.36363636e-06, 320: 7.20181818e-05, 400: 1.40709091e-04, 600: 4.10909091e-06, 800: 4.12727273e-06, 1000: 1.09090909e-06, 4000: 8.72727273e-07, 5000: 6.54545455e-07};

function createStateXion(outcomes, buyIn) {
    let n = 2*buyIn;    // state-space: 0 (bust-out) to 2*buyIn-1 (double-up)
    let m = math.zeros(n,n);    // m(i,j) = Pr(state-i <- state-j)
    m.set([0,0], 1);    // no exit from bust-out state
    m.set([n-1,n-1], 1);    // no exit from double-up state
    for (let i=0; i<n; i++) {   // for each destination state
        for (let j=1; j<(n-1); j++) {   // from each originating state
            let d = (i - j);
            if (d in outcomes) m.set([i,j], outcomes[d]);
        }
    }
    // all transitions from active states [1,n-1) that undershoot bust-out state
    for (let j=1; j<(n-1); j++) {
        for (let outcome in outcomes) {
            if ((j + outcome) < 0) {
                m.set([0,j], m.get([0,j]) + outcomes[outcome]);
            }
        }
    }
    // all transitions that overshoot double-up state
    for (let j=1; j<(n-1); j++) {
        for (let outcome in outcomes) {
            if ((j + outcome) > (n-1)) {
                m.set([n-1,j], m.get([n-1,j]) + outcomes[outcome]);
            }
        }
    }
    return m;
}

function checksumXionColumns(m) {
    let n = m.size()[0];
    let checksum = math.zeros(n);
    for (let j=0; j<n; j++) {
        for (let i=0; i<n; i++) {
            checksum.set([j], checksum.get([j]) + m.get([i,j]));
        }
    }
    return checksum;
}

let m = createStateXion(MSStudOutcomes, 25);
let c = checksumXionColumns(m);
