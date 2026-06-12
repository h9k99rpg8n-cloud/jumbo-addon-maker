const state = {
  addon: null,
  blocks: [],
  workspace: null,
};

const $ = (selector) => document.querySelector(selector);

const ui = {
  newAddonButton: $("#newAddonButton"),
  newAddonModal: $("#newAddonModal"),
  newAddonForm: $("#newAddonForm"),
  addonNameInput: $("#addonNameInput"),
  addonDescriptionInput: $("#addonDescriptionInput"),
  projectNameLabel: $("#projectNameLabel"),
  projectDescriptionLabel: $("#projectDescriptionLabel"),
  emptyTree: $("#emptyTree"),
  projectTree: $("#projectTree"),
  moreButton: $("#moreButton"),
  moreMenu: $("#moreMenu"),
  createNewButton: $("#createNewButton"),
  createPanel: $("#createPanel"),
  closeCreatePanel: $("#closeCreatePanel"),
  createBlockButton: $("#createBlockButton"),
  newBlockModal: $("#newBlockModal"),
  newBlockForm: $("#newBlockForm"),
  blockNameInput: $("#blockNameInput"),
  blockIdInput: $("#blockIdInput"),
  heroTitle: $("#heroTitle"),
  heroText: $("#heroText"),
  canvasTitle: $("#canvasTitle"),
  welcomeMessage: $("#welcomeMessage"),
  blockEditor: $("#blockEditor"),
  blockNameLabel: $("#blockNameLabel"),
  blockIdLabel: $("#blockIdLabel"),
  addVisualBlockButton: $("#addVisualBlockButton"),
};

function openModal(modal) {
  modal.classList.remove("hidden");
}

function closeModals() {
  document.querySelectorAll(".modal").forEach((modal) => modal.classList.add("hidden"));
}

function slugify(value) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "mi_bloque";
}

function createAddon(name, description) {
  state.addon = {
    name: name.trim(),
    description: description.trim(),
  };
  state.blocks = [];
  renderApp();
}

function createBasicBlock(name, identifier) {
  const block = {
    type: "block",
    name: name.trim(),
    identifier: identifier.trim(),
    behaviorPath: `behavior_packs/blocks/${slugify(name)}.json`,
    resourcePath: `resource_packs/blocks/${slugify(name)}.json`,
  };
  state.blocks.push(block);
  renderApp();
  showBlockEditor(block);
}

function renderApp() {
  const hasAddon = Boolean(state.addon);
  ui.projectNameLabel.textContent = hasAddon ? state.addon.name : "Sin complemento";
  ui.projectDescriptionLabel.textContent = hasAddon
    ? state.addon.description || "Sin descripción. Alpha sin manifest todavía."
    : "Crea un complemento para comenzar.";

  ui.heroTitle.textContent = hasAddon ? `Complemento: ${state.addon.name}` : "Empieza creando un complemento";
  ui.heroText.textContent = hasAddon
    ? "Ahora puedes usar los tres puntitos para crear bloques y ver la estructura tipo bridge: behavior pack rojo y resource pack azul."
    : "Esta versión alpha prepara el panel, la estructura de carpetas y un bloque básico sin generar todavía manifiesto.";

  ui.canvasTitle.textContent = hasAddon ? "Panel del complemento" : "Nada creado todavía";
  ui.moreButton.disabled = !hasAddon;

  if (!hasAddon) {
    ui.emptyTree.classList.remove("hidden");
    ui.projectTree.classList.add("hidden");
    ui.projectTree.innerHTML = "";
    ui.welcomeMessage.classList.remove("hidden");
    ui.blockEditor.classList.add("hidden");
    ui.addVisualBlockButton.disabled = true;
    return;
  }

  ui.emptyTree.classList.add("hidden");
  ui.projectTree.classList.remove("hidden");
  ui.projectTree.innerHTML = buildTreeHtml();
  ui.addVisualBlockButton.disabled = state.blocks.length === 0;
}

