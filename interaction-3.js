//==========================================================================================
// AUDIO SETUP
//------------------------------------------------------------------------------------------
//
//------------------------------------------------------------------------------------------
// Edit just where you're asked to!
//------------------------------------------------------------------------------------------
//
//==========================================================================================
let dspNode = null;
let dspNodeParams = null;
let jsonParams = null;

// Change here to ("tuono") depending on your wasm file name
const dspName = "thunder";
const instance = new FaustWasm2ScriptProcessor(dspName);

// output to window or npm package module
if (typeof module === "undefined") {
    window[dspName] = instance;
} else {
    const exp = {};
    exp[dspName] = instance;
    module.exports = exp;
}

// The name should be the same as the WASM file, so change tuono with brass if you use brass.wasm
thunder.createDSP(audioContext, 1024)
    .then(node => {
        dspNode = node;
        dspNode.connect(audioContext.destination);
        console.log('params: ', dspNode.getParams());
        const jsonString = dspNode.getJSON();
        jsonParams = JSON.parse(jsonString)["ui"][0]["items"];
        dspNodeParams = jsonParams
        // const exampleMinMaxParam = findByAddress(dspNodeParams, "/thunder/rumble");
        // // ALWAYS PAY ATTENTION TO MIN AND MAX, ELSE YOU MAY GET REALLY HIGH VOLUMES FROM YOUR SPEAKERS
        // const [exampleMinValue, exampleMaxValue] = getParamMinMax(exampleMinMaxParam);
        // console.log('Min value:', exampleMinValue, 'Max value:', exampleMaxValue);
    });


//==========================================================================================
// INTERACTIONS
//------------------------------------------------------------------------------------------
//
//------------------------------------------------------------------------------------------
// Edit the next functions to create interactions
// Decide which parameters you're using and then use playAudio to play the Audio
//------------------------------------------------------------------------------------------
//
//==========================================================================================


let lastThunderTime = 0;
let motionArmed = true;

let gravityX = null;
let gravityY = 0;
let gravityZ = 0;

function accelerationChange(accx, accy, accz) {
    if (!dspNode || audioContext.state !== "running") {
        return;
    }

    if (![accx, accy, accz].every(Number.isFinite)) {
        return;
    }

    // Initialize gravity/baseline estimate
    if (gravityX === null) {
        gravityX = accx;
        gravityY = accy;
        gravityZ = accz;
        return;
    }

    // Filter out gravity and slow sensor changes
    const alpha = 0.9;

    gravityX = alpha * gravityX + (1 - alpha) * accx;
    gravityY = alpha * gravityY + (1 - alpha) * accy;
    gravityZ = alpha * gravityZ + (1 - alpha) * accz;

    // Calculate movement acceleration
    const magnitude = Math.sqrt(
        (accx - gravityX) ** 2 +
        (accy - gravityY) ** 2 +
        (accz - gravityZ) ** 2
    );

    // Trigger thunder above 5 m/s²
    if (magnitude > 5 && motionArmed &&
        Date.now() - lastThunderTime > 1500) {

        playAudio();
        lastThunderTime = Date.now();
        motionArmed = false;
    }

    // Allow another trigger after movement settles
    if (magnitude < 3) {
        motionArmed = true;
    }
}


function rotationChange(rotx, roty, rotz) {
}

function mousePressed() {
    // Use this for debugging from the desktop!
}

function deviceMoved() {
    movetimer = millis();
    statusLabels[2].style("color", "pink");
}

function deviceTurned() {
    threshVals[1] = turnAxis;
}
function deviceShaken() {
    shaketimer = millis();
    statusLabels[0].style("color", "pink");
    playAudio();
}

function getMinMaxParam(address) {
    const exampleMinMaxParam = findByAddress(dspNodeParams, address);
    // ALWAYS PAY ATTENTION TO MIN AND MAX, ELSE YOU MAY GET REALLY HIGH VOLUMES FROM YOUR SPEAKERS
    const [exampleMinValue, exampleMaxValue] = getParamMinMax(exampleMinMaxParam);
    console.log('Min value:', exampleMinValue, 'Max value:', exampleMaxValue);
    return [exampleMinValue, exampleMaxValue]
}

//==========================================================================================
// AUDIO INTERACTION
//------------------------------------------------------------------------------------------
//
//------------------------------------------------------------------------------------------
// Edit here to define your audio controls 
//------------------------------------------------------------------------------------------
//
//==========================================================================================

function playAudio() {
    if (!dspNode || audioContext.state !== "running") {
        return;
    }

    dspNode.setParamValue("/thunder/rumble", 1);

    setTimeout(() => {
        dspNode.setParamValue("/thunder/rumble", 0);
    }, 100);
}

//==========================================================================================
// END
//==========================================================================================