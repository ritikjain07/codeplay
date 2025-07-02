// URL encode password for MongoDB connection
const password = 'sSBysMLc1C3f0Wsa';
const encodedPassword = encodeURIComponent(password);
console.log('Original password:', password);
console.log('URL encoded password:', encodedPassword);

// Check if there are any special characters
const hasSpecialChars = /[^a-zA-Z0-9]/.test(password);
console.log('Has special characters:', hasSpecialChars);

if (hasSpecialChars) {
    console.log('⚠️  Password contains special characters, use URL encoded version');
} else {
    console.log('✅ Password is safe to use as-is');
}
