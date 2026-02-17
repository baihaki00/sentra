function factorial(n) {
  if (n < 0) throw new Error('Factorial is not defined for negative numbers');
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}

// Example usage:
console.log(factorial(5)); // 120
console.log(factorial(0)); // 1