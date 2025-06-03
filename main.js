// モード切替用 固定プロンプト定義
const basePrompts = {
  "2d": "(score_9), (score_8_up), (score_7_up), flat color, anime shading, clean line art",
  "2.5d": "(score_9), (score_8_up), (score_7_up), dslr, real human texture, soft focus, film grain, candid moment, subtle imperfections",
  "real": "(score_9), (score_8_up), (score_7_up), hyperrealism, photorealistic, shallow depth of field, cinematic lighting"
};

// 初期化時処理
window.addEventListener('DOMContentLoaded', () => {
  reloadTagsFromFile('tags_default.json');
  loadLoraOptions();
  updatePositivePrompt();
  updateLoraPrompt();
});

// 現在のモード取得
function getCurrentMode() {
  return document.querySelector('input[name="mode"]:checked').value;
}

// タグUI再読み込み
async function reloadTagsFromFile(filename) {
  const res = await fetch(filename);
  const data = await res.json();

  document.getElementById('tag-container').innerHTML = '';
  document.getElementById('nsfw-tag-container').innerHTML = '';

  data.forEach(group => {
    const normalGroup = document.createElement('div');
    const nsfwGroup = document.createElement('div');

    group.tags.forEach(tag => {
      const label = document.createElement('label');
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.value = tag.value;
      label.appendChild(input);
      label.append(` ${tag.label}`);

      if (tag.nsfw) {
        nsfwGroup.appendChild(label);
      } else {
        normalGroup.appendChild(label);
      }
    });

    if (normalGroup.hasChildNodes()) {
      document.getElementById('tag-container').appendChild(normalGroup);
    }
    if (nsfwGroup.hasChildNodes()) {
      document.getElementById('nsfw-tag-container').appendChild(nsfwGroup);
    }
  });

  updatePositivePrompt();
}

// LoRA UI生成
async function loadLoraOptions() {
  const res = await fetch('lora.json');
  const data = await res.json();
  const container = document.getElementById('lora-container');

  data.forEach(item => {
    const wrap = document.createElement('div');
    wrap.className = 'lora-option';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.dataset.value = item.value;
    checkbox.id = `lora-${item.value}`;

    const label = document.createElement('label');
    label.htmlFor = checkbox.id;
    label.textContent = item.label;

    const range = document.createElement('input');
    range.type = 'range';
    range.min = '0.1';
    range.max = '1.5';
    range.step = '0.1';
    range.value = '0.7';
    range.disabled = true;

    checkbox.addEventListener('change', () => {
      range.disabled = !checkbox.checked;
      updateLoraPrompt();
    });
    range.addEventListener('input', updateLoraPrompt);

    wrap.appendChild(checkbox);
    wrap.appendChild(label);
    wrap.appendChild(range);
    container.appendChild(wrap);
  });
}

// Positive Prompt 更新
function updatePositivePrompt() {
  const fixed = basePrompts[getCurrentMode()];
  const selected = collectSelectedTags().join(', ');
  document.getElementById("positive-output").value = `${fixed}${selected ? ', ' + selected : ''}`;
}

// LoRA Prompt 更新
function updateLoraPrompt() {
  const options = document.querySelectorAll('.lora-option input[type="checkbox"]:checked');
  const result = Array.from(options).map(cb => {
    const val = cb.dataset.value;
    const range = cb.nextSibling.nextSibling;
    return `<lora:${val}:${range.value}>`;
  });
  document.getElementById('lora-output').value = result.join(', ');
}

// タグ取得（NSFW含む）
function collectSelectedTags() {
  const allTags = [...document.querySelectorAll('#tag-container input[type="checkbox"]:checked')];
  if (document.getElementById('enable-nsfw').checked) {
    allTags.push(...document.querySelectorAll('#nsfw-tag-container input[type="checkbox"]:checked'));
  }
  return allTags.map(cb => cb.value);
}

