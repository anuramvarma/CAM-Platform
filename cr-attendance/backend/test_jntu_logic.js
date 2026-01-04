// Advanced Generator for JNTU formats (e.g., 23PA1A05C8 -> 23PA1A05I9)
const generateJNTURolls = (start, end) => {
    start = start.trim();
    end = end.trim();

    const commonPrefixLength = (s1, s2) => {
        let i = 0;
        while (i < s1.length && i < s2.length && s1[i] === s2[i]) i++;
        return i;
    };

    const len = commonPrefixLength(start, end);
    const commonPrefix = start.substring(0, len);

    const startSuffix = start.substring(len);
    const endSuffix = end.substring(len);

    console.log(`Prefix: ${commonPrefix}`);
    console.log(`Suffixes: ${startSuffix} -> ${endSuffix}`);

    // Check for [Char][Digit] pattern
    // e.g. C8 -> I9
    const alphanumericRegex = /^([A-Z])(\d)$/;

    const startMatch = startSuffix.match(alphanumericRegex);
    const endMatch = endSuffix.match(alphanumericRegex);

    if (startMatch && endMatch) {
        const rolls = [];

        const startChar = startMatch[1].charCodeAt(0);
        const endChar = endMatch[1].charCodeAt(0);

        const startDigit = parseInt(startMatch[2]);
        const endDigit = parseInt(endMatch[2]);

        for (let charCode = startChar; charCode <= endChar; charCode++) {
            const currentChar = String.fromCharCode(charCode);

            // Determine digit range for this character
            let sDigit = 0;
            let eDigit = 9;

            if (charCode === startChar) sDigit = startDigit;
            if (charCode === endChar) eDigit = endDigit;

            for (let d = sDigit; d <= eDigit; d++) {
                rolls.push(commonPrefix + currentChar + d);
            }
        }
        return rolls;
    }

    // Fallback to original numeric logic if it's just numbers
    // ...
    return [];
};

const res = generateJNTURolls('23PA1A05C8', '23PA1A05I9');
console.log(res.join(', '));
console.log(`Total: ${res.length}`);
