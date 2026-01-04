export const generateRollNumbers = (start: string, end: string): string[] => {
    if (!start || !end) return [];
    if (start === end) return [start];

    // Find common prefix length
    let prefixLen = 0;
    while (
        prefixLen < start.length &&
        prefixLen < end.length &&
        start[prefixLen] === end[prefixLen]
    ) {
        prefixLen++;
    }

    // If prefix is too short, safety fallback (shouldn't happen with valid inputs)
    if (prefixLen < start.length - 2) {
        // If only last 2 chars differ, prefixLen will be length-2.
        // If more differ, we might need a more complex logic, but usually only last 2 change for a batch.
        // Let's assume standard JNTU format where last 2 alphanumeric change.
    }

    const prefix = start.substring(0, start.length - 2);
    const startSuffix = start.substring(start.length - 2);
    const endSuffix = end.substring(end.length - 2);

    // Helper to convert suffix to value
    // 00-99 = 0-99
    // A0-A9 = 100-109
    // B0-B9 = 110-119
    // ...
    const parseSuffix = (s: string): number => {
        const tensChar = s[0];
        const unitsChar = s[1];

        let tens = 0;
        if (tensChar >= '0' && tensChar <= '9') {
            tens = parseInt(tensChar);
        } else {
            // A=10, B=11, ...
            tens = tensChar.charCodeAt(0) - 'A'.charCodeAt(0) + 10;
        }

        const units = parseInt(unitsChar);
        return tens * 10 + units;
    };

    // Helper to convert value back to suffix
    const formatSuffix = (val: number): string => {
        const tens = Math.floor(val / 10);
        const units = val % 10;

        let tensChar = '';
        if (tens < 10) {
            tensChar = tens.toString();
        } else {
            tensChar = String.fromCharCode('A'.charCodeAt(0) + (tens - 10));
        }

        return `${tensChar}${units}`;
    };

    const startVal = parseSuffix(startSuffix);
    const endVal = parseSuffix(endSuffix);
    const rollNumbers: string[] = [];

    for (let i = startVal; i <= endVal; i++) {
        rollNumbers.push(`${prefix}${formatSuffix(i)}`);
    }

    return rollNumbers;
};
