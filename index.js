'use strict';

const specialKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab', 'Backspace', 'Enter', 'Delete', 'Home', 'End', 'PageUp', 'PageDown']

const defaultSequences = ['[1, 2, 3, 4]', '{a: 1, b: 2}', '`${myvar}`', 'foo -r -e | bar', './start-server -c', 'cd ..; cd /test; npm run compile', '\\n whatever', '<div></div>', 'question? answer!', 'the quick, brown, fox jumped over the lazy dog', '50%', 'we are #1', 'example@example.com', 'for (let x = 0; x < 10; x++) { doThis(thisThing); }', "if __name__ == '__main__':", 'span.success { background-color: salmon; }', 'defp elixirc_paths(:test), do: ["lib", "test/support"]', '$40', '10^2', 'R&R', '10*3', 'function(call)', '10 - 5', '3 + 8', 'snake_case_like_this', 'var = 5;', '~/src/stuff', 'ArrowUp·ArrowUp·ArrowDown·ArrowDown·ArrowLeft·ArrowRight·ArrowLeft·ArrowRight·ba*', 'Control-a·Control-c·Control-v', 'Backspace·Backspace·ArrowLeft·ArrowRight·Tab·ArrowUp·Tab·ArrowDown·Enter', 'Delete·Home·Shift-End·Delete·Shift-Home·Backspace·ArrowUp·ArrowDown', 'Shift-ArrowUp·Shift-ArrowLeft', '1234567890', 'qwertyuiop', 'asdfghjkl;', 'zxcvbnm,./', '`[]=-', '·Tab·Backspace·Delete·Enter·Home·ArrowUp·End·ArrowDown', '+!@#$%^&*()_|"~:<>?{}']

const textArea = document.querySelector('.targetSequences')

// Add default sequences to textarea
textArea.value = JSON.stringify(defaultSequences)

// Init vars

let sequences // the list of lists of keystrokes
let targetSequence // the current list of keystrokes
let targetSequenceIDX // the current sequence's index (list of keystrokes)

let targetKeystrokeIDX // the current keystroke's index

/**
 * Listen for the click to add sequences from the textarea
 */
document.querySelector('.addSequences').addEventListener('click', (e) => {
  // So that if a space or enter comes up in the list, the user won't start all over
  e.target.blur()

  // Get an array of arrays of keystrokes from the text area
  sequences = getSequencesFromTextArea()

  // Maybe shuffle the sequences
  const randomize = document.querySelector('.randomize').checked
  if (randomize) {
    sequences = shuffle(sequences)
  }

  // Set up initial target sequence
  targetSequenceIDX = 0
  targetSequence = sequences[targetSequenceIDX]

  // Split into keystrokes
  targetKeystrokeIDX = 0

  renderTargetSequence()
})

/**
 * When the user hits a key
 */
document.onkeydown = function(e) {
  const targetKeystroke = targetSequence[targetKeystrokeIDX]

  // If user is typing in the text area, let it do its thing
  if (e.target.nodeName === 'TEXTAREA') {
    return
  }

  // Ignore if shift, always
  if (e.keyCode === 16) {
    return
  }

  // Also ignore if target key is a ctrl- or alt- combo and the keypress was ctrl or alt
  if ((targetKeystroke.indexOf('Control-') !== -1 && e.key === 'Control') ||
      (targetKeystroke.indexOf('Alt-') !== -1 && e.key === 'Alt')) {
    return
  }

  e.preventDefault()

  if (testKey(e)) {
    // If user typed the right key...
    document.querySelector('.indicator').classList.add('success')
    document.querySelector('.indicator').classList.remove('failure')
    document.querySelector('.indicator').innerHTML = 'CORRECT'

    nextKeystroke(e)
  } else {
    // User typed the wrong key
    document.querySelector('.indicator').classList.add('failure')
    document.querySelector('.indicator').classList.remove('success')
    document.querySelector('.indicator').innerHTML = `NO. "${targetKeystroke}" not "${e.key}"`
  }
}

/**
 * The entered key was correct... show the next key to type
 */
