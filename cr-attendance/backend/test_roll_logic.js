const generateRolls = (start, end) => {
    const rolls = [];
    if (!start || !end) return [];

    console.log(`Testing: ${start} -> ${end}`);

    // Trim whitespace
    start = start.trim();
    end = end.trim();

    // Regex to split: (Prefix)(Number)
    const regex = /^(.*?)(\d+)$/;

    const startMatch = start.match(regex);
    const endMatch = end.match(regex);

    if (!startMatch || !endMatch) {
        console.log(" -> No regex match (doesn't end in digits)");
        return [start, end];
    }

    if (startMatch[1] !== endMatch[1]) {
        console.log(` -> Mismatch prefixes: '${startMatch[1]}' vs '${endMatch[1]}'`);
        return [start, end];
    }

    const prefix = startMatch[1];
    const startNum = parseInt(startMatch[2], 10);
    const endNum = parseInt(endMatch[2], 10);
    const length = startMatch[2].length;

    console.log(` -> Prefix: '${prefix}', Start: ${startNum}, End: ${endNum}`);

    if (startNum > endNum) {
        console.log(" -> Start > End");
        return [];
    }

    // Safety limit
    if (endNum - startNum > 200) {
        console.log(" -> Range too large");
        return [];
    }

    for (let i = startNum; i <= endNum; i++) {
        const numStr = i.toString().padStart(length, '0');
        rolls.push(prefix + numStr);
    }

    return rolls;
};

// Test Cases
const cases = [
    ['23PA1A0501', '23PA1A0505'], // Standard
    [' 23PA1A0501 ', ' 23PA1A0505 '], // Whitespace
    ['23PA1A0501', '23PA1A0510'], // Crossing 09->10
    ['24PA5A0501', '24PA5A0512'], // Lateral
    ['23PA1A05A0', '23PA1A05A5'], // Hex-like/Alpha prefix? (If regex works)
    ['UserTypedHeader', 'UserTypedHeader'], // Single
    ['23PA1A0599', '23PA1A0501'], // Reversed
    ['ABC', 'XYZ'] // Totally different
];

cases.forEach(([s, e]) => {
    const res = generateRolls(s, e);
    console.log(`Result Count: ${res.length}`);
    console.log(res.join(', '));
    console.log('---');
});
