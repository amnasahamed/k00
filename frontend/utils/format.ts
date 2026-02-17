export const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
};

export const numberToWords = (num: number): string => {
    if (num === 0) return 'zero';
    if (isNaN(num)) return '';

    const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
    const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];

    const convert = (n: number): string => {
        if (n < 10) return ones[n];
        if (n < 20) return teens[n - 10];
        if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
        if (n < 1000) return ones[Math.floor(n / 100)] + ' hundred' + (n % 100 !== 0 ? ' and ' + convert(n % 100) : '');
        if (n < 1000000) return convert(Math.floor(n / 1000)) + ' thousand' + (n % 1000 !== 0 ? ' ' + convert(n % 1000) : '');
        if (n < 1000000000) return convert(Math.floor(n / 1000000)) + ' million' + (n % 1000000 !== 0 ? ' ' + convert(n % 1000000) : '');
        return 'number too large';
    };

    const prefix = num < 0 ? 'minus ' : '';
    const result = convert(Math.abs(Math.floor(num)));
    return prefix + result.charAt(0).toUpperCase() + result.slice(1);
};