function nextKeystroke (e) {

  // Expect the user to type the next key in the sequence
  targetKeystrokeIDX++

  // If there are no more keys in the target sequence, proceed to the next sequence
  if (targetKeystrokeIDX > targetSequence.length - 1) {
    targetSequenceIDX++
    targetSequence = sequences[targetSequenceIDX]
    targetKeystrokeIDX = 0

    // If there are no more sequences, maybe reshuffle or just loop around
    if (!targetSequence) {
      const randomize = document.querySelector('.randomize').checked

      if (randomize) {
        sequences = shuffle(sequences)
      }

      // start up the initial sequence again
      targetSequenceIDX = 0
      targetSequence = sequences[targetSequenceIDX]
      targetKeystrokeIDX = 0
    }
  }

  // Put it up on the screen
  renderTargetSequence()
}

/**
 * Rendering the sequence
 */
function renderTargetSequence () {
  // clear target sequence for re-render
  document.querySelector('.targetSequence').innerHTML = ''

  // words / keys to divs
  const toType = targetSequence.map((key, idx) => {
    const el = document.createElement('div')
    let targetChar

    // color the characters / keys depending on completion
    if (idx < targetKeystrokeIDX) {
      el.classList.add('done')
    } else {
      el.classList.add('pending')
    }

    if (key === ' ') {
      // special case for space
      targetChar = '&nbsp;'
    } else if (isSpecial(key)) {
      targetChar = `<b>${key}</b>`
    } else {
      targetChar = key
    }

    el.innerHTML = targetChar

    return el
  })

  // append the divs
  for (let x = 0; x < targetSequence.length; x++) {
    document.querySelector('.targetSequence').appendChild(toType[x])
  }
}

/**
 * Testing if the target is a special key or just a string
 */
function isSpecial (keyOrChar) {
  if (specialKeys.indexOf(keyOrChar) !== -1) {
    return true
  } else if (keyOrChar.indexOf('Control-') !== -1 || keyOrChar.indexOf('Alt-') !== -1 || keyOrChar.indexOf('Shift-') !== -1) {
    return true
  } else {
    return false
  }
}

/**
 * Testing if the key is correct. Account for special combos
 */
function testKey (e) {
  const targetKey = targetSequence[targetKeystrokeIDX]
  const ctrlCombo = targetKey.indexOf('Control-') !== -1
  const altCombo = targetKey.indexOf('Alt-') !== -1
  const shiftCombo = targetKey.indexOf('Shift-') !== -1

  // It might be a combo
  if (ctrlCombo) {
    const actualKeyStroke = targetKey.split('Control-')[1]
    return e.key === actualKeyStroke && e.ctrlKey
  } else if (altCombo) {
    const actualKeyStroke = targetKey.split('Alt-')[1]
    return e.key === actualKeyStroke && e.altKey
  } else if (shiftCombo) {
    const actualKeyStroke = targetKey.split('Shift-')[1]
    return e.key === actualKeyStroke && e.shiftKey
  } else {
    // else it is just a normal key
    return e.key === targetKey
  }
}

/**
 * Try to parse what's in the text area
 */
function getSequencesFromTextArea () {
  let parsed
  let sequences
  try {
    parsed = JSON.parse(textArea.value)
  } catch {
    alert('Sorry, please check the JSON syntax and try again.')
    throw new Error('Sorry, please check the JSON syntax and try again.')
  }
  sequences = parsed.map((s) => getTargetKeystrokesArray(s))
  return sequences
}

