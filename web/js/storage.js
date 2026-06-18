// Local persistence for the demo store. No real payment is ever processed —
// "buying" a character just records ownership in localStorage on this device.
const STORAGE_KEY = "dino-dash-save-v1";

function loadSave() {
  let raw;
  try {
    raw = JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch (e) {
    raw = null;
  }
  const save = Object.assign(
    { owned: ["raptor"], equipped: "raptor", bestScore: 0 },
    raw || {}
  );
  if (!save.owned.includes("raptor")) save.owned.push("raptor");
  return save;
}

function writeSave(save) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
}

function isOwned(save, id) {
  return save.owned.includes(id);
}

function purchaseCharacter(save, id) {
  if (!save.owned.includes(id)) save.owned.push(id);
  writeSave(save);
}

function equipCharacter(save, id) {
  save.equipped = id;
  writeSave(save);
}

function recordScore(save, score) {
  if (score > save.bestScore) save.bestScore = score;
  writeSave(save);
}
