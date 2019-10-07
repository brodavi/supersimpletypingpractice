'use strict';

const defaultWords = ['[1, 2, 3, 4]', '{a: 1, b: 2}', '`${myvar}`', 'foo -r -e | bar', './start-server -c', 'cd ..; cd /test; npm run compile', '\\n whatever', '<div></div>', 'question? answer!', 'the quick, brown, fox jumped over the lazy dog', '50%', 'we are #1', 'example@example.com', 'for (let x = 0; x < 10; x++) { doThis(thisThing); }', "if __name__ == '__main__':", 'span.success { background-color: salmon; }', 'defp elixirc_paths(:test), do: ["lib", "test/support"]', '$40', '10^2', 'R&R', '10*3', 'function(call)', '10 - 5', '3 + 8', 'snake_case_like_this', 'var = 5;', '~/src/stuff', ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft','ArrowRight', 'ArrowLeft','ArrowRight', 'b', 'a', '*'], ['Control-a', 'Control-c', 'Control-v'], ['Backspace', 'Backspace', ' ', ' ', 'ArrowLeft', 'ArrowRight', 'Tab', 'ArrowUp', 'Tab', 'ArrowDown', 'Enter'], ['Delete', 'Home', 'Shift-End', 'Delete', 'Shift-Home', 'Backspace', 'PageUp', 'PageDown'], ['Shift-ArrowUp', 'Shift-ArrowLeft'], '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', '`', '[', ']', '=', '-', ['Tab'], '\\', '\'', ['Backspace'], ['Control'], ['Delete'], ['Enter'], ['Home'], ['PageUp'], ['End'], ['PageDown'], '+', '!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '_', '|', '"', '~', ':', '<', '>', '?', '{', '}']

const textArea = document.querySelector('.targetWords')

// Add default words to textarea
textArea.value = JSON.stringify(defaultWords)

// Init vars
let textAreaWords
let targetWords
let targetWord
let targetKey
let targetWordIDX

/**
 * Listen for the click to save words to localstorage
 */
document.querySelector('.saveWords').addEventListener('click', () => {
  window.localStorage.setItem('sstp-words', JSON.stringify(getTextAreaWords()))
})

/**
 * Listen for the click to load words from localstorage
 */
document.querySelector('.loadWords').addEventListener('click', () => {
  const loadedString = window.localStorage.getItem('sstp-words')
  textArea.value = loadedString
})

/**
 * Listen for the click to add words from the textarea and use them to train
 */
document.querySelector('.addWords').addEventListener('click', (e) => {
  // So that if a space or enter comes up in the list, the user won't start all over
  e.target.blur()

  textAreaWords = getTextAreaWords()
  targetWords = shuffle(textAreaWords)

  // Set up initial target word
  targetWordIDX = 0
  targetWord = {
    word: targetWords[targetWordIDX],
    targetIDX: 0
  }

  // Set up initial target key
  targetKey = targetWord.word[targetWord.targetIDX]
  renderTargetWord()
})

/**
 * When the user hits a key
 */
document.onkeydown = function(e) {

  // If user is typing in the text area, let it do its thing
  if (e.target.nodeName === 'TEXTAREA') {
    return
  }

  // Ignore if shift, always
  if (e.keyCode === 16) {
    return
  }

  // Also ignore if target key is a ctrl- or alt- combo and the keypress was ctrl or alt
  if ((targetKey.indexOf('Control-') !== -1 && e.key === 'Control') ||
      (targetKey.indexOf('Alt-') !== -1 && e.key === 'Alt')) {
    return
  }

  e.preventDefault()

  // If user typed the right key...
  if (testKey(e)) {
    document.querySelector('.indicator').classList.add('success')
    document.querySelector('.indicator').classList.remove('failure')
    document.querySelector('.indicator').innerHTML = 'CORRECT'

    nextWordStep(e)
  } else {
    // User typed the wrong key
    document.querySelector('.indicator').classList.add('failure')
    document.querySelector('.indicator').classList.remove('success')
    document.querySelector('.indicator').innerHTML = `NO. "${targetKey}" not "${e.key}"`
  }
}

/**
 * The entered key was correct... show the next key to type
 */
function nextWordStep (e) {
  targetWord.targetIDX++

  // If there are no more letters of target word, proceed to the next word
  if (!targetWord.word[targetWord.targetIDX]) {
    targetWordIDX++
    targetWord.word = targetWords[targetWordIDX]
    targetWord.targetIDX = 0
  }

  // If there are no more words in this shuffle, then re-shuffle
  if (!targetWord.word) {
    textAreaWords = getTextAreaWords()
    let targetWords = shuffle(textAreaWords)
    targetWordIDX = 0
    targetWord = {
      word: targetWords[targetWordIDX],
      targetIDX: 0
    }
  }

  // Put it up on the screen
  renderTargetWord()

  // Expect the user to type the next key in the sequence
  targetKey = targetWord.word[targetWord.targetIDX]
}

/**
 * Rendering the word
 */
function renderTargetWord () {
  // clear target word for re-render
  document.querySelector('.targetWord').innerHTML = ''

  // maybe string to array
  const targetWordArray = typeof targetWord.word === 'string' ? targetWord.word.split('') : targetWord.word

  // letters / keys to divs
  const letters = targetWordArray.map((l, idx) => {
    const el = document.createElement('div')
    let targetChar = targetWord.word[idx]

    // color the characters / keys depending on completion
    if (idx < targetWord.targetIDX) {
      el.classList.add('done')
    } else {
      el.classList.add('pending')
    }

    // If the word is an array sequence of keystrokes like arrows...
    if (typeof targetWord.word === 'object') {
      if (targetChar === ' ') {
        targetChar = '(SPACE)'
      }

      el.innerHTML = targetChar
      el.classList.add('notChar')
    } else {
      // Else the keystrokes are like characters, not arrows, tabs, etc...
      if (targetChar === ' ') {
        // special case for space
        targetChar = '&nbsp;'
      }

      el.innerHTML = targetChar
    }

    return el
  })

  // append the divs
  for (let x = 0; x < targetWordArray.length; x++) {
    document.querySelector('.targetWord').appendChild(letters[x])
  }
}

/**
 * Testing if the key is correct. Account for special combos
 */
function testKey (e) {
  const ctrlCombo = targetKey.indexOf('Control-') !== -1
  const altCombo = targetKey.indexOf('Alt-') !== -1
  const shiftCombo = targetKey.indexOf('Shift-') !== -1

  // It might be a combo
  if (ctrlCombo) {
    const actualKey = targetKey.split('Control-')[1]
    return e.key === actualKey && e.ctrlKey
  } else if (altCombo) {
    const actualKey = targetKey.split('Alt-')[1]
    return e.key === actualKey && e.altKey
  } else if (shiftCombo) {
    const actualKey = targetKey.split('Shift-')[1]
    return e.key === actualKey && e.shiftKey
  } else {
    // else it is just a normal key
    return e.key === targetKey
  }
}

/**
 * Shuffle the testing words. From https://github.com/pazguille/shuffle-array
 */
function shuffle (arr) {
  let collection = arr
  let len = arr.length
  let rng = Math.random
  let random
  let temp

  while (len) {
    random = Math.floor(rng() * len)
    len -= 1
    temp = collection[len]
    collection[len] = collection[random]
    collection[random] = temp
  }

  return collection
}

/**
 * Try to parse what's in the text area
 */
function getTextAreaWords () {
  let textAreaWords = {}
  try {
    textAreaWords = JSON.parse(textArea.value)
  } catch {
    alert('Sorry, please check the JSON syntax and try again.')
    throw new Error('Sorry, please check the JSON syntax and try again.')
  }
  return textAreaWords
}
