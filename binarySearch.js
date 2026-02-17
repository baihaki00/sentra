function binarySearch(arr, target) {
  let start = 0;
  let end = arr.length - 1;

  while (start <= end) {
    const mid = Math.floor((start + end) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) start = mid + 1;
    else end = mid - 1;
  }
  return -1;
}

// Example usage:
const sortedArray = [1, 3, 5, 7, 9];
console.log(binarySearch(sortedArray, 5)); // Output: 2
console.log(binarySearch(sortedArray, 10)); // Output: -1