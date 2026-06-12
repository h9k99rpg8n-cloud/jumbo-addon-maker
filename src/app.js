const state = {
  mobName: "jumbo:custom_mob",
  health: 20,
  speed: 0.25,
  damage: 3,
};

Blockly.Blocks.jumbo_create_mob = {
  init() {
    this.appendDummyInput()
      .appendField("crear mob")
      .appendField(new Blockly.FieldTextInput("jumbo:custom_mob"), "MOB_NAME");
    this.setNextStatement(true, null);
    this.setColour(155);
    this.setTooltip("Define el identificador del mob.");
  },
};

Blockly.Blocks.jumbo_set_health = {
  init() {
    this.appendDummyInput()
      .appendField("vida")
      .appendField(new Blockly.FieldNumber(20, 1, 500), "HEALTH");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(120);
    this.setTooltip("Define la vida máxima del mob.");
  },
};

Blockly.Blocks.jumbo_set_speed = {
  init() {
    this.appendDummyInput()
      .appendField("velocidad")
      .appendField(new Blockly.FieldNumber(0.25, 0, 3, 0.05), "SPEED");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(210);
    this.setTooltip("Define la velocidad de movimiento.");
  },
};

Blockly.Blocks.jumbo_set_damage = {
  init() {
    this.appendDummyInput()
      .appendField("daño")
      .appendField(new Blockly.FieldNumber(3, 0, 100), "DAMAGE");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(20);
    this.setTooltip("Define el daño del ataque cuerpo a cuerpo.");
  },
};

const workspace = Blockly.inject("blocklyDiv", {
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

function readWorkspace() {
  const blocks = workspace.getTopBlocks(true);

  state.mobName = "jumbo:custom_mob";
  state.health = 20;
  state.speed = 0.25;
  state.damage = 3;

  for (const topBlock of blocks) {
    let block = topBlock;
    while (block) {
      if (block.type === "jumbo_create_mob") {
        state.mobName = block.getFieldValue("MOB_NAME") || state.mobName;
      }
      if (block.type === "jumbo_set_health") {
        state.health = Number(block.getFieldValue("HEALTH"));
      }
      if (block.type === "jumbo_set_speed") {
        state.speed = Number(block.getFieldValue("SPEED"));
      }
      if (block.type === "jumbo_set_damage") {
        state.damage = Number(block.getFieldValue("DAMAGE"));
      }
      block = block.getNextBlock();
    }
  }
}

function buildBedrockEntityJson() {
  return {
    "format_version": "1.20.80",
    "minecraft:entity": {
      description: {
        identifier: state.mobName,
        is_spawnable: true,
        is_summonable: true,
        is_experimental: false,
      },
      components: {
        "minecraft:type_family": {
          family: ["monster", "jumbo_custom"],
        },
        "minecraft:health": {
          value: state.health,
          max: state.health,
        },
        "minecraft:movement": {
          value: state.speed,
        },
        "minecraft:attack": {
          damage: state.damage,
        },
        "minecraft:collision_box": {
          width: 0.6,
          height: 1.9,
        },
        "minecraft:physics": {},
        "minecraft:pushable": {
          is_pushable: true,
          is_pushable_by_piston: true,
        },
      },
    },
  };
}

function updateOutput() {
  readWorkspace();
  const json = buildBedrockEntityJson();
  document.getElementById("jsonOutput").textContent = JSON.stringify(json, null, 2);
}

function downloadJson() {
  updateOutput();
  const fileName = `${state.mobName.replace(/[^a-z0-9_-]/gi, "_")}.json`;
  const blob = new Blob([document.getElementById("jsonOutput").textContent], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

workspace.addChangeListener(updateOutput);
document.getElementById("downloadJson").addEventListener("click", downloadJson);

const startBlock = workspace.newBlock("jumbo_create_mob");
startBlock.initSvg();
startBlock.render();
startBlock.moveBy(40, 40);

const healthBlock = workspace.newBlock("jumbo_set_health");
healthBlock.initSvg();
healthBlock.render();
startBlock.nextConnection.connect(healthBlock.previousConnection);

const speedBlock = workspace.newBlock("jumbo_set_speed");
speedBlock.initSvg();
speedBlock.render();
healthBlock.nextConnection.connect(speedBlock.previousConnection);

const damageBlock = workspace.newBlock("jumbo_set_damage");
damageBlock.initSvg();
damageBlock.render();
speedBlock.nextConnection.connect(damageBlock.previousConnection);

updateOutput();