function buildTreeHtml() {
  const blockFiles = state.blocks
    .map((block) => `
      <div class="file-item visual" data-block-id="${block.identifier}">▣ ${block.name}</div>
      <div class="file-item">${block.behaviorPath}</div>
    `)
    .join("") || `<div class="file-item">Sin archivos todavía</div>`;

  const resourceFiles = state.blocks
    .map((block) => `
      <div class="file-item">${block.resourcePath}</div>
      <div class="file-item">resource_packs/textures/blocks/${slugify(block.name)}.png</div>
    `)
    .join("") || `<div class="file-item">Sin archivos todavía</div>`;

  return `
    <div class="folder red">
      <div class="folder-title">■ Behavior Pack</div>
      ${blockFiles}
    </div>
    <div class="folder blue">
      <div class="folder-title">■ Resource Pack</div>
      ${resourceFiles}
    </div>
  `;
}

function showBlockEditor(block) {
  ui.welcomeMessage.classList.add("hidden");
  ui.blockEditor.classList.remove("hidden");
  ui.blockNameLabel.textContent = block.name;
  ui.blockIdLabel.textContent = block.identifier;
  ui.canvasTitle.textContent = `Editando: ${block.name}`;
  initializeBlocklyOnce();
}

function initializeBlocklyOnce() {
  if (state.workspace) return;

  Blockly.Blocks.jumbo_block_health = {
    init() {
      this.appendDummyInput()
        .appendField("resistencia del bloque")
        .appendField(new Blockly.FieldNumber(5, 1, 100), "RESISTANCE");
      this.setColour(285);
      this.setTooltip("Bloque visual alpha para comportamiento básico.");
    },
  };

  Blockly.Blocks.jumbo_block_resistance = {
    init() {
      this.appendDummyInput()
        .appendField("destruir con herramienta")
        .appendField(new Blockly.FieldDropdown([["pico", "pickaxe"], ["mano", "hand"]]), "TOOL");
      this.setColour(260);
      this.setTooltip("Define una idea de herramienta. La exportación real vendrá después.");
    },
  };

  state.workspace = Blockly.inject("blocklyDiv", {
    toolbox: document.getElementById("toolbox"),
    trashcan: true,
    scrollbars: true,
    zoom: {
      controls: true,
      wheel: true,
      startScale: 0.85,
      maxScale: 1.4,
      minScale: 0.5,
      scaleSpeed: 1.1,
    },
  });
}

ui.newAddonButton.addEventListener("click", () => openModal(ui.newAddonModal));

ui.newAddonForm.addEventListener("submit", (event) => {
  event.preventDefault();
  createAddon(ui.addonNameInput.value, ui.addonDescriptionInput.value);
  closeModals();
  ui.newAddonForm.reset();
});

ui.moreButton.addEventListener("click", () => {
  if (!state.addon) return;
  ui.moreMenu.classList.toggle("hidden");
});

ui.createNewButton.addEventListener("click", () => {
  ui.moreMenu.classList.add("hidden");
  ui.createPanel.classList.remove("hidden");
});

ui.closeCreatePanel.addEventListener("click", () => ui.createPanel.classList.add("hidden"));

ui.createBlockButton.addEventListener("click", () => {
  ui.createPanel.classList.add("hidden");
  const suggested = state.addon ? `jumbo:${slugify(state.addon.name)}_block` : "jumbo:mi_bloque";
  ui.blockIdInput.value = suggested;
  openModal(ui.newBlockModal);
});

ui.newBlockForm.addEventListener("submit", (event) => {
  event.preventDefault();
  createBasicBlock(ui.blockNameInput.value, ui.blockIdInput.value);
  closeModals();
  ui.newBlockForm.reset();
});

ui.addVisualBlockButton.addEventListener("click", () => {
  const firstBlock = state.blocks[0];
  if (firstBlock) showBlockEditor(firstBlock);
});

document.querySelectorAll("[data-close-modal]").forEach((button) => {
  button.addEventListener("click", closeModals);
});

renderApp();
