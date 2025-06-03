const PROMPTS = {
  "2.5D": {
    positive: "(score_9), (score_8_up), (score_7_up), dslr, real human texture, soft focus, film grain, candid moment, subtle imperfections",
    negative: "(score_6), (score_5), (score_4), simplified, abstract, unrealistic, impressionistic, low_quality, bad_anatomy, extra_limbs"
  },
  "2D": {
    positive: "(score_9), (score_8_up), (score_7_up), flat color, anime shading, clean line art",
    negative: "(score_6), (score_5), (score_4), simplified, abstract, unrealistic, impressionistic, low_quality, bad_anatomy, extra_limbs"
  }
};

const LORA_LIST = [
  { label: "中村レグラ風", value: "<lora:Nakamura_Regura_Style_XL:0.8>" },
  { label: "プッシーリリー", value: "<lora:Pussy_Lily_v5_XL:0.6>" },
  { label: "高精細な瞳", value: "<lora:Eyes_High_Definition-00007:0.5>" },
  { label: "ヘアスタイル", value: "<lora:hair_style:0.4>" },
  { label: "制服セット", value: "<lora:school_uniform_XL:0.7>" },
  { label: "ランジェリーセット", value: "<lora:lingerie_XL:0.7>" },
  { label: "Pussyロッタ", value: "<lora:Pussy_Lotte_v6_XL_nf:0.7>" }
];

// 必要なタグJSONファイル名を全部ここに列挙
const tagFiles = [
  // ここに18ファイル全部
  { value: "background_location_tags.json", label: "背景ロケーション" },
  { value: "camera_angle_tags_nsfw.json", label: "カメラアングル(NSFW含)" },
  { value: "camera_effect_tags.json", label: "カメラエフェクト" },
  { value: "chitose_rio_albera_profile.json", label: "千歳りお／アルベラ" },
  { value: "expression_acting_tags_nsfw.json", label: "表情・演技(NSFW含)" },
  { value: "fine_orphelia_character_profile.json", label: "ファイン・オルフェリア" },
  { value: "fluids_tags_nsfw.json", label: "液体(NSFW含)" },
  { value: "fryu_nemecia_complete_profile.json", label: "フリュー・ネメシア" },
  { value: "hiyori_noir_character_profile.json", label: "日和ノワール" },
  { value: "kirishima_hikaru_hyumina_profile.json", label: "霧島ヒカル・ヒュミナ" },
  { value: "kotoha_lilith_character_profile.json", label: "ことは／リリス＝ヴェルティア" },
  { value: "mina_rocca_mob_blacksmith_apprentice.json", label: "ミナ・ロッカ（鍛冶見習い）" },
  { value: "noa_berne_complete_profile.json", label: "ノア・ベルネ" },
  { value: "pose_angle_tags_nsfw_extended.json", label: "ポーズ(NSFW拡張)" },
  { value: "serene_brahail_character_profile.json", label: "セリーヌ・ブラヘイル" },
  { value: "tsubasa_kaguya_character_profile.json", label: "ツバサ・カグヤ" },
  { value: "valmia_nova_character_profile.json", label: "ヴァルミア・ノヴァ" },
  { value: "yui_kardina_complete_profile.json", label: "ユイ・カルディナ" }
];

let mode = "2.5D";
let loraSelections = [];
let selectedTags = [];

function setMode(newMode) {
  mode = newMode;
  document.getElementById('mode-2_5d').classList.toggle('selected', mode === "2.5D");
  document.getElementById('mode-2d').classList.toggle('selected', mode === "2D");
  updatePrompts();
}

function renderLoraUI() {
  const loraBox = document.getElementById('lora-container');
  loraBox.innerHTML = "<b>LoRA選択：</b>";
  LORA_LIST.forEach((item, i) => {
    const id = `lora-${i}`;
    const chk = document.createElement('input');
    chk.type = 'checkbox';
    chk.id = id;
    chk.value = item.value;
    chk.addEventListener('change', () => {
      loraSelections = LORA_LIST.filter((_,j) => document.getElementById(`lora-${j}`).checked).map(l => l.value);
      updatePrompts();
    });
    const lbl = document.createElement('label');
    lbl.htmlFor = id;
    lbl.innerText = item.label;
    loraBox.appendChild(chk);
    loraBox.appendChild(lbl);
  });
}

