// ▼ 2024-06-03版：アップロード済み18ファイルを完全網羅
const tagFiles = [
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

// ▼ セレクト自動生成
function generateTagDatasetSelect() {
  const select = document.getElementById('tag-dataset');
  select.innerHTML = '';
  tagFiles.forEach(f => {
    const opt = document.createElement('option');
    opt.value = f.value;
    opt.textContent = f.label;
    select.appendChild(opt);
  });
  select.addEventListener('change', e => reloadTagsFromFile(e.target.value));
}

// ▼ タグ・キャラどちらも対応のロード関数
async function reloadTagsFromFile(filename) {
  try {
    const res = await fetch(filename);
    const data = await res.json();

    let groups = [];
    if (data.transformation && Array.isArray(data.transformation)) {
      groups = data.transformation;
    }
    else if (data.group && data.tags && Array.isArray(data.tags)) {
      groups = [data];
    }
    else if (Array.isArray(data) && data[0]?.tags) {
      groups = data;
    }
    else {
      alert("未対応json型: " + JSON.stringify(data));
      document.getElementById('tag-container').innerHTML = '';
      document.getElementById('nsfw-tag-container').innerHTML = '';
      return;
    }

    document.getElementById('tag-container').innerHTML = '';
    document.getElementById('nsfw-tag-container').innerHTML = '';

    groups.forEach(group => {
      const groupHeader = document.createElement('div');
      groupHeader.innerHTML = `<b>${group.group || ""}${group.label ? "｜" + group.label : ""}</b>`;
      document.getElementById('tag-container').appendChild(groupHeader);

      const tagBox = document.createElement('div');
      (group.tags || []).forEach(tag => {
        const label = document.createElement('label');
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.value = tag.value;
        label.appendChild(input);
        label.append(` ${tag.label}`);
        tagBox.appendChild(label);
      });
      document.getElementById('tag-container').appendChild(tagBox);
    });

    updatePositivePrompt?.();
  } catch (e) {
    alert('ファイル読み込みエラー: ' + e.message);
    document.getElementById('tag-container').innerHTML = '';
    document.getElementById('nsfw-tag-container').innerHTML = '';
  }
}

// ▼ ページ初期化
window.addEventListener('DOMContentLoaded', () => {
  generateTagDatasetSelect();
  reloadTagsFromFile(tagFiles[0].value);
  loadLoraOptions?.();
  updatePositivePrompt?.();
  updateLoraPrompt?.();
});
