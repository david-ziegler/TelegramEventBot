function pretty(object) {
  return JSON.stringify(object, null, 2);
}

function sanitize(original) {
  const unwantedCharacters = ["_", "*", "[", "]"];
  return unwantedCharacters.reduce((original, character) => {
    return removeOddNumberOfCertainCharacter(original, character);
  }, original);
}

function removeOddNumberOfCertainCharacter(original, unwantedCharacter) {
  // make sure the string doesn't contain an uneven number of "_"
  // An even number can be correctly parsed as markdown
  const replaceBy = " ";
  if (isOdd(numberOfOccurrences(original, unwantedCharacter))) {
    return original.replace(unwantedCharacter, replaceBy);
  }

  return original;
}

function numberOfOccurrences(string, key) {
  const escapedKey = "\\" + key;
  const matchingResults = string.match(new RegExp(escapedKey, "g"));
  if (!matchingResults) {
    return 0;
  }
  return matchingResults.length;
}

function isOdd(number) {
  return number % 2 === 1;
}

module.exports = { pretty, sanitize };