function renderTagSelect() {
  const box = document.getElementById('tag-container');
  // セレクト
  let select = document.createElement('select');
  select.id = "tag-dataset";
  tagFiles.forEach(f => {
    let opt = document.createElement('option');
    opt.value = f.value;
    opt.textContent = f.label;
    select.appendChild(opt);
  });
  select.addEventListener('change', e => loadTagsFile(e.target.value));
  box.innerHTML = '';
  box.appendChild(document.createTextNode("カテゴリ選択："));
  box.appendChild(select);
  // 最初のファイル
  loadTagsFile(tagFiles[0].value);
}

async function loadTagsFile(filename) {
  const box = document.getElementById('tag-container');
  let res = await fetch(filename);
  let data = await res.json();

  // group抽出
  let groups = [];
  if (data.transformation && Array.isArray(data.transformation)) {
    groups = data.transformation;
  } else if (data.group && data.tags && Array.isArray(data.tags)) {
    groups = [data];
  } else if (Array.isArray(data) && data[0]?.tags) {
    groups = data;
  } else {
    box.innerHTML += '<div style="color:red;">未対応ファイル</div>';
    return;
  }

  // タグ選択UI
  let tagArea = document.createElement('div');
  groups.forEach((group, gi) => {
    let title = document.createElement('div');
    title.innerHTML = `<b>${group.group || ""}${group.label ? "｜" + group.label : ""}</b>`;
    tagArea.appendChild(title);
    let tg = document.createElement('div');
    (group.tags || []).forEach((tag, ti) => {
      const id = `tag-${gi}-${ti}`;
      const chk = document.createElement('input');
      chk.type = 'checkbox';
      chk.id = id;
      chk.value = tag.value;
      chk.addEventListener('change', () => {
        selectedTags = [...document.querySelectorAll('#tag-container input[type=checkbox]:checked')].map(e=>e.value);
        updatePrompts();
      });
      const lbl = document.createElement('label');
      lbl.htmlFor = id;
      lbl.innerText = tag.label;
      tg.appendChild(chk);
      tg.appendChild(lbl);
    });
    tagArea.appendChild(tg);
  });
  // 既存のselectは残す
  while (box.childNodes.length > 1) box.removeChild(box.lastChild);
  box.appendChild(tagArea);

  selectedTags = [];
  updatePrompts();
}

function updatePrompts() {
  // Positive
  let positive = PROMPTS[mode].positive;
  if (selectedTags.length > 0) positive += ", " + selectedTags.join(", ");
  document.getElementById('positive-output').value = positive;
  // Negative
  document.getElementById('negative-output').value = PROMPTS[mode].negative;
  // LoRA
  document.getElementById('lora-output').value = loraSelections.join(" ");
}

function copyPrompt(id) {
  let el = document.getElementById(id);
  el.select();
  document.execCommand("copy");
}

function copyAllPrompts() {
  let s = document.getElementById('positive-output').value + "\n" +
          document.getElementById('negative-output').value + "\n" +
          document.getElementById('lora-output').value;
  navigator.clipboard.writeText(s);
}

function resetAll() {
  document.querySelectorAll('#tag-container input[type=checkbox]').forEach(e => e.checked = false);
  document.querySelectorAll('#lora-container input[type=checkbox]').forEach(e => e.checked = false);
  selectedTags = [];
  loraSelections = [];
  updatePrompts();
}

window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('mode-2_5d').onclick = () => setMode("2.5D");
  document.getElementById('mode-2d').onclick = () => setMode("2D");
  document.getElementById('reset-btn').onclick = resetAll;
  renderLoraUI();
  renderTagSelect();
  updatePrompts();
});