function getTargetKeystrokesArray (str) {
  const splits = str.split(/\·/)
  let targetKeyStrokesArray = []

  // For each space-separated chunk
  for (let x = 0; x < splits.length; x++) {
    const key = splits[x]
    // If it is a special key, push the whole chunk
    if (isSpecial(key)) {[]
      targetKeyStrokesArray.push(key)
    } else {
      // Otherwise it is either single keys or a word. Push individual characters.
      for (let y = 0; y < key.length; y++) {
        targetKeyStrokesArray.push(key[y])
      }
    }
  }

  return targetKeyStrokesArray
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
 * Listen for the click to save sequences to localstorage
 */
document.querySelector('.saveSequences').addEventListener('click', () => {
  window.localStorage.setItem('sstp-sequences', JSON.stringify(textArea.value))
})

/**
 * Listen for the click to load sequences from localstorage
 */
document.querySelector('.loadSequences').addEventListener('click', () => {
  const loadedString = window.localStorage.getItem('sstp-sequences')
  textArea.value = JSON.parse(loadedString)
})

/**
 * Listen for the click to load the kinesis sequences
 */
document.querySelector('.addKinesisTraining').addEventListener('click', () => {
  textArea.value = `["afrf aded afrf aded afrf aded afrf aded afvf adcd afvf adcd afvf adcd afvf adcd juj; afad juj; afad juj; afad juj; afad kik; fsff kik; fsff kik; fsff kik; fsff graf olok graf olok graf olok graf olok bavf luj; bavf luj; bavf luj; bavf luj; swsf ljuj swsf ljuj swsf ljuj swsf ljuj deda lolj deda lolj deda lolj deda lolj afrf aded afrf aded afrf aded","afrf aded afvf adcd afvf adcd afvf adcd afvf adcd juj; afad juj; afad kik; fsff kik; fsff graf olok graf olok bavf luj; bavf luj; swsf ljuj swsf ljuj deda lolj deda lolj talked staff rolled sale trees goals fluke cackle talked staff rolled sale trees goals fluke cackle glowed bigger before scared guild slow liked just glowed bigger before scared","guild slow liked just sort fool talked staff rolled relaxed tasted wool sort fool talked staff rolled relaxed tasted wool afrf aded afrf aded afrf aded afrf aded afvf adcd afvf adcd afvf adcd afvf adcd juj; afad juj; afad juj; afad juj; afad kik; fsff kik; fsff kik; fsff kik; fsff graf olok graf olok graf olok graf olok bavf luj; bavf luj;","bavf luj; bavf luj; swsf ljuj swsf ljuj swsf ljuj swsf ljuj deda lolj deda lolj deda lolj deda lolj fbvf dacd fbvf dacd fbvf dacd fbvf dacd fvcd dcvf fvcd dcvf fvcd dcvf fvcd dcvf over believe guild drove still cold sale trees over believe guild drove still cold sale trees folder older aloof afar dragged rover lead foal folder older aloof afar","dragged rover lead foal graft lower grand called glorious fodder cooked graft lower grand called glorious fodder cooked cave decade cavalier vacated device facade covered cave decade cavalier vacated device facade covered tafg flol tafg flol adcd jyuj adcd jyuj tafg flol tafg flol adcd jyuj adcd jyuj ;p;k sxs; ;p;k sxs; aqaf jefa aqaf","jefa ;p;k sxs; ;p;k sxs; aqaf jefa aqaf jefa azak jmjs azak jmjs hooj saef hooj saef azak jmjs azak jmjs hooj saef hooj saef jnj; swsf jnj; swsf l.lf jaff l.lf jaff jnj; swsf jnj; swsf l.lf jaff l.lf jaff home jump mind jeweled office sports vacation home jump mind jeweled home jump mind jeweled office sports vacation home jump mind jeweled office","sports vacation coming divine major going afar faded lukewarm office sports vacation coming divine major going afar faded lukewarm coming divine major going afar faded lukewarm forward during action coming divine major going afar faded lukewarm forward during action jaded minor azure hopped forward during action jaded minor azure jaded minor","azure hopped forward during action jaded minor azure hopped quaff ajar squall liver cold sliced jokers squall quaff ajar squall hopped quaff ajar squall liver cold sliced jokers squall quaff ajar squall liver cold sliced jokers squall believed quivered baked jewelry jumpy liver cold sliced jokers squall believed quivered baked jewelry jumpy buffalo","soon believed quivered baked jewelry jumpy buffalo soon buffalo soon believed quivered baked jewelry jumpy buffalo soon molj cadd molj cadd molj cadd molj cadd fafa kiol fafa kiol fafa kiol fafa kiol jauj molj cadd molj jauj molj cadd molj cadd fafa kiol fafa kiol fafa kiol fafa kiol jauj hakk jnmj hakk jauj hakk jnmj hakk jnmj najj meff","najj meff jnmj najj meff najj meff jauj hakk jnmj hakk jnmj jauj hakk jnmj hakk jnmj najj meff najj meff jauj frfvf kik,k frfvf kik,k frfvf kik,k frfvf kik,k dedcd lol.l dedcd lol.l dedcd lol.l dedcd lol.l frfvf kik,k frfvf kik,k frfvf kik,k frfvf kik,k dedcd lol.l dedcd lol.ldedcd lol.l dedcd lol.l swsxs jujmj swsxs jujmj swsxs jujmj swsxs jujmj aqaza",";p;/; azaqa ;p;/; aqaza ;p;/; azaqa ;p;/; swsxs jujmj swsxs jujmj swsxs jujmj swsxs jujmj aqaza ;p;/; azaqa ;p;/; aqaza ;p;/; azaqa ;p;/; game inside past truly please knowledge hide examples scold fax zany jail same axes loose through nevertheless assuming familiar ridiculous exchange masked exiled over likes favored sacked backward cerebral","handy joust kinship daunting rhapsody walks jokers quail skill zoo oxen dump game inside past truly please knowledge hide examples scold fax zany jail same axes loose through nevertheless assuming familiar ridiculous exchange masked exiled over likes favored sacked backward cerebral handy joust kinship daunting rhapsody walks jokers quail skill","zoo oxen dump zyx wvu tsr qpo nml kji hgf edc ba zyxw vutsr qponm lkjih gfedcba zyxwvutsrqponmlkjihgfedcba zyx wvu tsr qpo nml kji hgf edc ba zyxw vutsr qponm lkjih gfedcba zyxwvutsrqponmlkjihgfedcba zyx wvu tsr qpo nml kji hgf edc ba zyxw vutsr qponm lkjih gfedcba zyxwvutsrqponmlkjihgfedcba zyx wvu tsr qpo nml kji hgf edc ba zyxw","vutsr qponm lkjih gfedcba zyxwvutsrqponmlkjihgfedcba quizzical eloquently exercises bugles however banished gourmand zoological abstract concrete yourself treatise conditional knowledge ergonomics snail diary homer jumpy nail jolly sonar half quizzical eloquently exercises bugles however banished gourmand zoological abstract concrete","yourself treatise conditional knowledge ergonomics snail diary homer jumpy nail jolly sonar half abc def ghi jkl mno pqr stu vwx yz abcdef ghijkl mnopqr stuvwx yz abcdefghijklmnopqrstuvwxyz abc def ghi jkl mno pqr stu vwx yz abcdef ghijkl mnopqr stuvwx yz abcdefghijklmnopqrstuvwxyz manifest juicy lopsided safeguard","justified popular analysis kilobyte national megabyte transaction destiny opportunity abracadabra limitation daily bagel zoom goof pretzel prized sage honey nosed manifest juicy lopsided safeguard justified popular analysis kilobyte national megabyte transaction destiny opportunity abracadabra limitation daily bagel zoom goof","pretzel prized sage honey nosed Afk; Bfj; Cdj; Djl; Edf; F;la G;dj Hjsf Ik;a Ja;f Ksf; L;af Mj;d Nj;a Olf; Plf; Qa;k Rf;k S;fj Tf;k Uja; V;fk Ws;k Xs;j Yj;a Za;j Afk; Bfj; Cdj; Djl; Edf; F;la G;dj Hjsf Ik;a Ja;f Ksf; L;af Mj;d Nj;a Olf; Plf; Qa;k Rf;k S;fj Tf;k Uja; V;fk Ws;k Xs;j Yj;a Za;j Alpha Bet Card Diver Elbow Frankly Gawk Hegemony","Important Jolted Kudos Lollipop Mashed Needle Oenological Potatoes Quaint Roasted Spoiled Tangy Ultimately Void Wallpaper Xerox Yoghurt Zola Alpha Bet Card Diver Elbow Frankly Gawk Hegemony Important Jolted Kudos Lollipop Mashed Needle Oenological Potatoes Quaint Roasted Spoiled Tangy Ultimately Void Wallpaper Xerox Yoghurt Zola","frfvf fr4rf fr4f f4f frfvf fr4rf fr4f f4f lol.l lo9ol lo9l l9l lol.l lo9ol lo9l l9l dedcd de3ed de3d d3d dedcd de3ed de3d d3d jujmj ju7uj ju7j j7j jujmj ju7uj ju7j j7j aqaza aq1qa aq1a a1a aqaza aq1qa aq1a a1a frfvf fr4rf fr4f f4f frfvf fr4rf fr4f f4f lol.l lo9ol lo9l l9l lol.l lo9ol lo9l l9l dedcd de3ed de3d d3d dedcd de3ed de3d d3d jujmj ju7uj","ju7j j7j jujmj ju7uj ju7j j7j aqaza aq1qa aq1a a1a aqaza aq1qa aq1a a1a kik,k ki8ik ki8k k8k kik,k ki8ik ki8k k8k swsxs sw2ws sw2s s2s swsxs sw2ws sw2s s2s fbftf ft5tf ft5f f5f fbftf ft5tf ft5f f5f ;p;/; ;p0p; ;p0; ;0; ;p;/; ;p0p; ;p0; ;0; jnjyj jy6yj jy6j j6j jmjyj jy6yj jy6j j6j kik,k ki8ik ki8k k8k kik,k ki8ik ki8k k8k swsxs sw2ws sw2s s2s swsxs","sw2ws sw2s s2s fbftf ft5tf ft5f f5f fbftf ft5tf ft5f f5f ;p;/; ;p0p; ;p0; ;0; ;p;/; ;p0p; ;p0; ;0; jnjyj jy6yj jy6j j6j jmjyj jy6yj jy6j j6j frfvf fr4rf fr4f f4f frfvf fr4rf fr4f f4f lol.l lo9ol lo9l l9l lol.l lo9ol lo9l l9l dedcd de3ed de3d d3d dedcd de3ed de3d d3d jujmj ju7uj ju7j j7j jujmj ju7uj ju7j j7j aqaza aq1qa aq1a a1a aqaza aq1qa aq1a a1a","frfvf fr4rf fr4f f4f frfvf fr4rf fr4f f4f lol.l lo9ol lo9l l9l lol.l lo9ol lo9l l9l dedcd de3ed de3d d3d dedcd de3ed de3d d3d jujmj ju7uj ju7j j7j jujmj ju7uj ju7j j7j aqaza aq1qa aq1a a1a aqaza aq1qa aq1a a1a kik,k ki8ik ki8k k8k kik,k ki8ik ki8k k8k swsxs sw2ws sw2s s2s swsxs sw2ws sw2s s2s fbftf ft5tf ft5f f5f fbftf ft5tf ft5f f5f ;p;/; ;p0p;",";p0; ;0; ;p;/; ;p0p; ;p0; ;0; jnjyj jy6yj jy6j j6j jmjyj jy6yj jy6j j6j kik,k ki8ik ki8k k8k kik,k ki8ik ki8k k8k swsxs sw2ws sw2s s2s swsxs sw2ws sw2s s2s fbftf ft5tf ft5f f5f fbftf ft5tf ft5f f5f ;p;/; ;p0p; ;p0; ;0; ;p;/; ;p0p; ;p0; ;0; jnjyj jy6yj jy6j j6j jmjyj jy6yj jy6j j6j","1734 All Drive·Tab·3907 Bored Street·Tab·3200 Cold Place·Tab·5821 Daring Lane·Tab·5487 Eagle Nest·Tab·4509 Friendly Canyon·Tab·2753 Game Boulevard·Tab·6732 House Property·Tab·8712 Inside Lane·Tab·7613 James Town·Tab·8459 Knowledge Bay·Tab·9494 Laundry Room·Tab·6721 Mocha Java·Tab·6442 Naval Station·Tab·9874 Olive Street·Tab·9083 Prexy Lake Drive·Tab·1132 Quoted Price·Tab·4543 Razor Blade·Tab·2272 Stage Play·Tab·5487 Trendy Place·Tab·6723 Underground Lane·Tab·4438 Valor Avenue·Tab·2243 Waxed Eloquent·Tab·2674 Xylophone Drive·Tab·7612 Younts Villa·Tab·1293 Zoological Gardens·Tab·1734 All Drive·Tab·3907 Bored Street·Tab","3200 Cold Place·Tab·5821 Daring Lane·Tab·5487 Eagle Nest·Tab·4509 Friendly Canyon·Tab·2753 Game Boulevard·Tab·6732 House Property·Tab·8712 Inside Lane·Tab·7613 James Town·Tab·8459 Knowledge Bay·Tab·9494 Laundry Room·Tab·6721 Mocha Java·Tab·6442 Naval Station·Tab·9874 Olive Street·Tab·9083 Prexy Lake Drive·Tab·1132 Quoted Price·Tab·4543 Razor Blade·Tab·2272 Stage Play·Tab·5487 Trendy Place·Tab·6723 Underground Lane·Tab·4438 Valor Avenue·Tab·2243 Waxed Eloquent·Tab·2674 Xylophone Drive·Tab·7612 Younts Villa·Tab·=1293 Zoological Gardens·Tab·fvf fv·ArrowRight·vf fv·ArrowRight·f","F·ArrowRight·f fv·ArrowRight·vf f·ArrowRight·f fv·ArrowRight·f f·ArrowRight·fdcd dc·ArrowLeft·cd dc·ArrowLeft·d d·ArrowLeft·d dc·ArrowLeft·cd d·ArrowLeft·d dc·ArrowLeft·d d·ArrowLeft· jmj jm·ArrowUp·mj jm·ArrowUp·j j·ArrowUp·j jm·ArrowUp·mj j·ArrowUp·j jm·ArrowUp·J j·ArrowUp·j k,k k,·ArrowDown·,k k,·ArrowDown·k k·ArrowDown·k k,·ArrowDown·,k k·ArrowDown·k k,·ArrowDown·k k·ArrowDown·k fv·ArrowRight·f dc·ArrowLeft·d jm ·ArrowUp·j k,·ArrowDown·k fv·ArrowRight·f dc·ArrowLeft·d jmj·ArrowUp·j k,·ArrowDown·k f·ArrowRight·f d·ArrowLeft·d j·ArrowUp·j k·ArrowDown·k f·ArrowRight·f d·ArrowLeft·d j·ArrowUp·j k·ArrowDown·k","44654 Adamant Canyon 14585 Bowl Lane 71425 Clone Circle 96474 Dandelion Park Drive 36515 Edify Avenue 93654 Foolish Place 54267 Goal Lane 85494 Hooligan Boulevard 66255 Idiotic Place 82956 Jail House Road 94875 KeelOver 52045 Lampshade Lane 74068 Malamute Molt 38946 Noodles Circle 18453 Okeefenokee Creek 27465 Palate Street 32759 Quiet Place 97516 Raining Road 81953 Stoked Street 64846 Tornado Alley 75362 Urgent Matter 10839 Vellum Lane 67815 Woolens Mill Road 42617 Xanadu Dome 97264 Yearly Circle 28015 Zipped Code the this then those their these","them there the this then those their these them there of in into on onto our off only offer odd of in into on onto our off only offer odd station nation action fusion solution motion station nation action fusion solution motion fed led sped paled soled wed soiled hiked fed led sped paled soled wed soiled hiked tried spied plied fried hide slide collide tried spied plied fried hide slide collide how plow stow two throw should could would how plow stow two throw should could would rough although sought through bough fought tough rough although sought through bough fought tough move drive grove love five trove jive live hive move drive grove love five trove jive live hive","all ball fall mall stall call hall wall shall all ball fall mall stall call hall wall shall dill still will hill sill fill mill grill dill still will hill sill fill mill grill inside outside cold hot special sale think can't inside outside cold hot special sale think can't please won't international coming slow fast yet please won't international coming slow fast yet don't with never think eats drinks before after don't with never think eats drinks before after talk find help coming making vacation soon city talk find help coming making vacation soon city state together while during from important example state together while during from important example made during","following part know want need city made during following part know want need city every examples thing believe first last therefore every examples thing believe first last therefore children adults people national good room some children adults people national good room some look generally food times much sing ring find look generally food times much sing ring find watered go fold organization appear everything watered go fold organization appear everything backward toward forward afterward never always backward toward forward afterward never always have has news for had need must much last first have has news for had need must much last first be believe times work even better person","excellent be believe times work even better person excellent see years jam very back forth computers people see years jam very back forth computers people when does who likes why jelly what makes where when does who likes why jelly what makes where labor vehicle flavor volume loved mobile voted labor vehicle flavor volume loved mobile voted entirely whole short tall now some women more man entirely whole short tall now some women more man want soon which stand come send think others such want soon which stand come send think others"]`
})
