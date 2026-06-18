function renderStore(save, onChange) {
  const grid = document.getElementById("store-grid");
  grid.innerHTML = "";

  CHARACTERS.forEach((character) => {
    const owned = isOwned(save, character.id);
    const equipped = save.equipped === character.id;

    const card = document.createElement("div");
    card.className = "dino-card" + (owned ? " owned" : "") + (equipped ? " equipped" : "");

    const canvas = document.createElement("canvas");
    canvas.width = 96;
    canvas.height = 96;
    card.appendChild(canvas);

    const name = document.createElement("div");
    name.className = "dino-name";
    name.textContent = character.name;
    card.appendChild(name);

    const rarity = document.createElement("div");
    rarity.className = "dino-rarity rarity-" + character.rarity;
    rarity.textContent = RARITY_LABEL[character.rarity];
    card.appendChild(rarity);

    const action = document.createElement("button");
    action.className = "btn";
    if (!owned) {
      const price = document.createElement("div");
      price.className = "dino-price";
      price.textContent = "$" + character.price.toFixed(2);
      card.appendChild(price);
      action.textContent = "Buy";
      action.onclick = () => openBuyModal(character, save, onChange);
    } else if (equipped) {
      action.textContent = "Equipped";
      action.disabled = true;
    } else {
      action.textContent = "Equip";
      action.onclick = () => {
        equipCharacter(save, character.id);
        onChange();
      };
    }
    card.appendChild(action);

    grid.appendChild(card);
    renderCharacterIcon(canvas, character);
  });
}

function openBuyModal(character, save, onChange) {
  const modal = document.getElementById("modal-buy");
  document.getElementById("modal-buy-title").textContent = "Buy " + character.name;
  document.getElementById("modal-buy-desc").textContent =
    `${character.blurb} Unlock for $${character.price.toFixed(2)} (demo purchase, no real payment is processed).`;
  modal.classList.remove("hidden");

  const confirmBtn = document.getElementById("btn-buy-confirm");
  const cancelBtn = document.getElementById("btn-buy-cancel");

  const close = () => modal.classList.add("hidden");
  confirmBtn.onclick = () => {
    purchaseCharacter(save, character.id);
    equipCharacter(save, character.id);
    close();
    onChange();
  };
  cancelBtn.onclick = close;
}