// タグ・モード変更に連動して自動更新
document.addEventListener('change', event => {
  if (
    event.target.closest('#tag-container') ||
    event.target.closest('#nsfw-tag-container') ||
    event.target.id === 'enable-nsfw' ||
    event.target.name === 'mode'
  ) {
    updatePositivePrompt();
  }
});

// LoRA即時更新
document.addEventListener('input', event => {
  if (event.target.closest('#lora-container')) {
    updateLoraPrompt();
  }
});

// NSFW切替時表示制御
document.getElementById('enable-nsfw').addEventListener('change', e => {
  document.getElementById('nsfw-tag-ui').style.display = e.target.checked ? 'block' : 'none';
  updatePositivePrompt();
});

// 出力欄用コピーボタン／リセット
function copyToClipboard(id) {
  const el = document.getElementById(id);
  el.select();
  el.setSelectionRange(0, 99999);
  document.execCommand("copy");
  alert("コピーしました！");
}
function clearPrompt(id) {
  document.getElementById(id).value = "";
}

// プリセット保存
function savePreset() {
  const preset = {
    mode: getCurrentMode(),
    positive: document.getElementById('positive-output').value,
    negative: document.getElementById('negative-output').value,
    lora: document.getElementById('lora-output').value,
    tags: Array.from(document.querySelectorAll('#tag-container input:checked')).map(i => i.value),
    nsfwTags: Array.from(document.querySelectorAll('#nsfw-tag-container input:checked')).map(i => i.value),
    loras: Array.from(document.querySelectorAll('#lora-container input[type="checkbox"]:checked')).map(cb => {
      return {
        value: cb.dataset.value,
        strength: cb.nextSibling.nextSibling.value
      };
    }),
    nsfwEnabled: document.getElementById('enable-nsfw').checked
  };
  localStorage.setItem('promptPreset', JSON.stringify(preset));
  alert("プリセット保存完了");
}

// プリセット読込
function loadPreset() {
  const preset = JSON.parse(localStorage.getItem('promptPreset'));
  if (!preset) return alert("保存データなし");

  document.querySelector(`input[name="mode"][value="${preset.mode}"]`).checked = true;
  document.getElementById('enable-nsfw').checked = preset.nsfwEnabled;
  document.getElementById('nsfw-tag-ui').style.display = preset.nsfwEnabled ? 'block' : 'none';

  document.querySelectorAll('#tag-container input').forEach(i => i.checked = preset.tags.includes(i.value));
  document.querySelectorAll('#nsfw-tag-container input').forEach(i => i.checked = preset.nsfwTags.includes(i.value));

  document.querySelectorAll('#lora-container .lora-option').forEach(opt => {
    const cb = opt.querySelector('input[type="checkbox"]');
    const range = cb.nextSibling.nextSibling;
    const match = preset.loras.find(l => l.value === cb.dataset.value);
    cb.checked = !!match;
    range.disabled = !match;
    range.value = match ? match.strength : '0.7';
  });

  document.getElementById('positive-output').value = preset.positive;
  document.getElementById('negative-output').value = preset.negative;
  document.getElementById('lora-output').value = preset.lora;
}

// プリセット削除
function clearPreset() {
  localStorage.removeItem('promptPreset');
  alert("プリセット削除済");
}

// 全体初期化
function resetAll() {
  document.querySelectorAll('#tag-container input, #nsfw-tag-container input').forEach(i => i.checked = false);
  document.querySelector('input[name="mode"][value="2d"]').checked = true;
  document.getElementById('enable-nsfw').checked = false;
  document.getElementById('nsfw-tag-ui').style.display = 'none';

  document.querySelectorAll('#lora-container .lora-option').forEach(opt => {
    const cb = opt.querySelector('input[type="checkbox"]');
    const range = cb.nextSibling.nextSibling;
    cb.checked = false;
    range.disabled = true;
    range.value = '0.7';
  });

  document.getElementById('positive-output').value = "";
  document.getElementById('negative-output').value = "";
  document.getElementById('lora-output').value = "";
}
